const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    };

    for (const [key, val] of Object.entries(query)) {
        if (skip.includes(key)) continue;

        let parsedVal = val;
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
            try {
                parsedVal = JSON.parse(val);
            } catch (e) { }
        }

        if (key === '$or' || key === '$and') {
            const prismaKey = key === '$or' ? 'OR' : 'AND';
            filter[prismaKey] = Array.isArray(parsedVal) ? parsedVal.map(item => buildFilter(item)) : parsedVal;
            continue;
        }

        if (parsedVal && typeof parsedVal === 'object' && !Array.isArray(parsedVal)) {
            const prismaSubFilter = {};
            for (const [opKey, opVal] of Object.entries(parsedVal)) {
                const prismaOp = OPERATOR_MAP[opKey] || opKey.replace('$', '');
                prismaSubFilter[prismaOp] = opVal;
            }
            filter[key] = prismaSubFilter;
            continue;
        }

        if (key.endsWith('__gt')) {
            filter[key.replace('__gt', '')] = { gt: isNaN(val) ? val : Number(val) };
        } else if (key.endsWith('__gte')) {
            filter[key.replace('__gte', '')] = { gte: isNaN(val) ? val : Number(val) };
        } else if (key.endsWith('__lt')) {
            filter[key.replace('__lt', '')] = { lt: isNaN(val) ? val : Number(val) };
        } else if (key.endsWith('__lte')) {
            filter[key.replace('__lte', '')] = { lte: isNaN(val) ? val : Number(val) };
        } else if (key.endsWith('__contains')) {
            filter[key.replace('__contains', '')] = { contains: val };
        } else if (key.endsWith('__in')) {
            filter[key.replace('__in', '')] = { in: Array.isArray(val) ? val : val.split(',') };
        } else {
            if (val === 'true') filter[key] = true;
            else if (val === 'false') filter[key] = false;
            else if (!isNaN(val) && val !== '' && typeof val === 'string') filter[key] = Number(val);
            else filter[key] = parsedVal;
        }
    }
    return filter;
}

async function run() {
    try {
        const reqQuery = {
            user_email: 'qasim@jacquelinetsuma.com',
            status: '{"$in":["pending","approved"]}'
        };
        const where = buildFilter(reqQuery);
        console.log('Built where filter:', JSON.stringify(where, null, 2));

        const records = await prisma.verification.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
        console.log('Records found:', records.length);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
