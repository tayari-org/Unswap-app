/**
 * Functions router — Prisma version
 *
 * POST /api/functions/:name
 */
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('./email');
const { prisma } = require('../db');

const router = express.Router();
router.use(requireAuth);

// ─── finalizeSwap ──────────────────────────────────────────────────────────────
async function finalizeSwap(req, res) {
    const user = req.user;
    const { swap_request_id } = req.body;
    if (!swap_request_id) return res.status(400).json({ error: 'Missing swap_request_id' });

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: swap_request_id } });
    if (!swapRequest) return res.status(404).json({ error: 'Swap request not found' });

    const isRequester = swapRequest.requester_email === user.email;
    const isHost = swapRequest.host_email === user.email;
    if (!isRequester && !isHost) return res.status(403).json({ error: 'Not part of this swap' });

    // Deduct points if guestpoints swap
    if (swapRequest.swap_type === 'guestpoints' && swapRequest.status !== 'finalized') {
        const totalPoints = swapRequest.total_points || 0;
        const requester = await prisma.user.findUnique({ where: { email: swapRequest.requester_email } });
        const host = await prisma.user.findUnique({ where: { email: swapRequest.host_email } });
        if (!requester || !host) return res.status(500).json({ error: 'Could not fetch user data' });

        const reqPoints = requester.guest_points || 0;
        const hostPoints = host.guest_points || 0;
        if (reqPoints < totalPoints) {
            return res.status(400).json({ error: `Insufficient points. Requester has ${reqPoints}, needs ${totalPoints}.` });
        }

        await prisma.$transaction([
            prisma.user.update({ where: { email: swapRequest.requester_email }, data: { guest_points: reqPoints - totalPoints } }),
            prisma.user.update({ where: { email: swapRequest.host_email }, data: { guest_points: hostPoints + totalPoints } }),
            prisma.guestPointTransaction.create({
                data: {
                    user_email: swapRequest.requester_email,
                    transaction_type: 'spent_swap',
                    points: -totalPoints,
                    balance_after: reqPoints - totalPoints,
                    description: `Swap finalized for ${swapRequest.property_title}`,
                    related_id: swap_request_id
                }
            }),
            prisma.guestPointTransaction.create({
                data: {
                    user_email: swapRequest.host_email,
                    transaction_type: 'earned_swap',
                    points: totalPoints,
                    balance_after: hostPoints + totalPoints,
                    description: `Earned from swap finalized for ${swapRequest.property_title}`,
                    related_id: swap_request_id
                }
            }),
            prisma.swapRequest.update({
                where: { id: swap_request_id },
                data: { status: 'finalized', finalized_at: new Date() }
            })
        ]);
    } else {
        await prisma.swapRequest.update({
            where: { id: swap_request_id },
            data: { status: 'finalized', finalized_at: new Date() }
        });
    }

    await prisma.activityLog.create({
        data: {
            activity_type: 'swap_finalized',
            description: `Swap finalized: ${swapRequest.property_title}`,
            location_from: swapRequest.requester_email,
            location_to: swapRequest.host_email,
            is_public: true
        }
    });

    const otherEmail = isRequester ? swapRequest.host_email : swapRequest.requester_email;
    await prisma.notification.create({
        data: {
            user_email: otherEmail,
            type: 'swap_finalized',
            title: 'Swap Finalized',
            message: `The swap for ${swapRequest.property_title} has been finalized.`,
            link: '/MySwaps',
            related_id: swap_request_id,
            sender_email: user.email,
            sender_name: user.full_name || user.email
        }
    });

    return res.json({ success: true, message: 'Swap finalized successfully', swap_request_id });
}


// ─── completeSwap ──────────────────────────────────────────────────────────────
async function completeSwap(req, res) {
    const user = req.user;
    const { swap_request_id } = req.body;
    if (!swap_request_id) return res.status(400).json({ error: 'Missing swap_request_id' });

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: swap_request_id } });
    if (!swapRequest) return res.status(404).json({ error: 'Swap request not found' });

    const isRequester = swapRequest.requester_email === user.email;
    const isHost = swapRequest.host_email === user.email;
    if (!isRequester && !isHost) return res.status(403).json({ error: 'Not part of this swap' });

    if (swapRequest.swap_type === 'guestpoints' && swapRequest.status !== 'completed') {
        const totalPoints = swapRequest.total_points || 0;
        const requester = await prisma.user.findUnique({ where: { email: swapRequest.requester_email } });
        const host = await prisma.user.findUnique({ where: { email: swapRequest.host_email } });
        if (!requester || !host) return res.status(500).json({ error: 'Could not fetch user data' });

        const reqPoints = requester.guest_points || 0;
        const hostPoints = host.guest_points || 0;
        if (reqPoints < totalPoints) {
            return res.status(400).json({ error: `Insufficient points. Requester has ${reqPoints}, needs ${totalPoints}.` });
        }

        await prisma.$transaction([
            prisma.user.update({ where: { email: swapRequest.requester_email }, data: { guest_points: reqPoints - totalPoints } }),
            prisma.user.update({ where: { email: swapRequest.host_email }, data: { guest_points: hostPoints + totalPoints } }),
            prisma.guestPointTransaction.create({
                data: {
                    user_email: swapRequest.requester_email,
                    transaction_type: 'spent_swap',
                    points: -totalPoints,
                    balance_after: reqPoints - totalPoints,
                    description: `Swap completed for ${swapRequest.property_title}`,
                    related_id: swap_request_id
                }
            }),
            prisma.guestPointTransaction.create({
                data: {
                    user_email: swapRequest.host_email,
                    transaction_type: 'earned_swap',
                    points: totalPoints,
                    balance_after: hostPoints + totalPoints,
                    description: `Earned from swap completed for ${swapRequest.property_title}`,
                    related_id: swap_request_id
                }
            })
        ]);
    }

    await prisma.swapRequest.update({
        where: { id: swap_request_id },
        data: { status: 'completed', completed_at: new Date() }
    });

    await prisma.activityLog.create({
        data: {
            activity_type: 'swap_completed',
            description: `Swap completed for ${swapRequest.property_title}`,
            location_from: swapRequest.requester_email,
            location_to: swapRequest.host_email,
            is_public: true
        }
    });

    const otherEmail = isRequester ? swapRequest.host_email : swapRequest.requester_email;
    await prisma.notification.create({
        data: {
            user_email: otherEmail,
            type: 'swap_completed',
            title: 'Swap Completed',
            message: `Swap for ${swapRequest.property_title} has been completed.`,
            link: '/MySwaps',
            related_id: swap_request_id,
            sender_email: user.email,
            sender_name: user.full_name || user.email
        }
    });

    return res.json({ success: true, message: 'Swap completed successfully', swap_request_id });
}

// ─── createJitsiRoom ───────────────────────────────────────────────────────────
async function createJitsiRoom(req, res) {
    const { videoCallId } = req.body;
    if (!videoCallId) return res.status(400).json({ error: 'videoCallId is required' });

    const roomName = `unswap-${videoCallId}-${Math.random().toString(36).substring(2, 8)}`;
    const roomUrl = `https://meet.jit.si/${roomName}`;

    await prisma.videoCall.update({
        where: { id: videoCallId },
        data: { room_id: roomName, room_url: roomUrl }
    });
    
    return res.json({ roomUrl, roomName, success: true });
}

// ─── createStripeCheckoutSession ───────────────────────────────────────────────
async function createStripeCheckoutSession(req, res) {
    const user = req.user;
    const { subscription_plan_id } = req.body;
    if (!subscription_plan_id) return res.status(400).json({ error: 'subscription_plan_id is required' });

    let plan = await prisma.subscriptionPlan.findUnique({ where: { id: subscription_plan_id } });
    
    // Auto-create plan if missing (fallback for fresh databases)
    if (!plan || !plan.is_active) {
        const STATIC_PLANS = [
            { id: 'limited', name: 'Limited', description: 'Perfect for diplomats with a single annual rotation.', price: 129, type: 'annual', is_active: true },
            { id: 'standard', name: 'Standard', description: 'Ideal for mid-level staff with bi-annual mobility.', price: 219, type: 'annual', is_active: true },
            { id: 'professional', name: 'Professional', description: 'Designed for senior staff on frequent rotational assignments.', price: 349, type: 'annual', is_active: true },
            { id: 'unlimited-pro', name: 'Unlimited Pro', description: 'Maximum flexibility for agency heads and ambassadors.', price: 449, type: 'annual', is_active: true },
            { id: 'lifetime', name: 'Lifetime Access', description: 'Pay once, exchange forever. Unlimited Pro features for life.', price: 3143, type: 'lifetime', is_active: true },
        ];
        
        const defaultPlan = STATIC_PLANS.find(p => p.id === subscription_plan_id);
        if (defaultPlan) {
            plan = await prisma.subscriptionPlan.upsert({
                where: { id: defaultPlan.id },
                update: { is_active: true },
                create: defaultPlan
            });
        }
    }

    if (!plan || !plan.is_active) return res.status(400).json({ error: 'Invalid or inactive subscription plan' });

    const origin = req.headers.origin || process.env.FRONTEND_URL;
    const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: plan.name, description: plan.description }, unit_amount: Math.round(plan.price * 100), ...(plan.type === 'annual' && { recurring: { interval: 'year' } }) }, quantity: 1 }],
        mode: plan.type === 'annual' ? 'subscription' : 'payment',
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/subscription-plans?canceled=true`,
        metadata: { user_email: user.email, subscription_plan_id: plan.id, plan_type: plan.type },
    });

    await prisma.paymentTransaction.create({
        data: {
            user_email: user.email,
            subscription_plan_id: plan.id,
            amount: plan.price,
            currency: 'USD',
            status: 'pending',
            payment_gateway_id: session.id,
            transaction_type: plan.type === 'lifetime' ? 'one_time_lifetime' : 'initial_subscription'
        }
    });
    return res.json({ url: session.url, session_id: session.id });
}

// ─── createGuestPointsCheckoutSession ──────────────────────────────────────────
async function createGuestPointsCheckoutSession(req, res) {
    const user = req.user;
    const { points_amount, price_usd } = req.body;
    if (!points_amount || !price_usd) return res.status(400).json({ error: 'points_amount and price_usd are required' });

    const origin = req.headers.origin || process.env.FRONTEND_URL;
    const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${points_amount} GuestPoints`,
                    description: `Purchase of ${points_amount} Unswap GuestPoints`
                },
                unit_amount: Math.round(price_usd * 100),
            },
            quantity: 1
        }],
        mode: 'payment',
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/settings?canceled=true`,
        metadata: { user_email: user.email, plan_type: 'guest_points', points_amount: points_amount.toString() },
    });

    await prisma.paymentTransaction.create({
        data: {
            user_email: user.email,
            amount: price_usd,
            currency: 'USD',
            status: 'pending',
            payment_gateway_id: session.id,
            transaction_type: 'guest_points_purchase'
        }
    });
    return res.json({ url: session.url, session_id: session.id });
}

// ─── markVideoCallCompleted ────────────────────────────────────────────────────
async function markVideoCallCompleted(req, res) {
    const user = req.user;
    const { video_call_id } = req.body;
    if (!video_call_id) return res.status(400).json({ error: 'Missing video_call_id' });

    const videoCall = await prisma.videoCall.findUnique({ where: { id: video_call_id } });
    if (!videoCall) return res.status(404).json({ error: 'Video call not found' });
    if (videoCall.host_email !== user.email) return res.status(403).json({ error: 'Only the host can mark the call as completed' });

    await prisma.videoCall.update({
        where: { id: video_call_id },
        data: { status: 'completed', meeting_completed: true, call_ended_at: new Date() }
    });

    if (videoCall.swap_request_id) {
        const swapRequest = await prisma.swapRequest.findUnique({ where: { id: videoCall.swap_request_id } });
        if (swapRequest) {
            await prisma.swapRequest.update({
                where: { id: swapRequest.id },
                data: { status: 'approved', video_call_completed: true, video_call_id: video_call_id }
            });

            await prisma.notification.createMany({
                data: [
                    { user_email: swapRequest.requester_email, type: 'swap_approved', title: 'Video Call Completed', message: `Your video call for ${swapRequest.property_title} is complete. Swap approved!`, link: '/MySwaps', related_id: swapRequest.id },
                    { user_email: swapRequest.host_email, type: 'swap_approved', title: 'Video Call Completed', message: `Your video call for ${swapRequest.property_title} is complete. Swap approved!`, link: '/MySwaps', related_id: swapRequest.id },
                ]
            });
        }
    }

    return res.json({ success: true, video_call_id });
}

// ─── processReferralRewards ────────────────────────────────────────────────────
async function processReferralRewards(req, res) {
    const user = req.user;
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const { referral_id } = req.body;
    if (!referral_id) return res.status(400).json({ error: 'referral_id is required' });

    const referral = await prisma.referral.findUnique({ where: { id: referral_id } });
    if (!referral || referral.referred_user_status !== 'verified') return res.status(400).json({ error: 'Invalid referral or user not verified' });

    const settings = await prisma.platformSettings.findFirst();
    const referrer = await prisma.user.findUnique({ where: { email: referral.referrer_email } });
    if (!referrer) return res.status(404).json({ error: 'Referrer not found' });

    const newVerifiedCount = (referrer.referred_users_verified_count || 0) + 1;
    await prisma.user.update({
        where: { id: referrer.id },
        data: { referred_users_verified_count: newVerifiedCount }
    });

    let rewardStatus = 'no_reward';
    let rewardDetails = {};

    if (settings?.platform_status === 'pre_launch' && settings.founders_waiver_enabled) {
        if (newVerifiedCount >= (settings.required_verified_referrals_for_waiver || 5)) {
            rewardStatus = 'awarded_lifetime_waiver';
            rewardDetails = { type: 'lifetime_waiver' };
            await prisma.user.update({
                where: { id: referrer.id },
                data: { subscription_status: 'lifetime_waived' }
            });
            await prisma.notification.create({
                data: {
                    user_email: referrer.email,
                    type: 'system',
                    title: "🎉 Founders' Lifetime Waiver Unlocked!",
                    message: `You've referred ${newVerifiedCount} verified colleagues and earned lifetime access!`,
                    link: '/dashboard'
                }
            });
        } else if (newVerifiedCount >= 3) {
            rewardStatus = 'awarded_6_months_unlimited_pro';
            rewardDetails = { type: '6_months_unlimited', duration_months: 6 };
            const renewalDate = new Date();
            renewalDate.setMonth(renewalDate.getMonth() + 6);
            const unlimitedPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'Unlimited Pro' } });
            if (unlimitedPlan) {
                await prisma.user.update({
                    where: { id: referrer.id },
                    data: {
                        subscription_status: 'active',
                        subscription_plan_id: unlimitedPlan.id,
                        subscription_renewal_date: renewalDate
                    }
                });
            }
        }
    } else if (settings?.platform_status === 'launched') {
        const pointsReward = 1000;
        rewardStatus = 'awarded_discount';
        rewardDetails = { type: 'guest_points', amount: pointsReward };
        const newBalance = (referrer.guest_points || 0) + pointsReward;
        await prisma.user.update({
            where: { id: referrer.id },
            data: { guest_points: newBalance }
        });
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
    }

    await prisma.referral.update({
        where: { id: referral.id },
        data: {
            referrer_reward_status: rewardStatus,
            reward_details: JSON.stringify(rewardDetails),
            status: 'completed',
            completed_at: new Date()
        }
    });
    return res.json({ success: true, reward_status: rewardStatus, reward_details: rewardDetails, verified_count: newVerifiedCount });
}

// ─── assignDefaultGuestPoints ─────────────────────────────────────────────────
async function assignDefaultGuestPoints(req, res) {
    const { user_email } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email is required' });
    const user = await prisma.user.findUnique({ where: { email: user_email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.update({
        where: { email: user_email },
        data: { guest_points: 500 }
    });
    return res.json({ success: true, guest_points: 500 });
}

// ─── checkFirstYearSwapGuarantee ──────────────────────────────────────────────
async function checkFirstYearSwapGuarantee(req, res) {
    const { user_email } = req.body;
    const targetEmail = user_email || req.user.email;
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oneYearLater = new Date(user.created_at);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const isWithinFirstYear = new Date() < oneYearLater;
    const eligible = user.has_first_year_guarantee && isWithinFirstYear;

    return res.json({ eligible, has_first_year_guarantee: user.has_first_year_guarantee, is_within_first_year: isWithinFirstYear });
}

// ─── resetGuestPoints ─────────────────────────────────────────────────────────
async function resetGuestPoints(req, res) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { user_email } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email is required' });
    await prisma.user.update({
        where: { email: user_email },
        data: { guest_points: 500 }
    });
    return res.json({ success: true });
}

// ─── syncSubscriptionPayments ─────────────────────────────────────────────────
async function syncSubscriptionPayments(req, res) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const subscriptions = await stripe.subscriptions.list({ status: 'all', limit: 100 });

    let synced = 0;
    for (const sub of subscriptions.data) {
        const customer = await stripe.customers.retrieve(sub.customer);
        if (!customer.email) continue;
        const user = await prisma.user.findUnique({ where: { email: customer.email } });
        if (!user) continue;
        const status = sub.status === 'active' ? 'active' : 'inactive';
        await prisma.user.update({
            where: { email: customer.email },
            data: { subscription_status: status, subscription_renewal_date: new Date(sub.current_period_end * 1000) }
        });
        synced++;
    }
    return res.json({ success: true, synced });
}

// ─── transferGuestPoints ──────────────────────────────────────────────────────
async function transferGuestPoints(req, res) {
    const { from_email, to_email, points, reason } = req.body;
    if (!from_email || !to_email || !points) return res.status(400).json({ error: 'from_email, to_email, and points required' });

    const from = await prisma.user.findUnique({ where: { email: from_email } });
    const to = await prisma.user.findUnique({ where: { email: to_email } });
    if (!from || !to) return res.status(404).json({ error: 'User not found' });
    if (from.guest_points < points) return res.status(400).json({ error: 'Insufficient points' });

    await prisma.user.update({ where: { email: from_email }, data: { guest_points: from.guest_points - points } });
    await prisma.user.update({ where: { email: to_email }, data: { guest_points: to.guest_points + points } });

    await prisma.guestPointTransaction.createMany({
        data: [
            { user_email: from_email, transaction_type: 'spent_swap', points: -points, balance_after: from.guest_points - points, description: reason || 'Transfer' },
            { user_email: to_email, transaction_type: 'earned_swap', points, balance_after: to.guest_points + points, description: reason || 'Transfer received' },
        ]
    });

    return res.json({ success: true });
}

// ─── updateSubscriptionStatus ─────────────────────────────────────────────────
async function updateSubscriptionStatus(req, res) {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { user_email, subscription_status, subscription_plan_id, subscription_renewal_date } = req.body;
    if (!user_email) return res.status(400).json({ error: 'user_email is required' });

    const data = {};
    if (subscription_status) data.subscription_status = subscription_status;
    if (subscription_plan_id) data.subscription_plan_id = subscription_plan_id;
    if (subscription_renewal_date) data.subscription_renewal_date = new Date(subscription_renewal_date);

    const user = await prisma.user.update({
        where: { email: user_email },
        data
    });
    return res.json({ success: true, user });
}

// ─── deleteUserAndData ─────────────────────────────────────────────────────────
async function deleteUserAndData(req, res) {
    const { user_email } = req.body;
    if (req.user.email !== user_email && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { email: user_email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.notification.deleteMany({ where: { user_email } });
    await prisma.guestPointTransaction.deleteMany({ where: { user_email } });
    await prisma.paymentTransaction.deleteMany({ where: { user_email } });
    await prisma.verification.deleteMany({ where: { user_email } });
    await prisma.message.deleteMany({ where: { sender_email: user_email } });
    await prisma.review.deleteMany({ where: { author_email: user_email } });
    await prisma.property.deleteMany({ where: { owner_email: user_email } });
    await prisma.swapRequest.deleteMany({
        where: {
            OR: [{ requester_email: user_email }, { host_email: user_email }]
        }
    });
    await prisma.referral.deleteMany({
        where: {
            OR: [{ referrer_email: user_email }, { referred_email: user_email }]
        }
    });
    await prisma.user.delete({ where: { email: user_email } });

    return res.json({ success: true, message: 'User and all data deleted' });
}

// ─── Route dispatcher ─────────────────────────────────────────────────────────
const FUNCTION_MAP = {
    finalizeSwap,
    completeSwap,
    createJitsiRoom,
    createStripeCheckoutSession,
    createGuestPointsCheckoutSession,
    markVideoCallCompleted,
    processReferralRewards,
    assignDefaultGuestPoints,
    checkFirstYearSwapGuarantee,
    resetGuestPoints,
    syncSubscriptionPayments,
    transferGuestPoints,
    updateSubscriptionStatus,
    deleteUserAndData,
};

router.post('/:name', async (req, res) => {
    const { name } = req.params;
    const fn = FUNCTION_MAP[name];
    if (!fn) return res.status(404).json({ error: `Function '${name}' not found` });
    try {
        await fn(req, res);
    } catch (err) {
        console.error(`Function ${name} error:`, err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
