/**
 * Email route + shared sendEmail helper
 * Replaces: base44.integrations.Core.SendEmail({ to, subject, body })
 *
 * POST /api/email/send
 */
const express = require('express');
const { Resend } = require('resend');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Only initialize Resend if the API key is present. 
// This prevents the app from crashing on startup if the key is missing.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Shared sendEmail helper — can be imported by other modules
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.body  - Plain text body
 * @param {string} [options.html] - Optional HTML body
 */
async function sendEmail({ to, subject, body, html }) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[Email] Resend API key not configured — skipping email to:', to);
        return { skipped: true };
    }
    
    // Use the verified domain from the environment, defaulting to app.unswap.net
    const fromAddress = process.env.EMAIL_FROM || 'Unswap <noreply@app.unswap.net>';

    try {
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: typeof to === 'string' ? [to] : to,
            subject,
            text: body,
            html: html || `<p>${body.replace(/\n/g, '<br>')}</p>`,
        });

        if (error) {
            console.error('[Email] Resend API Error:', error);
            throw new Error(error.message);
        }

        return { messageId: data.id };
    } catch (err) {
        console.error('[Email] Failed to send via Resend:', err);
        throw err;
    }
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
