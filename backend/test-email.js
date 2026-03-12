const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function testEmail() {
    const fs = require('fs');
    const logFile = 'email-test-log.txt';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
    };

    if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

    log('Testing SMTP connection...');
    log(`Host: ${process.env.SMTP_HOST}`);
    log(`Port: ${process.env.SMTP_PORT}`);
    log(`User: ${process.env.SMTP_USER}`);
    
    try {
        log('Verifying transporter...');
        await transporter.verify();
        log('STMP connection verified successfully!');
        
        log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'Unswap <noreply@unswap.app>',
            to: process.env.SMTP_USER, // Send to self for test
            subject: 'Test Email',
            text: 'This is a test email to verify SMTP configuration.',
        });
        log(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
        log('SMTP Error detected:');
        log(error);
        if (error.stack) log(error.stack);
    }
}

testEmail();
