/**
 * Stripe webhook handler — Prisma version
 * Endpoint: POST /api/webhook/stripe
 */
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendEmail } = require('./email');
const { prisma } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { user_email, subscription_plan_id, plan_type } = session.metadata || {};
                if (!user_email) break;

                // Update pending payment transaction
                const tx = await prisma.paymentTransaction.findFirst({
                    where: { payment_gateway_id: session.id }
                });
                if (tx) {
                    await prisma.paymentTransaction.update({
                        where: { id: tx.id },
                        data: {
                            status: 'completed',
                            payment_method: session.payment_method_types?.[0] || 'card',
                            receipt_url: session.receipt_url || session.url,
                        }
                    });
                }

                const plan = subscription_plan_id ? await prisma.subscriptionPlan.findUnique({ where: { id: subscription_plan_id } }) : null;
                const renewalDate = new Date();
                if (plan_type === 'annual') renewalDate.setFullYear(renewalDate.getFullYear() + 1);

                const user = await prisma.user.findUnique({ where: { email: user_email } });
                if (user) {
                    if (plan_type === 'guest_points') {
                        const pointsAmount = parseInt(session.metadata?.points_amount || '0', 10);
                        if (pointsAmount > 0) {
                            const newBalance = (user.guest_points || 0) + pointsAmount;
                            await prisma.user.update({
                                where: { email: user_email },
                                data: { guest_points: newBalance }
                            });
                            await prisma.guestPointTransaction.create({
                                data: {
                                    user_email: user_email,
                                    transaction_type: 'earned_purchase',
                                    points: pointsAmount,
                                    balance_after: newBalance,
                                    description: `Purchased ${pointsAmount} GuestPoints`
                                }
                            });
                            await prisma.notification.create({
                                data: {
                                    user_email,
                                    type: 'system',
                                    title: 'GuestPoints Purchased',
                                    message: `You have successfully purchased ${pointsAmount} GuestPoints.`,
                                    link: '/settings'
                                }
                            });
                            // Detailed GuestPoints purchase email
                            const pricePerPoint = session.amount_total ? (session.amount_total / 100 / pointsAmount).toFixed(4) : 'N/A';
                            await sendEmail({
                                to: user_email,
                                subject: `UNswap — ${pointsAmount.toLocaleString()} GuestPoints Added to Your Account`,
                                body: `You have successfully purchased ${pointsAmount} GuestPoints. Your new balance is ${newBalance} points.`,
                                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>GuestPoints Purchased</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f172a;padding:32px 40px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:300;letter-spacing:-0.5px;">UNswap</p>
          <p style="margin:6px 0 0;color:#64748b;font-size:11px;letter-spacing:3px;text-transform:uppercase;">GuestPoints Receipt</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:24px;font-weight:300;color:#0f172a;letter-spacing:-0.5px;">GuestPoints <em>Added.</em></p>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">Hi ${user?.full_name || user_email},<br><br>
          Your purchase of <strong>${pointsAmount.toLocaleString()} GuestPoints</strong> has been confirmed and credited to your account.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;margin-bottom:32px;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:12px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Transaction Summary</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">GuestPoints Purchased</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${pointsAmount.toLocaleString()} pts</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Amount Paid</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">$${session.amount_total ? (session.amount_total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Date</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;background:#f0fdf4;">
              <td style="padding:14px 16px;color:#16a34a;font-size:13px;font-weight:600;">New Balance</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:700;color:#16a34a;">${newBalance.toLocaleString()} GuestPoints</td>
            </tr>
          </table>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">You can use your GuestPoints to book stays at any available property on the platform.</p>
          <a href="${process.env.FRONTEND_URL || 'https://unswap-app.onrender.com'}/FindProperties" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Find Properties</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Questions? Contact us at <a href="mailto:billing@unswap.com" style="color:#0f172a;">billing@unswap.com</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} UNswap · Home Exchange for International Civil Servants</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
                            });
                        }
                    } else {
                        await prisma.user.update({
                            where: { email: user_email },
                            data: {
                                subscription_plan_id: subscription_plan_id || undefined,
                                subscription_status: plan_type === 'lifetime' ? 'lifetime' : 'active',
                                ...(plan_type === 'annual' && { subscription_renewal_date: renewalDate }),
                                has_first_year_guarantee: plan_type === 'annual',
                            }
                        });
                        await prisma.notification.create({
                            data: {
                                user_email,
                                type: 'system',
                                title: 'Subscription Activated',
                                message: `Your ${plan?.name || 'Unswap'} subscription is now active. Welcome!`,
                                link: '/dashboard'
                            }
                        });
                        // Send detailed subscription confirmation email
                        const renewalText = plan_type === 'annual'
                            ? `<tr><td style="padding:10px 0;color:#64748b;font-size:13px;">Next Renewal</td><td style="padding:10px 0;text-align:right;font-size:13px;font-weight:600;">${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>`
                            : '<tr><td style="padding:10px 0;color:#64748b;font-size:13px;">Access</td><td style="padding:10px 0;text-align:right;font-size:13px;font-weight:600;">Lifetime — never expires</td></tr>';
                        await sendEmail({
                            to: user_email,
                            subject: `UNswap — ${plan?.name || 'Subscription'} Membership Activated`,
                            body: `Your ${plan?.name || 'subscription'} membership is now active.`,
                            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Subscription Confirmed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr><td style="background:#0f172a;padding:32px 40px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:300;letter-spacing:-0.5px;">UNswap</p>
          <p style="margin:6px 0 0;color:#64748b;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Membership Confirmation</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:24px;font-weight:300;color:#0f172a;letter-spacing:-0.5px;">Membership <em>Activated.</em></p>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">Hi ${user?.full_name || user_email},<br><br>
          Your <strong>${plan?.name || 'UNswap'}</strong> membership is now active. You have full access to all features on the platform.</p>
          <!-- Summary table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;margin-bottom:32px;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:12px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Transaction Summary</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Plan</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${plan?.name || 'UNswap'} (${plan_type === 'lifetime' ? 'Lifetime' : 'Annual'})</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Amount Paid</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">$${Number(plan?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${plan_type === 'annual' ? '/ year' : '(one-time)'}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">${renewalText}</tr>
            <tr style="border-top:1px solid #e2e8f0;background:#f0fdf4;">
              <td style="padding:14px 16px;color:#16a34a;font-size:13px;font-weight:600;">Status</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Active</td>
            </tr>
          </table>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">
            You can manage your membership, view your invoices, and update your payment method at any time from your account settings.
          </p>
          <a href="${process.env.FRONTEND_URL || 'https://unswap-app.onrender.com'}/Dashboard" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Go to Dashboard</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Questions about your billing? Contact us at <a href="mailto:billing@unswap.com" style="color:#0f172a;">billing@unswap.com</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} UNswap · Home Exchange for International Civil Servants</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
                        });
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                const customer = await stripe.customers.retrieve(invoice.customer);
                const email = customer.email;
                if (!email) break;

                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    await prisma.paymentTransaction.create({
                        data: {
                            user_email: email,
                            subscription_plan_id: user.subscription_plan_id,
                            amount: invoice.amount_paid / 100,
                            currency: invoice.currency.toUpperCase(),
                            status: 'completed',
                            payment_gateway_id: invoice.id,
                            transaction_type: 'renewal',
                            receipt_url: invoice.hosted_invoice_url,
                        }
                    });
                    await prisma.user.update({
                        where: { email },
                        data: {
                            subscription_status: 'active',
                            subscription_renewal_date: new Date(subscription.current_period_end * 1000)
                        }
                    });
                    // Detailed renewal confirmation email
                    const plan = user.subscription_plan_id ? await prisma.subscriptionPlan.findUnique({ where: { id: user.subscription_plan_id } }) : null;
                    const nextRenewal = new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    await sendEmail({
                        to: email,
                        subject: `UNswap — Your ${plan?.name || 'Membership'} Has Been Renewed`,
                        body: `Your UNswap membership has been successfully renewed. Amount charged: $${(invoice.amount_paid / 100).toFixed(2)}.`,
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Membership Renewed</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;">
        <tr><td style="background:#0f172a;padding:32px 40px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:300;letter-spacing:-0.5px;">UNswap</p>
          <p style="margin:6px 0 0;color:#64748b;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Membership Renewal</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:24px;font-weight:300;color:#0f172a;letter-spacing:-0.5px;">Membership <em>Renewed.</em></p>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">Hi ${user?.full_name || email},<br><br>
          Your <strong>${plan?.name || 'UNswap'}</strong> membership has been automatically renewed. Your access continues uninterrupted.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;margin-bottom:32px;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:12px 16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">Payment Details</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Plan</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${plan?.name || 'UNswap'} (Annual)</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Amount Charged</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">$${(invoice.amount_paid / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} / year</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Renewal Date</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Next Renewal</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:600;color:#0f172a;">${nextRenewal}</td>
            </tr>
            ${invoice.hosted_invoice_url ? `<tr style="border-top:1px solid #e2e8f0;">
              <td style="padding:14px 16px;color:#64748b;font-size:13px;">Invoice</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;"><a href="${invoice.hosted_invoice_url}" style="color:#0f172a;font-weight:600;">View Invoice</a></td>
            </tr>` : ''}
            <tr style="border-top:1px solid #e2e8f0;background:#f0fdf4;">
              <td style="padding:14px 16px;color:#16a34a;font-size:13px;font-weight:600;">Status</td>
              <td style="padding:14px 16px;text-align:right;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Active</td>
            </tr>
          </table>
          <p style="margin:0 0 32px;font-size:13px;color:#64748b;line-height:1.6;">You can manage your payment method and download past invoices from your account settings.</p>
          <a href="${process.env.FRONTEND_URL || 'https://unswap-app.onrender.com'}/Settings" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;">Manage Account</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e2e8f0;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">To cancel, visit <a href="${process.env.FRONTEND_URL || 'https://unswap-app.onrender.com'}/Settings" style="color:#0f172a;">Settings</a> or contact <a href="mailto:billing@unswap.com" style="color:#0f172a;">billing@unswap.com</a></p>
          <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} UNswap · Home Exchange for International Civil Servants</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
                    });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const customer = await stripe.customers.retrieve(invoice.customer);
                const email = customer.email;
                if (!email) break;
                await prisma.notification.create({
                    data: {
                        user_email: email,
                        type: 'system',
                        title: 'Payment Failed',
                        message: 'Your subscription payment failed. Please update your payment method.',
                        link: '/settings'
                    }
                });
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customer = await stripe.customers.retrieve(subscription.customer);
                const email = customer.email;
                if (!email) break;

                const user = await prisma.user.findUnique({ where: { email } });
                if (user) {
                    await prisma.user.update({
                        where: { email },
                        data: { subscription_status: 'inactive' }
                    });
                    await prisma.notification.create({
                        data: {
                            user_email: email,
                            type: 'system',
                            title: 'Subscription Cancelled',
                            message: 'Your subscription has been cancelled. You can renew at any time from Settings.',
                            link: '/subscription-plans'
                        }
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
