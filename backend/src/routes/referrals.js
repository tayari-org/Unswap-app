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
            nextMilestone = 'Founder\'s Circle';
            milestoneRequirement = 20;
        } else {
            nextMilestone = 'Max Level Reach';
            milestoneRequirement = verifiedCount;
        }

        const stats = {
            referral_code: user.referral_code,
            verified_referrals_count: verifiedCount,
            waitlist_position: user.waitlist_position || 120, // Placeholder if null
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

        // Map to a more private format
        const collegueList = referrals.map(ref => ({
            id: ref.id,
            email_masked: ref.referred_email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)),
            status: ref.referred_user_status, // 'invited', 'registered', 'verified'
            created_at: ref.created_at
        }));

        res.json(collegueList);
    } catch (err) {
        console.error('Referral colleagues error:', err);
        res.status(500).json({ error: 'Failed to fetch referred colleagues' });
    }
});

module.exports = router;
