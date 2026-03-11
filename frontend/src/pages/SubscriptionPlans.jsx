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
  indigo: { icon: 'text-indigo-600', ring: 'ring-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sky: { icon: 'text-sky-600', ring: 'ring-sky-100', btn: 'bg-sky-600 hover:bg-sky-700', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  violet: { icon: 'text-violet-600', ring: 'ring-violet-200', btn: 'bg-violet-600 hover:bg-violet-700', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  amber: { icon: 'text-amber-600', ring: 'ring-amber-100', btn: 'bg-amber-600 hover:bg-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  gold: { icon: 'text-amber-600', ring: 'ring-amber-200', btn: 'bg-amber-500 hover:bg-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PLAN_ICONS = {
  indigo: Shield,
  sky: Star,
  violet: Zap,
  amber: Zap,
  gold: Crown,
};

const thisColor = (color, c, isLifetime) => c.icon || 'text-slate-600';
const thisBtn = (color, c, isLifetime) => c.btn || 'bg-slate-900 hover:bg-slate-800';
const getLightBadgeClasses = (color) => {
  if (color === 'gold') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (color === 'violet') return 'bg-violet-50 text-violet-700 border-violet-200';
  if (color === 'sky') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (color === 'indigo') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (color === 'amber') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function SubscriptionPlans({ isTab = false }) {
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
    <div className={isTab ? "w-full" : "min-h-screen bg-slate-50 py-16 px-6"}>
      <div className="max-w-7xl mx-auto relative">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-unswap-blue-deep text-white text-[10px] font-bold px-4 py-2 rounded-none mb-6 tracking-[0.3em] uppercase">
            <Shield className="w-3.5 h-3.5" /> Institutional Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter text-slate-900 mb-6">
            Choose Your Access Tier
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Annual plans tailored to your diplomatic rotation frequency.
            Your fee funds world-class legal, insurance, and trust infrastructure.
          </p>
          {user?.subscription_status && (
            <div className="mt-5">
              <Badge className={`text-sm px-4 py-1.5 ${user.subscription_status === 'active' || user.subscription_status === 'lifetime'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
                } border`}>
                {user.subscription_status === 'lifetime'
                  ? '🏛 Lifetime Member'
                  : `Status: ${user.subscription_status.replace(/_/g, ' ')}`}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Plans Grid ──────────────────────────────────────────────────────── */}
        <div className={`grid gap-5 mb-14 items-start ${isTab ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
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
                className={`relative rounded-none border bg-white flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${plan.highlight
                  ? 'border-unswap-blue-deep shadow-2xl ring-1 ring-unswap-blue-deep'
                  : 'border-unswap-border shadow-sm'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-unswap-blue-deep text-white text-[10px] font-bold px-4 py-1 rounded-none tracking-[0.2em] uppercase shadow-md whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isLifetime && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-4 py-1 rounded-none tracking-[0.2em] uppercase shadow-md whitespace-nowrap">
                    Best Value
                  </div>
                )}

                <div className="p-6">
                  {/* Icon + Badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div className={`w-11 h-11 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center ${thisColor(color, c, isLifetime)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={`text-[10px] font-bold uppercase tracking-[0.2em] border px-2.5 py-1 rounded-none ${getLightBadgeClasses(color)}`}>
                      {plan.badge || (plan.type === 'lifetime' ? 'One-Time' : `$${plan.price}/yr`)}
                    </Badge>
                  </div>

                  {/* Name + Price */}
                  <h3 className="text-slate-900 font-bold text-lg leading-tight mb-1">{plan.name}</h3>
                  <p className="text-slate-600 text-[10px] tracking-wide mb-6 leading-relaxed uppercase">{plan.description}</p>

                  <div className="mb-5 pb-5 border-b border-unswap-border">
                    <span className="text-4xl font-extralight text-slate-900 italic font-serif">${(plan.price || 0).toLocaleString()}</span>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-2">
                      {isLifetime ? 'one-time' : '/ year'}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${thisColor(color, c, isLifetime)}`} />
                        <span className="text-slate-600 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {!plan.features?.some(f => f.toString().includes('exchange')) && plan.exchanges_per_year && (
                      <li className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${thisColor(color, c, isLifetime)}`} />
                        <span className="text-slate-600 text-xs">
                          {plan.exchanges_per_year >= 999
                            ? 'Unlimited exchanges per year'
                            : `${plan.exchanges_per_year} exchange${plan.exchanges_per_year > 1 ? 's' : ''} per year`}
                        </span>
                      </li>
                    )}
                    {!plan.features?.some(f => f.toString().includes('guarantee') || f.toString().includes('insurance')) && plan.property_guarantee_amount && (
                      <li className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${thisColor(color, c, isLifetime)}`} />
                        <span className="text-slate-600 text-xs">
                          ${plan.property_guarantee_amount.toLocaleString()} property shield
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  {isCurrentPlan ? (
                    <div className="w-full rounded-none py-4 text-center text-[10px] uppercase font-bold tracking-[0.2em] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Current Plan
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={!!selectedPlan}
                      className={`w-full h-12 text-[10px] tracking-[0.2em] uppercase font-bold rounded-none transition-all ${plan.highlight
                        ? 'bg-unswap-blue-deep hover:bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 hover:text-slate-900'
                        }`}
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

        {/* ── Founders' Waiver Banner ──────────────────────────────────────────── */}
        {isPreLaunch && platformSettings?.founders_waiver_enabled && !waiverUnlocked && (
          <div className="mb-10 p-6 rounded-none bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-12 h-12 rounded-none bg-amber-100 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 font-bold text-lg mb-1">
                Founders' Lifetime Waiver — Pre-Launch Exclusive
              </h3>
              <p className="text-amber-800 text-sm">
                Refer <strong className="text-amber-900">{requiredReferrals} verified colleagues</strong> from
                the UN, World Bank, IMF or affiliated organisations to unlock
                <strong className="text-amber-900"> lifetime membership, completely free.</strong>
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-amber-200 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, (verifiedReferrals / requiredReferrals) * 100)}%` }}
                  />
                </div>
                <span className="text-amber-700 font-semibold text-sm whitespace-nowrap">
                  {verifiedReferrals} / {requiredReferrals} referrals
                </span>
              </div>
              {user?.referral_code && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 mb-1">Your Referral Code</p>
                  <code className="bg-amber-200 px-3 py-1.5 rounded-none text-amber-900 text-xs font-mono block break-all">{`${window.location.origin}?ref=${user.referral_code}`}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {waiverUnlocked && (
          <div className="mb-10 p-5 rounded-none bg-emerald-50 border border-emerald-200 flex items-center gap-4">
            <Gift className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-emerald-900 font-bold">🎉 Founders' Lifetime Waiver Unlocked!</p>
              <p className="text-emerald-800 text-sm">Your annual membership fee is permanently waived. Welcome, Delegate.</p>
            </div>
          </div>
        )}

        {/* ── Payment Methods ──────────────────────────────────────────────────── */}
        <div className="text-center mb-14">
          <p className="text-slate-500 text-sm">
            Payments processed via <span className="text-slate-700 font-medium">Stripe</span> ·
            Accepts Credit/Debit Cards, Apple Pay, Google Pay, PayPal & Venmo
          </p>
        </div>

        {/* ── Policies Grid ─────────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-center text-xl font-bold text-slate-900 mb-8">
            Member Guarantees & Policies
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: CalendarCheck,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-100',
                title: 'First Year Swap Guarantee',
                desc: 'Can\'t find a match in year one? Your second year is completely free of charge.',
              },
              {
                icon: RefreshCcw,
                color: 'text-sky-600',
                bg: 'bg-sky-50 border-sky-100',
                title: '"Trust First" Refund Policy',
                desc: '100% refund within 30 days if your property fails vetting or your institutional status changes.',
              },
              {
                icon: Gift,
                color: 'text-amber-600',
                bg: 'bg-amber-50 border-amber-100',
                title: 'Early Bird 50% Off',
                desc: 'The first 500 verified waitlist members receive 50% off their first year of membership.',
              },
              {
                icon: Infinity,
                color: 'text-violet-600',
                bg: 'bg-violet-50 border-violet-100',
                title: 'Founders\' Lifetime Waiver',
                desc: 'Refer 5 verified colleagues during pre-launch and your annual fee is waived permanently.',
              },
            ].map((item, i) => (
              <div key={i} className={`rounded-none border p-5 ${item.bg}`}>
                <item.icon className={`w-7 h-7 mb-3 ${item.color}`} />
                <h4 className="text-slate-900 font-bold text-xs uppercase tracking-widest mb-1.5">{item.title}</h4>
                <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subscription Expiry Warning ────────────────────────────────────── */}
        <div className="rounded-none border border-red-200 bg-red-50 p-6 flex gap-4 mb-14">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-900 font-semibold text-sm mb-1">
              What happens if your subscription expires
            </h4>
            <p className="text-red-800 text-xs leading-relaxed">
              Unswap subscriptions fund the extensive legal and trust infrastructure of the closed-loop network.
              If your subscription lapses, you revert to <strong className="text-red-700">inactive status</strong> and
              immediately lose access to swap request capabilities, the
              <strong className="text-red-700"> Clements Worldwide insurance shield</strong>, and
              the <strong className="text-red-700">automated Concierge Loop</strong>.
              Your profile and property listings are preserved for 90 days pending renewal.
            </p>
          </div>
        </div>

        {/* ── When do I pay? ───────────────────────────────────────────────────── */}
        <div className="rounded-none border border-indigo-100 bg-indigo-50/50 p-6 flex gap-4">
          <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-indigo-900 font-semibold text-sm mb-1">
              When does billing start?
            </h4>
            <p className="text-indigo-800/80 text-xs leading-relaxed">
              Your first payment is deducted on <strong className="text-indigo-900">Launch Day</strong> when you
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