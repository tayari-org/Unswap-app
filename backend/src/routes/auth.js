const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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

    // Handle dynamic avatar_url
    if (obj.avatar_url && !obj.avatar_url.startsWith('http')) {
        const baseUrl = process.env.BACKEND_URL || '';
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        obj.avatar_url = `${cleanBaseUrl}/uploads/${obj.avatar_url}`;
    }

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
                ...(email.toLowerCase() === 'webdev@jacquelinetsuma.com' ? { role: 'admin' } : {})
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
            'full_name', 'username', 'phone', 'bio', 'institution', 'organization', 'job_title', 'staff_grade', 'duty_station',
            'languages', 'avatar_url', 'notification_preferences', 'swap_preferences',
            'verification_status', 'institutional_email_verified',
        ];
        const updatable = {};
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                // Handle JSON fields if they are passed as objects but stored as strings
                if (['notification_preferences', 'swap_preferences', 'languages'].includes(field) && typeof req.body[field] !== 'string') {
                    updatable[field] = JSON.stringify(req.body[field]);
                } else if (field === 'avatar_url' && typeof req.body[field] === 'string') {
                    // Strip BACKEND_URL from avatar_url
                    const baseUrl = process.env.BACKEND_URL || '';
                    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                    if (req.body[field].startsWith(cleanBaseUrl)) {
                        updatable[field] = req.body[field].replace(`${cleanBaseUrl}/uploads/`, '');
                    } else {
                        updatable[field] = req.body[field];
                    }
                } else if (field === 'username' && req.body[field] === '') {
                    // Convert empty username to null to avoid unique constraint issues in SQLite
                    updatable[field] = null;
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
        res.status(500).json({ error: 'Failed to update profile', details: err.message, meta: err?.meta });
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

        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) throw new Error('FRONTEND_URL is not defined in backend .env');
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

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


// ─── OAuth state store (in-memory, 10-min TTL) ──────────────────────────────
// Keyed by random state UUID; stores { codeVerifier, provider, ref, from }
const oauthStateStore = new Map();
setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, val] of oauthStateStore) {
        if (val.createdAt < cutoff) oauthStateStore.delete(key);
    }
}, 60 * 1000);

function buildOAuthState(extras = {}) {
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    oauthStateStore.set(state, { codeVerifier, createdAt: Date.now(), ...extras });
    return { state, codeVerifier, codeChallenge };
}

// ─── GET /api/auth/google ────────────────────────────────────────────────────
router.get('/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (!clientId) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('Google OAuth not configured. Add credentials to backend/.env')}`);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const redirectUri = `${backendUrl}/api/auth/google/callback`;
    const { state, codeChallenge } = buildOAuthState({ provider: 'google', ref: req.query.ref || '', from: req.query.from || '/Dashboard' });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'online'
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ─── GET /api/auth/google/callback ───────────────────────────────────────────
router.get('/google/callback', async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(error)}`);
    }

    const stored = oauthStateStore.get(state);
    if (!stored) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('Invalid or expired OAuth state. Please try again.')}`);
    }
    oauthStateStore.delete(state);

    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = `${backendUrl}/api/auth/google/callback`;

        // Exchange code for access token & id_token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: stored.codeVerifier,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) {
            console.error('[Google OAuth] Token exchange failed. Status:', tokenRes.status, 'Response:', JSON.stringify(tokenData));
            throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed');
        }

        // Fetch user profile
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await userRes.json();
        if (!userRes.ok) throw new Error('Failed to fetch Google profile');

        const email = (profile.email || '').toLowerCase();
        if (!email) throw new Error('Google did not return an email address.');

        let user = await prisma.user.findFirst({
            where: { OR: [{ google_id: profile.sub }, { email }] },
        });

        if (user) {
            if (!user.google_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { google_id: profile.sub, avatar_url: user.avatar_url || profile.picture || null },
                });
            }
        } else {
            const referral_code = generateReferralCode();
            user = await prisma.user.create({
                data: {
                    email,
                    google_id: profile.sub,
                    full_name: profile.name || null,
                    avatar_url: profile.picture || null,
                    referral_code,
                    referred_by: stored.ref || null,
                    guest_points: 500,
                    institutional_email_verified: isInstitutionalEmail(email),
                    ...(email === 'webdev@jacquelinetsuma.com' ? { role: 'admin' } : {})
                },
            });
            console.log(`[Auth] Created user via Google: ${email}`);

            if (stored.ref) {
                const referrer = await prisma.user.findUnique({ where: { referral_code: stored.ref } });
                if (referrer) {
                    await prisma.referral.create({
                        data: {
                            referrer_email: referrer.email,
                            referred_email: user.email,
                            referred_name: user.full_name || null,
                            referred_user_status: 'registered',
                        },
                    });
                }
            }
        }

        const token = signToken(user.id);
        const from = stored.from || '/Dashboard';
        res.redirect(`${frontendUrl}/oauth-callback?token=${encodeURIComponent(token)}&from=${encodeURIComponent(from)}`);
    } catch (err) {
        console.error('Google callback error:', err);
        res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(err.message || 'Google sign-in failed')}`);
    }
});

// ─── GET /api/auth/linkedin ──────────────────────────────────────────────────
router.get('/linkedin', (req, res) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId || clientId.startsWith('REPLACE_')) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('LinkedIn OAuth not configured. Add credentials to backend/.env')}`);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const redirectUri = `${backendUrl}/api/auth/linkedin/callback`;
    const { state } = buildOAuthState({ provider: 'linkedin', ref: req.query.ref || '', from: req.query.from || '/Dashboard' });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: 'openid profile email',
    });

    res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// ─── GET /api/auth/linkedin/callback ─────────────────────────────────────────
router.get('/linkedin/callback', async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(error)}`);
    }

    const stored = oauthStateStore.get(state);
    if (!stored) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('Invalid or expired OAuth state. Please try again.')}`);
    }
    oauthStateStore.delete(state);

    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = `${backendUrl}/api/auth/linkedin/callback`;

        // Exchange code for access token
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');

        // Fetch user info via OpenID Connect
        const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await userRes.json();
        if (!userRes.ok) throw new Error('Failed to fetch LinkedIn profile');

        const email = (profile.email || '').toLowerCase();
        if (!email) throw new Error('LinkedIn did not return an email address. Ensure your LinkedIn account has a verified email.');

        let user = await prisma.user.findFirst({
            where: { OR: [{ linkedin_id: profile.sub }, { email }] },
        });

        if (user) {
            if (!user.linkedin_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { linkedin_id: profile.sub, avatar_url: user.avatar_url || profile.picture || null },
                });
            }
        } else {
            const referral_code = generateReferralCode();
            user = await prisma.user.create({
                data: {
                    email,
                    linkedin_id: profile.sub,
                    full_name: profile.name || null,
                    avatar_url: profile.picture || null,
                    referral_code,
                    referred_by: stored.ref || null,
                    guest_points: 500,
                    institutional_email_verified: isInstitutionalEmail(email),
                },
            });
            console.log(`[Auth] Created user via LinkedIn: ${email}`);

            if (stored.ref) {
                const referrer = await prisma.user.findUnique({ where: { referral_code: stored.ref } });
                if (referrer) {
                    await prisma.referral.create({
                        data: {
                            referrer_email: referrer.email,
                            referred_email: user.email,
                            referred_name: user.full_name || null,
                            referred_user_status: 'registered',
                        },
                    });
                }
            }
        }

        const token = signToken(user.id);
        const from = stored.from || '/Dashboard';
        res.redirect(`${frontendUrl}/oauth-callback?token=${encodeURIComponent(token)}&from=${encodeURIComponent(from)}`);
    } catch (err) {
        console.error('LinkedIn callback error:', err);
        res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(err.message || 'LinkedIn sign-in failed')}`);
    }
});

// ─── GET /api/auth/x ─────────────────────────────────────────────────────────
router.get('/x', (req, res) => {
    const clientId = process.env.X_CLIENT_ID;
    if (!clientId || clientId.startsWith('REPLACE_')) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('X OAuth not configured. Add credentials to backend/.env')}`);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const redirectUri = `${backendUrl}/api/auth/x/callback`;
    const { state, codeChallenge } = buildOAuthState({ provider: 'x', ref: req.query.ref || '', from: req.query.from || '/Dashboard' });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope: 'tweet.read users.read offline.access',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

// ─── GET /api/auth/x/callback ────────────────────────────────────────────────
router.get('/x/callback', async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(error)}`);
    }

    const stored = oauthStateStore.get(state);
    if (!stored) {
        return res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent('Invalid or expired OAuth state. Please try again.')}`);
    }
    oauthStateStore.delete(state);

    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
        const redirectUri = `${backendUrl}/api/auth/x/callback`;
        const credentials = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64');

        // Exchange code for access token (PKCE)
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${credentials}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: stored.codeVerifier,
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.error || 'X token exchange failed');

        // Fetch user info
        const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const { data: xUser } = await userRes.json();
        if (!userRes.ok || !xUser) throw new Error('Failed to fetch X profile');

        // X doesn't always expose email — build a synthetic one
        const syntheticEmail = `x_${xUser.id}@x-oauth.unswap.app`;
        const email = syntheticEmail.toLowerCase();

        let user = await prisma.user.findFirst({
            where: { OR: [{ x_id: xUser.id }, { email }] },
        });

        if (user) {
            if (!user.x_id) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { x_id: xUser.id, avatar_url: user.avatar_url || xUser.profile_image_url || null },
                });
            }
        } else {
            const referral_code = generateReferralCode();
            user = await prisma.user.create({
                data: {
                    email,
                    x_id: xUser.id,
                    full_name: xUser.name || null,
                    username: xUser.username || null,
                    avatar_url: xUser.profile_image_url || null,
                    referral_code,
                    referred_by: stored.ref || null,
                    guest_points: 500,
                },
            });
            console.log(`[Auth] Created user via X: @${xUser.username}`);

            if (stored.ref) {
                const referrer = await prisma.user.findUnique({ where: { referral_code: stored.ref } });
                if (referrer) {
                    await prisma.referral.create({
                        data: {
                            referrer_email: referrer.email,
                            referred_email: user.email,
                            referred_name: user.full_name || null,
                            referred_user_status: 'registered',
                        },
                    });
                }
            }
        }

        const token = signToken(user.id);
        const from = stored.from || '/Dashboard';
        res.redirect(`${frontendUrl}/oauth-callback?token=${encodeURIComponent(token)}&from=${encodeURIComponent(from)}`);
    } catch (err) {
        console.error('X callback error:', err);
        res.redirect(`${frontendUrl}/login?oauthError=${encodeURIComponent(err.message || 'X sign-in failed')}`);
    }
});

module.exports = router;
