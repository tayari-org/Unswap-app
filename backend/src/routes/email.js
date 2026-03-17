/**
 * Email route + shared sendEmail helper
 * Replaces: base44.integrations.Core.SendEmail({ to, subject, body })
 *
 * POST /api/email/send
 */
const express = require('express');
const nodemailer = require('nodemailer');
const dns = require('dns');
const { requireAuth } = require('../middleware/auth');

// Force Node.js to prefer IPv4 for DNS resolution to avoid EDNS issues with Gmail SMTP
if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

const router = express.Router();

// ─── Nodemailer transporter ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Shared sendEmail helper — can be imported by other modules
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.body  - Plain text body
 * @param {string} [options.html] - Optional HTML body
 */
async function sendEmail({ to, subject, body, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[Email] SMTP not configured — skipping email to:', to);
        return { skipped: true };
    }
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Unswap <noreply@unswap.app>',
        to,
        subject,
        text: body,
        html: html || `<p>${body.replace(/\n/g, '<br>')}</p>`,
    });
    return { messageId: info.messageId };
}

// ─── POST /api/email/send ─────────────────────────────────────────────────────
router.post('/send', requireAuth, async (req, res) => {
    try {
        const { to, subject, body, html } = req.body;
        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'to, subject, and body are required' });
        }
        const result = await sendEmail({ to, subject, body, html });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

module.exports = router;
module.exports.sendEmail = sendEmail;
