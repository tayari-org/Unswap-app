const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.user.findFirst();
        console.log('USER_ID:', user.id);
        console.log('USER_EMAIL:', user.email);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
