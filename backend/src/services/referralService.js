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

        // 3. Increment the referrer's count
        const referrer = await prisma.user.findUnique({
            where: { email: referral.referrer_email }
        });

        if (!referrer) return;

        const newCount = (referrer.referred_users_verified_count || 0) + 1;
        const settings = await prisma.platformSettings.findFirst();

        // 4. Define milestone updates
        const updates = {
            referred_users_verified_count: newCount
        };

        // Milestone 1: The Observer (1 Referral)
        if (newCount >= 1 && !referrer.has_sneak_peek) {
            updates.has_sneak_peek = true;
            console.log(`[ReferralService] Referrer ${referrer.email} unlocked SNEAK PEEK`);
        }

        // Logic for Rewards based on Platform Status
        if (settings?.platform_status === 'pre_launch' && settings.founders_waiver_enabled) {
            // Milestone 2: The Delegate (5 Referrals) - Founders' Lifetime Waiver
            const requiredForWaiver = settings.required_verified_referrals_for_waiver || 5;
            if (newCount >= requiredForWaiver && referrer.subscription_status !== 'lifetime_waiver' && referrer.subscription_status !== 'lifetime_waived') {
                updates.subscription_status = 'lifetime_waived';
                console.log(`[ReferralService] Referrer ${referrer.email} unlocked LIFETIME WAIVER`);
                
                await prisma.notification.create({
                    data: {
                        user_email: referrer.email,
                        type: 'system',
                        title: "🎉 Founders' Lifetime Waiver Unlocked!",
                        message: `You've referred ${newCount} verified colleagues and earned lifetime access!`,
                        link: '/Dashboard'
                    }
                });
            }
        } else {
            // Standard Launched Reward: 1000 Points per verified referral
            const pointsReward = 1000;
            const newBalance = (referrer.guest_points || 0) + pointsReward;
            updates.guest_points = newBalance;
            
            await prisma.guestPointTransaction.create({
                data: {
                    user_email: referrer.email,
                    transaction_type: 'earned_referral',
                    points: pointsReward,
                    balance_after: newBalance,
                    description: `Referral reward for ${referral.referred_name || referral.referred_email}`,
                    related_id: referral.id
                }
            });

            await prisma.notification.create({
                data: {
                    user_email: referrer.email,
                    type: 'system',
                    title: "🎁 Referral Reward Earned!",
                    message: `You've earned ${pointsReward} GuestPoints for referring a verified colleague!`,
                    link: '/Dashboard?tab=points'
                }
            });
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
