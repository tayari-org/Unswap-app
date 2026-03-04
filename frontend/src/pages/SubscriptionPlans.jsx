import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check, Crown, Zap, Star, Shield, ArrowRight, Loader2,
  Users, Gift, AlertCircle, RefreshCcw, CalendarCheck, Infinity,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Static plan definitions (UI fallback if DB isn't seeded yet) ─────────────
const STATIC_PLANS = [
  {
    id: 'limited',
    name: 'Limited',
    badge: '1× / year',
    description: 'Perfect for diplomats with a single annual rotation.',
    price: 129,
    type: 'annual',
    exchanges_per_year: 1,
    property_guarantee_amount: 500000,
    features: [
      '1 exchange per membership year',
      '$500,000 Clements Worldwide property shield',
      'Full Diplomatic Vault verification',
      'Video meet-and-greet scheduling',
      'Automated Concierge Loop',
      'First Year Swap Guarantee',
    ],
    color: 'indigo',
    highlight: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: '2× / year',
    description: 'Ideal for mid-level staff with bi-annual mobility.',
    price: 219,
    type: 'annual',
    exchanges_per_year: 2,
    property_guarantee_amount: 1000000,
    features: [
      '2 exchanges per membership year',
      '$1,000,000 Clements Worldwide property shield',
      'Full Diplomatic Vault verification',
      'Video meet-and-greet scheduling',
      'Automated Concierge Loop',
      'GuestPoints accrual & redemption',
      'First Year Swap Guarantee',
    ],
    color: 'sky',
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: '4× / year',
    description: 'Designed for senior staff on frequent rotational assignments.',
    price: 349,
    type: 'annual',
    exchanges_per_year: 4,
    property_guarantee_amount: 1500000,
    features: [
      '4 exchanges per membership year',
      '$1,500,000 Clements Worldwide property shield',
      'Full Diplomatic Vault verification',
      'Priority swap matching',
      'Automated Concierge Loop',
      'GuestPoints accrual & redemption',
      'First Year Swap Guarantee',
    ],
    color: 'violet',
    highlight: true,
  },
  {
    id: 'unlimited-pro',
    name: 'Unlimited Pro',
    badge: 'Unlimited',
    description: 'Maximum flexibility for agency heads and ambassadors.',
    price: 449,
    type: 'annual',
    exchanges_per_year: 999,
    property_guarantee_amount: 2000000,
    features: [
      'Unlimited exchanges per year',
      '$2,000,000 Clements Worldwide property shield',
      'Priority Concierge support 24 / 7',
      'Full Diplomatic Vault verification',
      'Automated Concierge Loop',
      'GuestPoints accrual & redemption',
      'First Year Swap Guarantee',
      'Early access to new features',
    ],
    color: 'amber',
    highlight: false,
  },
  {
    id: 'lifetime',
    name: 'Lifetime Access',
    badge: 'One-time · Forever',
    description: 'Pay once, exchange forever. Unlimited Pro features for life.',
    price: 3143,
    type: 'lifetime',
    exchanges_per_year: 999,
    property_guarantee_amount: 2000000,
    features: [
      'Everything in Unlimited Pro',
      'Zero recurring fees — ever',
      'Immunity from future price changes',
      '$2,000,000 property insurance shield',
      'Founder status & badge',
      'Priority queue for all support tickets',
      'Exclusive Founders\' Lounge community',
    ],
    color: 'gold',
    highlight: false,
  },
];

const COLOR_MAP = {
  indigo: { icon: 'text-indigo-400', ring: 'ring-indigo-500/40', btn: 'bg-indigo-600 hover:bg-indigo-500', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  sky: { icon: 'text-sky-400', ring: 'ring-sky-500/40', btn: 'bg-sky-600 hover:bg-sky-500', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  violet: { icon: 'text-violet-400', ring: 'ring-violet-500/60', btn: 'bg-violet-600 hover:bg-violet-500', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  amber: { icon: 'text-amber-400', ring: 'ring-amber-500/40', btn: 'bg-amber-600 hover:bg-amber-500', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  gold: { icon: 'text-yellow-400', ring: 'ring-yellow-500/50', btn: 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
};

const PLAN_ICONS = {
  indigo: Shield,
  sky: Star,
  violet: Zap,
  amber: Zap,
  gold: Crown,
};

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: dbPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.entities.SubscriptionPlan.filter({ is_active: true }),
  });

  const { data: platformSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const settings = await api.entities.PlatformSettings.list();
      return settings[0] || { platform_status: 'pre_launch', founders_waiver_enabled: true };
    },
  });

  // Use static plans if DB isn't seeded yet
  const plans = dbPlans.length > 0 ? dbPlans : STATIC_PLANS;

  const checkoutMutation = useMutation({
    mutationFn: async (planId) => {
      const response = await api.functions.invoke('createStripeCheckoutSession', {
        subscription_plan_id: planId,
      });
      return response.data || response;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (error) => {
      toast.error('Failed to start checkout', { description: error.message || 'Please try again' });
      setSelectedPlan(null);
    },
  });

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    checkoutMutation.mutate(planId);
  };

  const isPreLaunch = platformSettings?.platform_status === 'pre_launch';
  const requiredReferrals = platformSettings?.required_verified_referrals_for_waiver || 5;
  const verifiedReferrals = user?.referred_users_verified_count || 0;
  const waiverUnlocked = verifiedReferrals >= requiredReferrals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-16 px-6">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5" /> Institutional Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Choose Your Access Tier
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Annual plans tailored to your diplomatic rotation frequency.
            Your fee funds world-class legal, insurance, and trust infrastructure.
          </p>
          {user?.subscription_status && (
            <div className="mt-5">
              <Badge className={`text-sm px-4 py-1.5 ${user.subscription_status === 'active' || user.subscription_status === 'lifetime'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                } border`}>
                {user.subscription_status === 'lifetime'
                  ? '🏛 Lifetime Member'
                  : `Status: ${user.subscription_status.replace(/_/g, ' ')}`}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Founders' Waiver Banner ──────────────────────────────────────────── */}
        {isPreLaunch && platformSettings?.founders_waiver_enabled && !waiverUnlocked && (
          <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/25 flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-300 font-bold text-lg mb-1">
                Founders' Lifetime Waiver — Pre-Launch Exclusive
              </h3>
              <p className="text-amber-200/70 text-sm">
                Refer <strong className="text-amber-300">{requiredReferrals} verified colleagues</strong> from
                the UN, World Bank, IMF or affiliated organisations to unlock
                <strong className="text-amber-300"> lifetime membership, completely free.</strong>
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-amber-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (verifiedReferrals / requiredReferrals) * 100)}%` }}
                  />
                </div>
                <span className="text-amber-300 font-semibold text-sm whitespace-nowrap">
                  {verifiedReferrals} / {requiredReferrals} referrals
                </span>
              </div>
              {user?.referral_code && (
                <p className="mt-2 text-xs text-amber-400/70">
                  Your code: <code className="bg-amber-900/40 px-2 py-0.5 rounded text-amber-300">{user.referral_code}</code>
                </p>
              )}
            </div>
          </div>
        )}

        {waiverUnlocked && (
          <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 flex items-center gap-4">
            <Gift className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-300 font-bold">🎉 Founders' Lifetime Waiver Unlocked!</p>
              <p className="text-emerald-200/70 text-sm">Your annual membership fee is permanently waived. Welcome, Delegate.</p>
            </div>
          </div>
        )}

        {/* ── Plans Grid ──────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-14">
          {plans.map((plan) => {
            const color = plan.color || (plan.type === 'lifetime' ? 'gold' : 'indigo');
            const c = COLOR_MAP[color] || COLOR_MAP.indigo;
            const Icon = PLAN_ICONS[color] || Shield;
            const isLifetime = plan.type === 'lifetime';
            const isCurrentPlan = user?.subscription_plan_id === plan.id;
            const isProcessing = selectedPlan === plan.id && checkoutMutation.isPending;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-slate-900/70 backdrop-blur-sm flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${plan.highlight
                    ? 'border-violet-500/50 shadow-violet-500/20 shadow-lg ring-2 ring-violet-500/30'
                    : 'border-slate-700/50'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wider uppercase shadow-lg">
                    Most Popular
                  </div>
                )}
                {isLifetime && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-xs font-bold px-4 py-1 rounded-full tracking-wider uppercase shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Icon + Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center ${c.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={`text-[10px] font-semibold border px-2.5 py-0.5 ${c.badge}`}>
                      {plan.badge || (plan.type === 'lifetime' ? 'One-Time' : `$${plan.price}/yr`)}
                    </Badge>
                  </div>

                  {/* Name + Price */}
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-xs mb-4 leading-relaxed">{plan.description}</p>

                  <div className="mb-5">
                    <span className="text-4xl font-black text-white">${(plan.price || 0).toLocaleString()}</span>
                    <span className="text-slate-500 text-sm ml-1.5">
                      {isLifetime ? 'one-time' : '/ year'}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />
                        <span className="text-slate-300 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {!plan.features?.some(f => f.toString().includes('exchange')) && plan.exchanges_per_year && (
                      <li className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />
                        <span className="text-slate-300 text-xs">
                          {plan.exchanges_per_year >= 999
                            ? 'Unlimited exchanges per year'
                            : `${plan.exchanges_per_year} exchange${plan.exchanges_per_year > 1 ? 's' : ''} per year`}
                        </span>
                      </li>
                    )}
                    {!plan.features?.some(f => f.toString().includes('guarantee') || f.toString().includes('insurance')) && plan.property_guarantee_amount && (
                      <li className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />
                        <span className="text-slate-300 text-xs">
                          ${plan.property_guarantee_amount.toLocaleString()} property shield
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  {isCurrentPlan ? (
                    <div className="w-full rounded-xl py-2.5 text-center text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={!!selectedPlan}
                      className={`w-full h-11 text-sm font-semibold rounded-xl text-white transition-all ${c.btn}`}
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
                      ) : (
                        <>{isLifetime ? 'Get Lifetime Access' : 'Get Started'}<ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Payment Methods ──────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <p className="text-slate-500 text-sm">
            Payments processed via <span className="text-slate-400 font-medium">Stripe</span> ·
            Accepts Credit/Debit Cards, Apple Pay, Google Pay, PayPal & Venmo
          </p>
        </div>

        {/* ── Policies Grid ─────────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-center text-xl font-bold text-white mb-8">
            Member Guarantees & Policies
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: CalendarCheck,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
                title: 'First Year Swap Guarantee',
                desc: 'Can\'t find a match in year one? Your second year is completely free of charge.',
              },
              {
                icon: RefreshCcw,
                color: 'text-sky-400',
                bg: 'bg-sky-500/10 border-sky-500/20',
                title: '"Trust First" Refund Policy',
                desc: '100% refund within 30 days if your property fails vetting or your institutional status changes.',
              },
              {
                icon: Gift,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
                title: 'Early Bird 50% Off',
                desc: 'The first 500 verified waitlist members receive 50% off their first year of membership.',
              },
              {
                icon: Infinity,
                color: 'text-violet-400',
                bg: 'bg-violet-500/10 border-violet-500/20',
                title: 'Founders\' Lifetime Waiver',
                desc: 'Refer 5 verified colleagues during pre-launch and your annual fee is waived permanently.',
              },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${item.bg}`}>
                <item.icon className={`w-7 h-7 mb-3 ${item.color}`} />
                <h4 className="text-white font-semibold text-sm mb-1.5">{item.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subscription Expiry Warning ────────────────────────────────────── */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex gap-4 mb-14">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-300 font-semibold text-sm mb-1">
              What happens if your subscription expires
            </h4>
            <p className="text-red-300/60 text-xs leading-relaxed">
              Unswap subscriptions fund the extensive legal and trust infrastructure of the closed-loop network.
              If your subscription lapses, you revert to <strong className="text-red-300/80">inactive status</strong> and
              immediately lose access to swap request capabilities, the
              <strong className="text-red-300/80"> Clements Worldwide insurance shield</strong>, and
              the <strong className="text-red-300/80">automated Concierge Loop</strong>.
              Your profile and property listings are preserved for 90 days pending renewal.
            </p>
          </div>
        </div>

        {/* ── When do I pay? ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 flex gap-4">
          <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-1">
              When does billing start?
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your first payment is deducted on <strong className="text-slate-300">Launch Day</strong> when you
              convert your waitlist spot into an active, paid membership. Subsequent annual deductions happen on
              your membership anniversary date. Engaged early adopters can bypass costs entirely through referrals
              or rely on the First Year Swap Guarantee.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}