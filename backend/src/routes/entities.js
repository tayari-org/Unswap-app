/**
 * Generic entity CRUD router — Prisma version
 *
 * Routes:
 *   GET    /api/entities/:entity            - list / filter
 *   GET    /api/entities/:entity/:id        - get by id
 *   POST   /api/entities/:entity            - create
 *   PATCH  /api/entities/:entity/:id        - update
 *   DELETE /api/entities/:entity/:id        - delete
 */
const express = require('express');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { prisma } = require('../db');

const router = express.Router();

// Map entity name (PascalCase) → Prisma client property (camelCase)
const MODEL_PRISMA_MAP = {
    Property: 'property',
    SwapRequest: 'swapRequest',
    Message: 'message',
    Notification: 'notification',
    Verification: 'verification',
    Review: 'review',
    VideoCall: 'videoCall',
    SubscriptionPlan: 'subscriptionPlan',
    PaymentTransaction: 'paymentTransaction',
    GuestPointTransaction: 'guestPointTransaction',
    Referral: 'referral',
    ActivityLog: 'activityLog',
    PlatformSettings: 'platformSettings',
    User: 'user',
};

// Entities that can be read without auth
const PUBLIC_ENTITIES = ['Property', 'SubscriptionPlan', 'PlatformSettings', 'ActivityLog', 'Review'];

// Entities only admins can write to
const ADMIN_WRITE_ENTITIES = ['SubscriptionPlan', 'PlatformSettings', 'ActivityLog'];

/**
 * Transform Prisma record to match expected frontend keys (Base44 legacy)
 */
function transformRecord(record) {
    if (!record) return record;
    return {
        ...record,
        created_date: record.created_at,
        updated_date: record.updated_at,
    };
}

/**
 * Build a Prisma filter object from query params.
 * Converts Mongoose-style operators ($in, $or, etc.) to Prisma format.
 */
function buildFilter(query) {
    if (!query || typeof query !== 'object') return {};

    const filter = {};
    const skip = ['_sort', '_limit', '_offset'];

    const OPERATOR_MAP = {
        '$in': 'in',
        '$gt': 'gt',
        '$gte': 'gte',
        '$lt': 'lt',
        '$lte': 'lte',
        '$ne': 'ne',
        '$contains': 'contains',
        '$search': 'contains',
    };

    try {
        for (const [key, val] of Object.entries(query)) {
            if (skip.includes(key) || val === undefined || val === null) continue;

            let parsedVal = val;
            // 1. JSON Parsing for objects/arrays in query string
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try {
                    parsedVal = JSON.parse(val);
                } catch (e) { /* ignore */ }
            }

            // 2. Handle Logical Operators
            if (key === '$or' || key === '$and') {
                const prismaKey = key === '$or' ? 'OR' : 'AND';
                if (Array.isArray(parsedVal)) {
                    filter[prismaKey] = parsedVal.map(item => buildFilter(item));
                }
                continue;
            }

            // 3. Handle Nested Operators like { $in: [...] }
            if (parsedVal && typeof parsedVal === 'object' && !Array.isArray(parsedVal)) {
                const subFilter = {};
                let hasOperator = false;
                for (const [opKey, opVal] of Object.entries(parsedVal)) {
                    if (opKey.startsWith('$')) {
                        const prismaOp = OPERATOR_MAP[opKey] || opKey.replace('$', '');
                        subFilter[prismaOp] = opVal;
                        hasOperator = true;
                    }
                }
                if (hasOperator) {
                    filter[key] = subFilter;
                    continue;
                }
            }

            // 4. Handle Suffixes (legacy support)
            if (key.includes('__')) {
                const [field, suffix] = key.split('__');
                const prismaOp = OPERATOR_MAP['$' + suffix] || suffix;
                filter[field] = { ...filter[field], [prismaOp]: parsedVal };
                continue;
            }

            // 5. Default Equality + Smart Conversion
            if (val === 'true') filter[key] = true;
            else if (val === 'false') filter[key] = false;
            else if (typeof val === 'string' && val !== '' && !isNaN(Number(val)) && !val.includes('-') && !val.includes('@')) {
                // Numeric conversion only if it doesn't look like a date/ID or email
                filter[key] = Number(val);
            } else {
                filter[key] = parsedVal;
            }
        }
    } catch (err) {
        console.error('[buildFilter] Error constructing Prisma filter:', err);
        throw err;
    }

    return filter;
}

/**
 * Build Prisma order object
 */
function buildSort(sortParam) {
    if (!sortParam) return { created_at: 'desc' };
    const field = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
    const direction = sortParam.startsWith('-') ? 'desc' : 'asc';
    const fieldMap = { created_date: 'created_at', updated_date: 'updated_at', createdAt: 'created_at', updatedAt: 'updated_at' };
    return { [fieldMap[field] || field]: direction };
}

// ─── GET /api/entities/:entity ─────────────────────────────────────────────────
router.get('/:entity', optionalAuth, async (req, res) => {
    try {
        const { entity } = req.params;
        const prismaModel = MODEL_PRISMA_MAP[entity];
        if (!prismaModel) return res.status(404).json({ error: `Unknown entity: ${entity}` });

        const isPublic = PUBLIC_ENTITIES.includes(entity);
        if (!isPublic && !req.user) return res.status(401).json({ error: 'Authentication required' });

        const { _sort, _limit, _offset, ...filters } = req.query;
        const where = buildFilter(filters);
        const orderBy = buildSort(_sort);
        const take = _limit ? parseInt(_limit) : undefined;
        const skip = _offset ? parseInt(_offset) : 0;

        const records = await prisma[prismaModel].findMany({
            where,
            orderBy,
            take,
            skip,
        });

        res.json(records.map(transformRecord));
    } catch (err) {
        console.error(`[API] GET entities/${req.params.entity} error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/entities/:entity/:id ────────────────────────────────────────────
router.get('/:entity/:id', optionalAuth, async (req, res) => {
    try {
        const { entity, id } = req.params;
        const prismaModel = MODEL_PRISMA_MAP[entity];
        if (!prismaModel) return res.status(404).json({ error: `Unknown entity: ${entity}` });

        const isPublic = PUBLIC_ENTITIES.includes(entity);
        if (!isPublic && !req.user) return res.status(401).json({ error: 'Authentication required' });

        const record = await prisma[prismaModel].findUnique({ where: { id } });
        if (!record) return res.status(404).json({ error: 'Not found' });
        res.json(transformRecord(record));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/entities/:entity ───────────────────────────────────────────────
router.post('/:entity', requireAuth, async (req, res) => {
    try {
        const { entity } = req.params;
        const prismaModel = MODEL_PRISMA_MAP[entity];
        if (!prismaModel) return res.status(404).json({ error: `Unknown entity: ${entity}` });

        if (ADMIN_WRITE_ENTITIES.includes(entity) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const data = { ...req.body };
        delete data.id;
        delete data.created_at;
        delete data.updated_at;

        // Type conversion for certain fields if necessary (Prisma is stricter than Mongoose)
        // For example, strings that should be JSON
        const record = await prisma[prismaModel].create({ data });
        res.status(201).json(transformRecord(record));
    } catch (err) {
        console.error(`POST entities/${req.params.entity} error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// ─── PATCH /api/entities/:entity/:id ───────────────────────────────────────────
router.patch('/:entity/:id', requireAuth, async (req, res) => {
    try {
        const { entity, id } = req.params;
        const prismaModel = MODEL_PRISMA_MAP[entity];
        if (!prismaModel) return res.status(404).json({ error: `Unknown entity: ${entity}` });

        if (ADMIN_WRITE_ENTITIES.includes(entity) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const data = { ...req.body };
        delete data.id;
        delete data.created_at;
        delete data.updated_at;

        const record = await prisma[prismaModel].update({
            where: { id },
            data,
        });

        // Referral Hook: If a user is being updated to 'verified'
        if (entity === 'User' && data.verification_status === 'verified') {
            const { handleUserVerified } = require('../services/referralService');
            handleUserVerified(record.email);
        }

        res.json(transformRecord(record));
    } catch (err) {
        console.error(`PATCH entities/${req.params.entity}/${req.params.id} error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/entities/:entity/:id ─────────────────────────────────────────
router.delete('/:entity/:id', requireAuth, async (req, res) => {
    try {
        const { entity, id } = req.params;
        const prismaModel = MODEL_PRISMA_MAP[entity];
        if (!prismaModel) return res.status(404).json({ error: `Unknown entity: ${entity}` });

        if (ADMIN_WRITE_ENTITIES.includes(entity) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        await prisma[prismaModel].delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(`DELETE entities/${req.params.entity}/${req.params.id} error:`, err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
