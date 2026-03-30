const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function connectDB() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected via Prisma');
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        // During migration, we might not have the client generated yet
        if (err.message.includes('Cannot find module')) {
            console.warn('⚠️ Prisma Client not generated yet. Run npx prisma generate.');
        } else {
            process.exit(1);
        }
    }
}

module.exports = { connectDB, prisma };
