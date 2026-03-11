const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmails() {
    const users = await prisma.user.findMany();
    console.log("ALL EMAILS JSON:", JSON.stringify(users.map(u => u.email)));

    const exactEmail = 'webdev@jacquelinetsuma.com';
    const user = users.find(u => u.email === exactEmail);

    if (user) {
        await prisma.user.update({
            where: { email: exactEmail },
            data: { role: 'admin' },
        });
        console.log(`\nSUCCESS: Updated ${exactEmail} to admin`);
    } else {
        // If not found, let's update any jacquelinetsuma.com email just in case
        const alternatives = users.filter(u => u.email.includes('jacquelinetsuma.com'));
        for (const alt of alternatives) {
            await prisma.user.update({
                where: { email: alt.email },
                data: { role: 'admin' },
            });
            console.log(`\nSUCCESS: Updated alternative ${alt.email} to admin`);
        }
    }

    await prisma.$disconnect();
}

checkEmails();
