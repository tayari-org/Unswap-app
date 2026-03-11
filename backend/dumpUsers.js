const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkEmails() {
    const users = await prisma.user.findMany();
    fs.writeFileSync('users_dump.json', JSON.stringify(users.map(u => ({ email: u.email, role: u.role })), null, 2));
    await prisma.$disconnect();
}

checkEmails();
