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
    TypingStatus: 'typingStatus',
    PinnedConversation: 'pinnedConversation',
    MessageReaction: 'messageReaction',
};

// Entities that can be read without auth
const PUBLIC_ENTITIES = ['Property', 'SubscriptionPlan', 'PlatformSettings', 'ActivityLog', 'Review'];

// Entities only admins can write to
const ADMIN_WRITE_ENTITIES = ['SubscriptionPlan', 'PlatformSettings'];

// Mapping of entities and their JSON string fields for SQLite
const JSON_FIELDS = {
    Property: ['amenities', 'photos', 'images', 'swap_types_accepted', 'availability', 'mobility_tags', 'security_checklist'],
    User: ['languages', 'notification_preferences', 'swap_preferences'],
    Message: ['attachments'],
    PaymentTransaction: ['metadata'],
    GuestPointTransaction: ['metadata'],
    Referral: ['reward_details'],
    ActivityLog: ['metadata'],
    PlatformSettings: ['institutional_email_domains', 'public_settings'],
};

/**
 * Transform Prisma record to match expected frontend keys (Base44 legacy)
 */
function transformRecord(record, entity) {
    if (!record) return record;
    const result = {
        ...record,
        created_date: record.created_at,
        updated_date: record.updated_at,
    };

    // Parse JSON fields if they exist for this entity
    if (entity && JSON_FIELDS[entity]) {
        JSON_FIELDS[entity].forEach(field => {
            if (typeof result[field] === 'string') {
                try {
                    result[field] = JSON.parse(result[field]);
                } catch (e) {
                    console.warn(`[API] Failed to parse JSON field ${field} for ${entity}:`, e.message);
                }
            }
        });
    }

    return result;
}

/**
 * Preprocess data before sending to Prisma (stringifying arrays/objects for SQLite)
 */
function preprocessData(data, entity) {
    if (!data || !entity || !JSON_FIELDS[entity]) return data;

    const result = { ...data };
    JSON_FIELDS[entity].forEach(field => {
        if (result[field] !== undefined && result[field] !== null && typeof result[field] !== 'string') {
            result[field] = JSON.stringify(result[field]);
        }
    });
    return result;
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
    const fieldMap = {
        created_date: 'created_at',
        updated_date: 'updated_at',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        scheduled_time: 'scheduled_time' // Explicit mapping if needed, though name is identical now
    };
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

        res.json(records.map(r => transformRecord(r, entity)));
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
        res.json(transformRecord(record, entity));
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

        // stringify recognized arrays/objects for SQLite
        const processedData = preprocessData(data, entity);

        const record = await prisma[prismaModel].create({ data: processedData });
        res.status(201).json(transformRecord(record, entity));
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

        const processedData = preprocessData(data, entity);

        const record = await prisma[prismaModel].update({
            where: { id },
            data: processedData,
        });

        // Referral Hook: If a user is being updated to 'verified'
        if (entity === 'User' && data.verification_status === 'verified') {
            const { handleUserVerified } = require('../services/referralService');
            handleUserVerified(record.email);
        }

        res.json(transformRecord(record, entity));
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
