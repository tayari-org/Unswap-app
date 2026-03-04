const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const records = await prisma.verification.findMany();
        console.log('RECORDS_COUNT:', records.length);
        console.log('RECORDS:', JSON.stringify(records));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
