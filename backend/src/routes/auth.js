const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const INSTITUTIONAL_DOMAINS = [
    'un.org', 'undp.org', 'unicef.org', 'unhcr.org', 'unfpa.org', 'wfp.org',
    'who.int', 'ilo.org', 'fao.org', 'unep.org', 'unesco.org', 'unops.org',
    'unodc.org', 'unhabitat.org', 'ohchr.org', 'ocha.org', 'imf.org',
    'worldbank.org', 'ifc.org', 'miga.org', 'icsid.worldbank.org',
    'idb.org', 'adb.org', 'afdb.org', 'ebrd.com',
    'icrc.org', 'ifrc.org', 'iom.int',
    'nato.int', 'oecd.org', 'wto.org', 'bis.org',
    'state.gov', 'diplomatie.fr', 'fco.gov.uk', 'auswaertiges-amt.de',
    'government.nl', 'mae.es', 'esteri.it', 'mofa.go.jp', 'mofa.gov.cn',
];

function isInstitutionalEmail(email) {
    if (!email) return false;
    const domain = email.toLowerCase().split('@')[1];
    return INSTITUTIONAL_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function generateReferralCode() {
    return `UNSWAP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function signToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

function sanitizeUser(user) {
    if (!user) return user;
    const obj = { ...user };
    delete obj.password_hash;
    obj.created_date = user.created_at;
    obj.updated_date = user.updated_at;
    return obj;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, institution, referred_by } = req.body;

        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

        const password_hash = await bcrypt.hash(password, 12);
        const referral_code = generateReferralCode();
        const institutional_email_verified = isInstitutionalEmail(email);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password_hash,
                full_name: full_name || null,
                institution: institution || null,
                referral_code,
                referred_by: referred_by || null,
                institutional_email_verified,
                guest_points: 500,
            },
        });

        if (referred_by) {
            const referrer = await prisma.user.findUnique({
                where: { referral_code: referred_by }
            });
            if (referrer) {
                await prisma.referral.create({
                    data: {
                        referrer_email: referrer.email,
                        referred_email: user.email,
                        referred_name: full_name || null,
                        referred_user_status: 'registered',
                    },
                });
            }
        }

        const token = signToken(user.id);
        res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = signToken(user.id);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(sanitizeUser(user));
    } catch (err) {
        res.status(500).json({ error: 'Failed to load user' });
    }
});

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────
router.patch('/me', requireAuth, async (req, res) => {
    try {
        const allowed = [
            'full_name', 'phone', 'bio', 'institution', 'job_title', 'duty_station',
            'languages', 'avatar_url', 'notification_preferences', 'swap_preferences',
            'verification_status', 'institutional_email_verified',
        ];
        const updatable = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                // Handle JSON fields if they are passed as objects but stored as strings
                if (['notification_preferences', 'swap_preferences', 'languages'].includes(field) && typeof req.body[field] !== 'string') {
                    updatable[field] = JSON.stringify(req.body[field]);
                } else {
                    updatable[field] = req.body[field];
                }
            }
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updatable,
        });
        res.json(sanitizeUser(user));
    } catch (err) {
        console.error('Update me error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ─── PATCH /api/auth/me/password ──────────────────────────────────────────────
router.patch('/me/password', requireAuth, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
        if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        const valid = await bcrypt.compare(current_password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const password_hash = await bcrypt.hash(new_password, 12);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password_hash }
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out' });
});

// ─── GET /api/auth/is-authenticated ──────────────────────────────────────────
router.get('/is-authenticated', requireAuth, (req, res) => {
    res.json({ authenticated: true });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address.' });
        }

        const token = uuidv4();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                reset_password_token: token,
                reset_password_expires: expires
            }
        });

        const resetLink = `http://localhost:5173/reset-password?token=${token}`;

        const { sendEmail } = require('./email');
        await sendEmail({
            to: user.email,
            subject: 'UNswap - Password Reset Link',
            body: `Click the following link to reset your password: ${resetLink}. It expires in 1 hour.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #6366f1;">Password Reset Request</h2>
                    <p>You requested a password reset for your UNswap account.</p>
                    <p>Click the button below to set a new password:</p>
                    <div style="text-align: center; padding: 30px 0;">
                        <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Alternatively, copy and paste this link into your browser:</p>
                    <p style="color: #6366f1; font-size: 14px; word-break: break-all;">${resetLink}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });

        res.json({ success: true, message: 'A reset link has been sent to your email address.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password } = req.body;
        if (!token || !new_password) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                reset_password_token: token,
                reset_password_expires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset link' });
        }

        const password_hash = await bcrypt.hash(new_password, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash,
                reset_password_token: null,
                reset_password_expires: null
            }
        });

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// ─── POST /api/auth/google ───────────────────────────────────────────────────
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ error: 'Google credential is required' });

        // Verify the ID token with Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) return res.status(400).json({ error: 'Could not retrieve email from Google account' });

        // Find existing user by google_id or email
        let user = await prisma.user.findFirst({
            where: { OR: [{ google_id: googleId }, { email: email.toLowerCase() }] }
        });

        if (user) {
            // Link google_id if not already linked
            if (!user.google_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { google_id: googleId, avatar_url: user.avatar_url || picture || null },
                });
            }
        } else {
            // Create new user from Google data
            const referral_code = generateReferralCode();
            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    google_id: googleId,
                    full_name: name || null,
                    avatar_url: picture || null,
                    referral_code,
                    guest_points: 500,
                },
            });
        }

        const token = signToken(user.id);
        res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error('Google auth error detailing:', err);
        res.status(401).json({ error: `Google authentication failed: ${err.message}` });
    }
});

module.exports = router;
