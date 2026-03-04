const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const keys = Object.keys(prisma);
        const models = keys.filter(k => k[0] === k[0].toLowerCase() && !k.startsWith('$') && !k.startsWith('_'));
        console.log('PRISMA_MODELS:', models.join(', '));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
