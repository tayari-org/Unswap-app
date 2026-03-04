const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeAdmin(email) {
    try {
        if (!email) {
            console.error('Please provide an email address.');
            process.exit(1);
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'admin' }
        });

        console.log(`Successfully promoted ${email} to admin!`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
makeAdmin(email);
