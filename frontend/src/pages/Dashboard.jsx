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
    <div className="min-h-screen bg-white">
      {/* 1. SIMPLE PROFESSIONAL HEADER */}
      <div className="bg-white border-b border-slate-100 relative overflow-hidden pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-100 text-indigo-600 bg-indigo-50/30 uppercase tracking-[0.15em] text-[10px] font-bold px-3 py-1">
                  <Shield className="w-3 h-3 mr-1.5" />
                  {verificationStatus === 'verified' ? 'Verified Member' :
                    verificationStatus === 'pending' ? 'Verification Pending' :
                      'Identity Verification Required'}
                </Badge>
              </div>

              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                  {user?.username ? `Hello, ${user.username}` : 'Your Dashboard'}
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  Overview for {format(new Date(), 'MMMM yyyy')}
                </p>
              </div>

              {!user?.onboarding_completed && (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100"
                >
                  <Sparkles className="w-4 h-4" />
                  Complete My Profile
                </button>
              )}
            </div>

            {/* POINTS WIDGET */}
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl min-w-[320px] shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Available Points</p>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-5xl font-bold text-slate-900 tracking-tight">
                  {stats.guestPoints.toLocaleString()}
                </span>
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Points</span>
              </div>
              <div className="mt-6 flex justify-between text-[10px] font-bold tracking-tight text-slate-500">
                <span>Total Earned: <span className="text-indigo-600">{stats.totalEarned}</span></span>
                <span>Total Spent: {stats.totalSpent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid gap-4 mt-8 mb-12 relative z-30">
          {verificationStatus !== 'verified' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-lg shadow-indigo-100/20 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Security Verification Required</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Please verify your identity to unlock all platform features and start swapping.</p>
                </div>
              </div>
              <Link to={createPageUrl('Settings')} className="w-full md:w-auto">
                <Button size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-11 px-8 rounded-xl">
                  Start Verification
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'My Properties', value: stats.activeListings, icon: Home },
            { label: 'Swaps Completed', value: stats.swapsCompleted, icon: ArrowLeftRight },
            { label: 'User Rating', value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'New', icon: Star },
            { label: 'Total Views', value: stats.totalViews, icon: Eye },
          ].map((stat, index) => (
            <Card key={index} className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
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

            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between px-8 py-6 bg-white">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent Activity</CardTitle>
                <Link to={createPageUrl('MySwaps')}>
                  <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-bold text-xs">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {swapRequests.length === 0 ? (
                  <div className="text-center py-24 text-slate-300">
                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-xs uppercase tracking-widest">No activity found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {swapRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between px-8 py-6 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                            {request.status === 'approved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{request.property_title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                              Dates: {request.check_in && format(new Date(request.check_in), 'dd MMM')} — {request.check_out && format(new Date(request.check_out), 'dd MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${request.status === 'pending' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                          request.status === 'approved' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500 bg-slate-50 border-slate-200'
                          } capitalize font-bold text-[10px] px-3 py-1 rounded-lg tracking-tight`}>
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
            <Card className="border-slate-100 bg-white rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="pb-4 px-8 pt-8">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 px-6 pb-8">
                <Link to={createPageUrl('MyListings')} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all font-bold text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <Home className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    List a Property
                  </Button>
                </Link>
                <Link to={createPageUrl('Messages')} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all relative font-bold text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <MessageSquare className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    Messages
                    {messages.length > 0 && (
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to={createPageUrl('MySwaps') + '?tab=video-calls'} className="block">
                  <Button variant="outline" className="w-full justify-start border-slate-100 bg-slate-50/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group transition-all font-bold text-[10px] uppercase tracking-widest h-14 px-6 rounded-2xl">
                    <Video className="w-4 h-4 mr-4 text-slate-400 group-hover:text-white" />
                    Video Calls
                    {upcomingCalls.length > 0 && <Badge className="ml-auto bg-indigo-600 rounded-md h-5 px-2 text-white">{upcomingCalls.length}</Badge>}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-white rounded-3xl shadow-sm overflow-hidden group hover:border-indigo-100 transition-colors">
              <CardHeader className="pb-4 px-8 pt-8 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Referral Program</CardTitle>
                <Users className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </CardHeader>
              <CardContent className="px-8 pb-8 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {user?.referred_users_verified_count || 0}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-1">Verified Friends</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight text-slate-500">
                    <span>Lifetime Waiver Progress</span>
                    <span>{Math.min(100, Math.round(((user?.referred_users_verified_count || 0) / 5) * 100))}%</span>
                  </div>
                  <Progress value={((user?.referred_users_verified_count || 0) / 5) * 100} className="h-2 bg-slate-100" />
                </div>
                <Link to={createPageUrl('ReferralDashboard')} className="block pt-2">
                  <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 font-bold text-xs h-10 px-0 justify-between">
                    Invite & Track Rewards <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-100 bg-slate-50 overflow-hidden rounded-3xl shadow-sm relative">
              <div className="p-8 relative z-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Profile Status</h4>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">
                    {verificationStatus === 'verified' ? '100%' : '65%'}
                  </span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-1">Complete</span>
                </div>
                <Progress value={verificationStatus === 'verified' ? 100 : 65} className="h-2 bg-slate-200" />

                <div className="mt-8 space-y-4">
                  {[
                    { l: 'Identity Verified', d: verificationStatus === 'verified' },
                    { l: 'Workplace Verified', d: true },
                    { l: 'Property Listed', d: properties.length > 0 }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                      {item.d ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                      <span className={item.d ? 'text-slate-900' : 'text-slate-400'}>{item.l}</span>
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