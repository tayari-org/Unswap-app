const { prisma } = require('../db');

/**
 * Handles referral milestones when a user becomes verified.
 * @param {string} userEmail - The email of the user who just got verified.
 */
async function handleUserVerified(userEmail) {
    try {
        console.log(`[ReferralService] Processing verification for ${userEmail}`);

        // 1. Update the referral record for this user
        const referral = await prisma.referral.findUnique({
            where: { referred_email: userEmail }
        });

        if (!referral || referral.referred_user_status === 'verified') return;

        await prisma.referral.update({
            where: { id: referral.id },
            data: {
                referred_user_status: 'verified',
                completed_at: new Date()
            }
        });

        // 2. Increment the referrer's count
        const referrer = await prisma.user.findUnique({
            where: { email: referral.referrer_email }
        });

        if (!referrer) return;

        const newCount = referrer.referred_users_verified_count + 1;

        // 3. Define milestone updates
        const updates = {
            referred_users_verified_count: newCount
        };

        // Milestone 1: The Observer (1 Referral)
        if (newCount >= 1 && !referrer.has_sneak_peek) {
            updates.has_sneak_peek = true;
            console.log(`[ReferralService] Referrer ${referrer.email} unlocked SNEAK PEEK`);
        }

        // Milestone 2: The Delegate (5 Referrals) - Founders' Lifetime Waiver
        if (newCount >= 5 && referrer.subscription_status !== 'lifetime_waiver') {
            updates.subscription_status = 'lifetime_waiver';
            console.log(`[ReferralService] Referrer ${referrer.email} unlocked LIFETIME WAIVER`);
        }

        // Milestone 3: The Ambassador (10 Referrals) - Trigger for Photo Shoot 
        // (For now just log, could send email or notification)
        if (newCount === 10) {
            console.log(`[ReferralService] Referrer ${referrer.email} reached AMBASSADOR status`);
        }

        // Milestone 4: Founder's Circle (20 Referrals)
        if (newCount >= 20 && !referrer.is_founders_circle) {
            updates.is_founders_circle = true;
            console.log(`[ReferralService] Referrer ${referrer.email} unlocked FOUNDERS CIRCLE`);
        }

        await prisma.user.update({
            where: { id: referrer.id },
            data: updates
        });

    } catch (err) {
        console.error('[ReferralService] Error handling user verification:', err);
    }
}

module.exports = { handleUserVerified };
