const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../db');
const { sendEmail } = require('./email');
const router = express.Router();

// ─── Token store (in-memory, 15-min TTL) ──────────────────────────────────────
const pendingWaitlist = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingWaitlist) {
        if (val.expiresAt < now) pendingWaitlist.delete(key);
    }
}, 60 * 1000);

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ─── POST /api/waitlist/join/initiate ─────────────────────────────────────────
// Sends confirmation link to email; does NOT write to the DB yet.
router.post('/join/initiate', async (req, res) => {
    try {
        const { email, name, organization, ref } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const normalizedEmail = email.toLowerCase();

        // Already on waitlist? Check local DB as fallback
        const existing = await prisma.waitlistEntry.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(409).json({ error: 'This email is already on the waitlist.' });
        }

        const token = generateToken();
        pendingWaitlist.set(token, {
            email: normalizedEmail,
            name,
            organization,
            ref,
            expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
        });

        const confirmUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/waitlist/confirm?token=${token}`;

        await sendEmail({
            to: normalizedEmail,
            subject: 'Confirm your waitlist spot',
            body: `Click this link to confirm your spot: ${confirmUrl}`,
            html: `
                <div style="font-family: sans-serif; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <div style="margin-bottom: 24px;">
                        <h2 style="color: #1e293b; font-weight: 600; font-size: 24px; margin: 0;">You're almost in! ✉️</h2>
                    </div>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                        Click the button below to confirm your email and secure your spot on the UNswap waitlist.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${confirmUrl}" style="background: #2563ea; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Confirm Email</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
                </div>
            `
        });

        res.status(200).json({ success: true, message: 'Confirmation link sent to your email.' });
    } catch (err) {
        console.error('Waitlist initiate error:', err);
        res.status(500).json({ error: 'Failed to send confirmation link' });
    }
});

// ─── GET /api/waitlist/confirm ────────────────────────────────────────────────
// Validates token, sends to Waitlister API, and redirects
router.get('/confirm', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send('Token is required');

        const pending = pendingWaitlist.get(token);

        if (!pending) {
            return res.redirect(`${process.env.WAITLIST_FRONTEND_URL}?error=No+pending+signup+found+or+it+has+expired`);
        }
        if (Date.now() > pending.expiresAt) {
            pendingWaitlist.delete(token);
            return res.redirect(`${process.env.WAITLIST_FRONTEND_URL}?error=Confirmation+link+expired`);
        }

        const waitlisterApiKey = process.env.WAITLISTER_API_KEY;
        const waitlisterWaitlistKey = process.env.WAITLISTER_WAITLIST_KEY;

        if (!waitlisterApiKey || !waitlisterWaitlistKey) {
            console.error('Waitlister API keys not configured');
            return res.status(500).send('Waitlister configuration error.');
        }

        // Call Waitlister API
        const wlResponse = await fetch(`https://waitlister.me/api/v1/waitlist/${waitlisterWaitlistKey}/sign-up`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': waitlisterApiKey,
                'Accept': 'application/json',
                'User-Agent': 'Node/18 (Unswap Backend)'
            },
            body: JSON.stringify({
                email: pending.email,
                name: pending.name,
                metadata: {
                    referred_by: pending.ref || undefined,
                    organization: pending.organization || undefined
                }
            })
        });

        const wlData = await wlResponse.json();

        if (!wlResponse.ok || !wlData.success) {
            console.error('Waitlister API error:', wlData);
            return res.status(500).send('Failed to sign up on Waitlister.');
        }

        // Token verified & Waitlister succeeded — remove from pending store
        pendingWaitlist.delete(token);

        // Keep local DB in sync (using Waitlister's generated referral_code)
        try {
            await prisma.waitlistEntry.create({
                data: {
                    email: pending.email,
                    full_name: pending.name,
                    organization: pending.organization,
                    waitlist_position: wlData.position,
                    referral_code: wlData.referral_code,
                    referred_by: pending.ref || null,
                    is_verified: true
                }
            });
        } catch (dbErr) {
            console.warn('Silent fail writing to local waitlist shadow DB:', dbErr.message);
        }

        // Redirect user directly to their waitlister redirect URL status page
        if (wlData.redirect_url) {
            return res.redirect(wlData.redirect_url);
        } else {
            return res.send('Successfully joined the waitlist!');
        }

    } catch (err) {
        console.error('Waitlist confirm error:', err);
        res.status(500).send('Failed to confirm waitlist signup');
    }
});

// ─── GET /api/waitlist/count ──────────────────────────────────────────────────
router.get('/count', async (req, res) => {
    try {
        const waitlisterApiKey = process.env.WAITLISTER_API_KEY;
        const waitlisterWaitlistKey = process.env.WAITLISTER_WAITLIST_KEY;

        if (!waitlisterApiKey || !waitlisterWaitlistKey) {
            return res.json({ count: 0, recentJoiners: [] });
        }

        // Fetch recent subscribers from Waitlister directly
        const wlResponse = await fetch(`https://waitlister.me/api/v1/waitlist/${waitlisterWaitlistKey}/subscribers?limit=4&sort_by=date&sort_dir=desc`, {
            method: 'GET',
            headers: {
                'X-Api-Key': waitlisterApiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Node/18 (Unswap Backend)'
            }
        });

        const wlData = await wlResponse.json();

        if (!wlResponse.ok || !wlData.success) {
            console.error('Waitlister count API error:', wlData);
            // Fallback gracefully so frontend doesn't crash
            return res.json({ count: 0, recentJoiners: [] });
        }

        const count = wlData.data.total || 0;

        const recentJoiners = (wlData.data.subscribers || []).map(u => ({
            initials: u.name
                ? u.name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                : u.email[0].toUpperCase(),
        }));

        res.json({ count, recentJoiners });
    } catch (err) {
        console.error('Waitlist count error:', err);
        res.status(500).json({ error: 'Failed to get waitlist count from Waitlister' });
    }
});

// ─── GET /api/waitlist/status ──────────────────────────────────────────────────
router.get('/status', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const waitlisterApiKey = process.env.WAITLISTER_API_KEY;
        const waitlisterWaitlistKey = process.env.WAITLISTER_WAITLIST_KEY;

        if (!waitlisterApiKey || !waitlisterWaitlistKey) {
            return res.status(500).json({ error: 'Waitlister API keys not configured' });
        }

        const wlResponse = await fetch(`https://waitlister.me/api/v1/waitlist/${waitlisterWaitlistKey}/subscribers/${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': waitlisterApiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Node/18 (Unswap Backend)'
            }
        });

        const wlData = await wlResponse.json();

        if (!wlResponse.ok || !wlData.success || !wlData.data?.subscriber) {
            return res.json({ found: false });
        }

        // Return the thank you URL so the frontend can redirect
        return res.json({ found: true, thank_you_url: wlData.data.subscriber.thank_you_url });

    } catch (err) {
        console.error('Waitlist status error:', err);
        res.status(500).json({ error: 'Failed to get waitlist status' });
    }
});

module.exports = router;
