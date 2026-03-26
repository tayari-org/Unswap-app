/**
 * db-waitlist.js — Prisma client for the separate waitlist database.
 *
 * Uses @prisma/waitlist-client (generated from prisma/waitlist.prisma).
 * The DB file is configured via the WAITLIST_DATABASE_URL env var,
 * defaulting to file:./prisma/waitlist.db
 */
const { PrismaClient } = require('@prisma/waitlist-client');

const waitlistPrisma = new PrismaClient();

async function connectWaitlistDB() {
    try {
        await waitlistPrisma.$connect();
        console.log('✅ Connected to Waitlist SQLite DB');
    } catch (err) {
        console.error('❌ Waitlist DB connection error:', err.message);
        if (err.message.includes('Cannot find module')) {
            console.warn('⚠️  Run: npx prisma generate --schema=prisma/waitlist.prisma');
        } else {
            process.exit(1);
        }
    }
}

module.exports = { connectWaitlistDB, waitlistPrisma };
