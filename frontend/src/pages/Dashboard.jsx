import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  Home, ArrowLeftRight, Coins, Star, Shield, ChevronRight, Eye,
  MessageSquare, Clock, CheckCircle, XCircle, Users, Video, Sparkles, Activity, Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import SwapPartnerSuggestions from '../components/dashboard/SwapPartnerSuggestions';

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['my-properties', user?.email],
    queryFn: () => api.entities.Property.filter({ owner_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['my-swap-requests', user?.email],
    queryFn: () => api.entities.SwapRequest.filter({
      $or: [{ requester_email: user?.email }, { host_email: user?.email }]
    }, '-created_date', 10),
    enabled: !!user?.email,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unread-messages', user?.email],
    queryFn: () => api.entities.Message.filter({
      recipient_email: user?.email,
      is_read: false
    }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: upcomingCalls = [] } = useQuery({
    queryKey: ['upcoming-calls', user?.email],
    queryFn: () => api.entities.VideoCall.filter({
      $or: [{ host_email: user?.email }, { guest_email: user?.email }],
      status: 'scheduled'
    }, 'scheduled_time', 5),
    enabled: !!user?.email,
  });

  const stats = {
    guestPoints: user?.guest_points || 500,
    totalEarned: user?.total_points_earned || 0,
    totalSpent: user?.total_points_spent || 0,
    swapsCompleted: user?.swaps_completed || 0,
    hostingCount: user?.hosting_count || 0,
    avgRating: user?.average_rating || 0,
    reviewsCount: user?.reviews_count || 0,
    activeListings: properties.filter(p => p.status === 'active').length,
    totalViews: properties.reduce((sum, p) => sum + (p.views_count || 0), 0),
  };

  const pendingRequests = swapRequests.filter(r => r.status === 'pending' && r.host_email === user?.email);
  const verificationStatus = user?.verification_status || 'unverified';

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* 1. INSTITUTIONAL HEADER */}
      <div className="bg-[#1E293B] border-b border-slate-800 relative overflow-hidden pt-16 pb-20">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 uppercase tracking-[0.2em] text-[9px] font-black">
                  <Shield className="w-3 h-3 mr-1.5" />
                  {verificationStatus === 'verified' ? 'Active Clearance: Verified Member' :
                    verificationStatus === 'pending' ? 'Security Review In Progress' :
                      'Security Credentialing Required'}
                </Badge>
              </div>

              <div>
                <h1 className="text-5xl font-bold tracking-tighter text-white">
                  {user?.username ? `Welcome, ${user.username}` : 'Colleague Portal'}
                </h1>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Operational Overview • {format(new Date(), 'MMMM yyyy')}
                </p>
              </div>

              {!user?.onboarding_completed && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  Initiate Portal Setup
                </button>
              )}
            </div>

            {/* FINANCIAL/POINTS WIDGET */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl min-w-[340px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Fingerprint className="w-12 h-12 text-white" />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em]">Guest Point Liquidity</p>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-6xl font-mono font-medium text-white tracking-tighter italic">
                  {stats.guestPoints.toLocaleString()}
                </span>
                <span className="text-slate-600 font-black text-xs tracking-[0.2em] uppercase">GP</span>
              </div>
              <div className="mt-8 space-y-3 relative z-10">
                <div className="flex justify-between text-[9px] uppercase font-black tracking-widest">
                  <span className="text-slate-500">Yield: <span className="text-emerald-400">+{stats.totalEarned}</span></span>
                  <span className="text-slate-500">Utilization: <span className="text-slate-400">-{stats.totalSpent}</span></span>
                </div>
                <Progress value={65} className="h-1 bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* 2. SECURITY NOTIFICATIONS BAR */}
        <div className="grid gap-4 -mt-8 mb-12 relative z-30">
          {verificationStatus !== 'verified' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                  <Shield className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Credential Audit Outstanding</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Complete identity verification to authorize cross-border swap capabilities.</p>
                </div>
              </div>
              <Link to={createPageUrl('Settings')} className="w-full md:w-auto">
                <Button size="lg" variant="outline" className="w-full border-slate-200 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl">
                  Start Verification
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* 3. KEY METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Registered Assets', value: stats.activeListings, icon: Home },
            { label: 'Authorized Swaps', value: stats.swapsCompleted, icon: ArrowLeftRight },
            { label: 'Institutional Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'SEC', icon: Star },
            { label: 'Listing Engagement', value: stats.totalViews, icon: Eye },
          ].map((stat, index) => (
            <Card key={index} className="border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <p className="text-4xl font-bold text-slate-900 leading-none mt-2 tracking-tighter italic group-hover:text-indigo-600 transition-colors">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 4. ACTIVITY & SUGGESTIONS */}
            {properties.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
                <div className="bg-slate-50/80 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Priority Matches
                  </h3>
                </div>
                <div className="p-2">
                  <SwapPartnerSuggestions user={user} userProperties={properties} />
                </div>
              </div>
            )}

            <Card className="border-slate-200 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between px-8 py-6 bg-white">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Operational Log</CardTitle>
                <Link to={createPageUrl('MySwaps')}>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-black text-[10px] uppercase tracking-widest">
                    View Full Archive <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {swapRequests.length === 0 ? (
                  <div className="text-center py-24 text-slate-300">
                    <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 opacity-5" />
                    <p className="font-bold text-[10px] uppercase tracking-widest">No historical data recorded in current cycle.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {swapRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between px-8 py-6 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                            }`}>
                            {request.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{request.property_title}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">
                              Interval: {request.check_in && format(new Date(request.check_in), 'dd MMM')} — {request.check_out && format(new Date(request.check_out), 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${request.status === 'pending' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                            request.status === 'approved' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500 bg-slate-50 border-slate-200'
                          } capitalize font-black text-[9px] px-4 py-1.5 rounded-lg tracking-widest shadow-sm`}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. SIDEBAR */}
          <div className="space-y-8">
            <Card className="border-slate-200 bg-white rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden">
              <CardHeader className="pb-4 px-8 pt-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Control Panel</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 px-6 pb-8">
                <Link to={createPageUrl('MyListings')} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all font-black text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <Home className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    Register New Asset
                  </Button>
                </Link>
                <Link to={createPageUrl('Messages')} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all relative font-black text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <MessageSquare className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    Secure Messaging
                    {messages.length > 0 && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to={createPageUrl('MySwaps') + '?tab=video-calls'} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all font-black text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <Video className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    Virtual Briefings
                    {upcomingCalls.length > 0 && <Badge className="ml-auto bg-indigo-600 rounded-md h-5 px-2">{upcomingCalls.length}</Badge>}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-white overflow-hidden rounded-3xl shadow-2xl relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield className="w-32 h-32" />
              </div>
              <div className="p-8 relative z-10">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Credential Status</h4>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-4xl font-mono font-medium tracking-tighter italic">
                    {verificationStatus === 'verified' ? '100%' : '65%'}
                  </span>
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] pb-1">Clearance</span>
                </div>
                <Progress value={verificationStatus === 'verified' ? 100 : 65} className="h-1.5 bg-slate-800" indicatorClassName="bg-indigo-500" />

                <div className="mt-10 space-y-5">
                  {[
                    { l: 'Identity Verified', d: true },
                    { l: 'Agency Whitelist', d: true },
                    { l: 'Asset Audit Completion', d: properties.length > 0 }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                      {item.d ? (
                        <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-lg border border-slate-700 flex items-center justify-center bg-slate-800/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        </div>
                      )}
                      <span className={item.d ? 'text-slate-100' : 'text-slate-600'}>{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <OnboardingWizard user={user} open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}