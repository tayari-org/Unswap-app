import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { CheckCircle2, ArrowRight, Loader2, Home, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dots, setDots] = useState('.');

  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type') || 'subscription'; // 'subscription' | 'points'

  // Animate dots on loading
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
    refetchInterval: 3000,   // Keep refreshing until subscription is activated
    refetchIntervalInBackground: false,
  });

  // Once subscription is active, stop refetching
  const isActivated = user?.subscription_status === 'active' || user?.subscription_status === 'lifetime';
  const hasPoints = type === 'points';

  useEffect(() => {
    if (isActivated || hasPoints) {
      queryClient.invalidateQueries(['current-user']);
    }
  }, [isActivated]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-xl w-full">

        {/* Header accent line */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-[2px] bg-unswap-blue-deep" />
          <p className="text-unswap-blue-deep font-bold tracking-[0.5em] uppercase text-[10px]">
            {hasPoints ? 'Points Purchased' : 'Membership Activated'}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white border border-slate-100 shadow-2xl p-12">

          {/* Check icon */}
          <div className="w-16 h-16 rounded-none bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>

          <h1 className="text-4xl font-extralight text-slate-900 tracking-tighter leading-none mb-4">
            {hasPoints
              ? <>GuestPoints <span className="italic font-serif">Added.</span></>
              : <>Payment <span className="italic font-serif">Confirmed.</span></>
            }
          </h1>

          <p className="text-[13px] text-slate-500 font-light leading-relaxed mb-10">
            {hasPoints
              ? 'Your GuestPoints have been credited to your account and are ready to use on your next swap.'
              : 'Your membership is now active. You have full access to all features included in your plan. Welcome to UNswap.'}
          </p>

          {/* Status badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming with our servers{dots}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-700 font-medium uppercase tracking-widest">
                {hasPoints
                  ? `${user?.guest_points?.toLocaleString() || '—'} GuestPoints balance`
                  : `${user?.subscription_status === 'lifetime' ? 'Lifetime' : 'Annual'} membership active`
                }
              </span>
            </div>
          )}

          {/* Details grid */}
          {sessionId && (
            <div className="border border-slate-100 p-5 mb-10 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Payment Reference</p>
              <p className="text-xs text-slate-600 font-mono break-all">{sessionId}</p>
            </div>
          )}

          {/* CTA Buttons */}
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

        {/* Footer note */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          A receipt has been sent to <span className="text-slate-600">{user?.email}</span>.
          For billing questions, contact{' '}
          <a href="mailto:billing@unswap.com" className="text-unswap-blue-deep underline underline-offset-2">
            billing@unswap.com
          </a>
        </p>

      </div>
    </div>
  );
}
