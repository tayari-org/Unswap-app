import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { CheckCircle2, Loader2, Home, CreditCard, Calendar, Coins, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dots, setDots] = useState('.');

  const type = searchParams.get('type') || 'subscription';
  const planName = searchParams.get('plan');
  const planType = searchParams.get('plan_type'); // 'annual' | 'lifetime'
  const price = parseFloat(searchParams.get('price') || '0');
  const pointsAmount = parseInt(searchParams.get('points') || '0', 10);
  const hasPoints = type === 'points';

  // Animate dots while loading
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
  });

  const isActivated = user?.subscription_status === 'active' || user?.subscription_status === 'lifetime';

  useEffect(() => {
    if (isActivated || hasPoints) {
      queryClient.invalidateQueries(['current-user']);
    }
  }, [isActivated]);

  const renewalDate = planType === 'annual'
    ? format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'MMMM d, yyyy')
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full">

        {/* Header accent */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-[2px] bg-unswap-blue-deep" />
          <p className="text-unswap-blue-deep font-bold tracking-[0.5em] uppercase text-[10px]">
            {hasPoints ? 'Points Purchased' : 'Membership Activated'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 shadow-2xl p-12">

          {/* Icon */}
          <div className="w-16 h-16 rounded-none bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>

          <h1 className="text-4xl font-extralight text-slate-900 tracking-tighter leading-none mb-2">
            {hasPoints
              ? <>GuestPoints <span className="italic font-serif">Added.</span></>
              : <>Payment <span className="italic font-serif">Confirmed.</span></>
            }
          </h1>

          <p className="text-[13px] text-slate-500 font-light leading-relaxed mb-8">
            {hasPoints
              ? `${pointsAmount.toLocaleString()} GuestPoints have been credited to your account and are ready to use on your next swap.`
              : `Your ${planName} membership is now active. You have full access to all features included in your plan.`
            }
          </p>

          {/* Transaction summary */}
          <div className="border border-slate-100 divide-y divide-slate-100 mb-8">

            {hasPoints ? (
              <>
                <div className="flex justify-between items-center px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Coins className="w-4 h-4" />
                    <span>Points Purchased</span>
                  </div>
                  <span className="text-slate-900 font-semibold text-sm">
                    {pointsAmount.toLocaleString()} GuestPoints
                  </span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Amount Paid</span>
                  </div>
                  <span className="text-slate-900 font-semibold text-sm">
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {!isLoading && user?.guest_points != null && (
                  <div className="flex justify-between items-center px-5 py-4 bg-emerald-50/40">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs">
                      <Coins className="w-4 h-4" />
                      <span>New Balance</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-sm">
                      {user.guest_points.toLocaleString()} GuestPoints
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Plan</span>
                  </div>
                  <span className="text-slate-900 font-semibold text-sm">
                    {planName} {planType === 'lifetime' ? '(Lifetime)' : '(Annual)'}
                  </span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Amount {planType === 'lifetime' ? 'Paid' : 'Charged'}</span>
                  </div>
                  <span className="text-slate-900 font-semibold text-sm">
                    ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })} {planType === 'annual' ? '/ year' : '(one-time)'}
                  </span>
                </div>
                {renewalDate && (
                  <div className="flex justify-between items-center px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>Next Renewal</span>
                    </div>
                    <span className="text-slate-900 font-semibold text-sm">{renewalDate}</span>
                  </div>
                )}
                {isLoading ? (
                  <div className="flex items-center gap-2 px-5 py-4 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming with our servers{dots}</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center px-5 py-4 bg-emerald-50/40">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                    <span className="text-emerald-700 font-bold text-sm uppercase tracking-widest">
                      {user?.subscription_status === 'lifetime' ? 'Lifetime Active' : 'Active'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="flex-1 rounded-none h-14 bg-unswap-blue-deep text-white hover:bg-slate-900 text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('SubscriptionPlans'))}
              variant="outline"
              className="flex-1 rounded-none h-14 border-slate-200 text-slate-700 hover:border-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          A detailed receipt has been sent to <span className="text-slate-600">{user?.email}</span>.{' '}
          For billing questions, contact{' '}
          <a href="mailto:billing@unswap.com" className="text-unswap-blue-deep underline underline-offset-2">
            billing@unswap.com
          </a>
        </p>

      </div>
    </div>
  );
}
