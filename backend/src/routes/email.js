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
            // Resend returned an API-level error (auth, validation, etc.) — log but don't crash
            console.error('[Email] Resend API Error:', error);
            return { skipped: true, reason: error.message };
        }

        return { messageId: data.id };
    } catch (err) {
        // Network-level failure (DNS, timeout, no internet) — skip silently
        const isNetworkError = err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED'
            || err.code === 'ETIMEDOUT' || err.message?.includes('fetch') || err.message?.includes('resolve');
        if (isNetworkError) {
            console.warn('[Email] Network error reaching Resend — email skipped for:', to, `(${err.message})`);
            return { skipped: true, reason: 'network_error' };
        }
        console.error('[Email] Failed to send via Resend:', err);
        return { skipped: true, reason: err.message };
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
        // Always return 200 — skipped emails are non-fatal
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Email send error:', err);
        // Still return 200 so frontend notifications don't cascade-fail
        res.json({ success: false, skipped: true, reason: err.message });
    }
});

module.exports = router;
module.exports.sendEmail = sendEmail;
