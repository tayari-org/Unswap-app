require('dotenv').config();
const { sendEmail } = require('../src/routes/email');

async function main() {
    const recipient = process.argv[2];
    if (!recipient) {
        console.log('\n❌ Usage: node scripts/test-email.js <recipient-email>');
        process.exit(1);
    }

    console.log(`\n📧 Testing email service...`);
    console.log(`   From:    ${process.env.EMAIL_FROM}`);
    console.log(`   To:      ${recipient}`);
    console.log(`   Host:    ${process.env.SMTP_HOST}`);
    console.log(`   Auth:    ${process.env.SMTP_USER ? 'Configured' : 'MISSING'}\n`);

    try {
        const result = await sendEmail({
            to: recipient,
            subject: 'Unswap Email Test',
            body: 'If you are reading this, the email service is working correctly with your current SMTP settings!',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h1 style="color: #6366f1;">Unswap Email Test</h1>
                    <p>Congratulations! Your email service is working correctly.</p>
                    <p>Current SMTP Host: <code>${process.env.SMTP_HOST}</code></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #666;">This is an automated test from your local development environment.</p>
                </div>
            `,
        });

        if (result.skipped) {
            console.warn('⚠️  Email was skipped (SMTP not fully configured in .env).');
        } else {
            console.log('✅ Email sent successfully!');
            console.log('   Message ID:', result.messageId);
        }
    } catch (error) {
        console.error('❌ Failed to send email:');
        console.error(error);
    }
}

main();
