const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/referrals/stats
 * Returns the current user's referral statistics and milestone status.
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Calculate milestone progress
        const verifiedCount = user.referred_users_verified_count;
        let nextMilestone = 'Ambassador';
        let milestoneRequirement = 10;

        if (verifiedCount < 1) {
            nextMilestone = 'Observer';
            milestoneRequirement = 1;
        } else if (verifiedCount < 5) {
            nextMilestone = 'Delegate';
            milestoneRequirement = 5;
        } else if (verifiedCount < 10) {
            nextMilestone = 'Ambassador';
            milestoneRequirement = 10;
        } else if (verifiedCount < 20) {
            nextMilestone = "Founder's Circle";
            milestoneRequirement = 20;
        } else {
            nextMilestone = 'Max Level Reached';
            milestoneRequirement = verifiedCount;
        }

        const stats = {
            referral_code: user.referral_code,
            verified_referrals_count: verifiedCount,
            waitlist_position: user.waitlist_position || 120,
            has_sneak_peek: user.has_sneak_peek,
            is_founders_circle: user.is_founders_circle,
            is_lifetime_waiver: user.subscription_status === 'lifetime_waiver',
            next_milestone: nextMilestone,
            milestone_requirement: milestoneRequirement,
            referral_link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?ref=${user.referral_code}`
        };

        res.json(stats);
    } catch (err) {
        console.error('Referral stats error:', err);
        res.status(500).json({ error: 'Failed to fetch referral stats' });
    }
});

/**
 * GET /api/referrals/colleagues
 * Returns a list of users referred by the current user.
 */
router.get('/colleagues', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const referrals = await prisma.referral.findMany({
            where: { referrer_email: user.email },
            orderBy: { created_at: 'desc' }
        });

        const collegueList = referrals.map(ref => ({
            id: ref.id,
            email_masked: ref.referred_email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)),
            status: ref.referred_user_status,
            created_at: ref.created_at
        }));

        res.json(collegueList);
    } catch (err) {
        console.error('Referral colleagues error:', err);
        res.status(500).json({ error: 'Failed to fetch referred colleagues' });
    }
});

/**
 * GET /api/referrals/leaderboard
 * Returns the top 10 referrers and the current user's rank.
 */
router.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const user = req.user;

        // Get top 10 referrers by verified count
        const topUsers = await prisma.user.findMany({
            where: { referred_users_verified_count: { gt: 0 } },
            orderBy: { referred_users_verified_count: 'desc' },
            take: 10,
            select: {
                email: true,
                full_name: true,
                referred_users_verified_count: true,
            }
        });

        const top10 = topUsers.map((u, i) => ({
            rank: i + 1,
            email: u.email,
            name: u.full_name || u.email.split('@')[0],
            verified: u.referred_users_verified_count,
        }));

        // Find current user's rank
        const currentUserRank = top10.findIndex(u => u.email === user.email);
        let currentUser = null;
        if (currentUserRank !== -1) {
            currentUser = top10[currentUserRank];
        } else {
            // User not in top 10 — calculate their actual rank
            const betterCount = await prisma.user.count({
                where: { referred_users_verified_count: { gt: user.referred_users_verified_count || 0 } }
            });
            currentUser = {
                rank: betterCount + 1,
                email: user.email,
                name: user.full_name || user.email.split('@')[0],
                verified: user.referred_users_verified_count || 0,
            };
        }

        res.json({ top5: top10, currentUser });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

/**
 * GET /api/referrals/resolve-code/:code
 * Safely resolves a referral code to minimal referrer info (no full user list needed).
 */
router.get('/resolve-code/:code', requireAuth, async (req, res) => {
    try {
        const { code } = req.params;
        const referrer = await prisma.user.findUnique({
            where: { referral_code: code.toUpperCase() },
            select: { email: true, full_name: true, referral_code: true }
        });

        if (!referrer) return res.status(404).json({ error: 'Referral code not found' });

        res.json({ email: referrer.email, full_name: referrer.full_name, referral_code: referrer.referral_code });
    } catch (err) {
        console.error('Resolve code error:', err);
        res.status(500).json({ error: 'Failed to resolve referral code' });
    }
});

module.exports = router;
