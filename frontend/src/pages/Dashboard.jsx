import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AvatarUI } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Home, ArrowLeftRight, Coins, Star, Shield, ChevronRight, Eye,
  MessageSquare, Clock, CheckCircle, XCircle, Users, Video, Sparkles, CreditCard, Crown,
  User, Check, LayoutDashboard, LogOut, Bell, Users as UsersIcon, Copy, TrendingUp, Heart, MapPin, Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import SwapPartnerSuggestions from '../components/dashboard/SwapPartnerSuggestions';
import SubscriptionPlans from './SubscriptionPlans';
import GuestPointsTab from '../components/settings/GuestPointsTab';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast.success('🎉 Subscription activated! Welcome to UNswap Premium.', { duration: 6000 });
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

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

  const { data: leaderboard } = useQuery({
    queryKey: ['referral-leaderboard'],
    queryFn: () => api.referrals.getLeaderboard(),
    enabled: !!user?.email,
  });

  // Saved / Favorite properties
  const savedIds = React.useMemo(() => {
    try {
      const sp = user?.saved_properties;
      return Array.isArray(sp) ? sp : JSON.parse(sp || '[]');
    } catch { return []; }
  }, [user?.saved_properties]);

  const { data: savedProperties = [] } = useQuery({
    queryKey: ['saved-properties', savedIds.join(',')],
    queryFn: async () => {
      if (!savedIds.length) return [];
      const results = await Promise.all(
        savedIds.map(id => api.entities.Property.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: savedIds.length > 0,
  });

  const { data: subscriptionPlan } = useQuery({
    queryKey: ['user-subscription-plan', user?.subscription_plan_id],
    queryFn: async () => {
      const results = await api.entities.SubscriptionPlan.filter({ id: user?.subscription_plan_id });
      return results?.[0] || null;
    },
    enabled: !!user?.subscription_plan_id,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => api.entities.Review.filter({ target_email: user?.email, status: 'approved' }),
    enabled: !!user?.email,
  });

  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length)
    : 0;

  const stats = {
    guestPoints: user?.guest_points ?? 500,
    totalEarned: user?.total_points_earned || 0,
    totalSpent: user?.total_points_spent || 0,
    swapsCompleted: user?.swaps_completed || 0,
    hostingCount: user?.hosting_count || 0,
    avgRating,
    reviewsCount: myReviews.length,
    activeListings: properties.filter(p => p.status === 'active').length,
    totalViews: properties.reduce((sum, p) => sum + (p.views_count || 0), 0),
  };

  const pendingRequests = swapRequests.filter(r => r.status === 'pending' && r.host_email === user?.email);
  const verificationStatus = user?.verification_status || 'unverified';

  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'listings', label: 'My Listings', icon: Home },
    { id: 'saved', label: 'Saved', icon: Heart, count: savedIds.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
    { id: 'calls', label: 'Video Calls', icon: Video },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'referrals', label: 'Referrals', icon: UsersIcon },
    { id: 'guest-points', label: 'Guest Points', icon: Sparkles },
  ];

  const copyReferralLink = () => {
    const link = `${window.location.origin}/login?ref=${user?.referral_code || user?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex w-60 flex-col bg-unswap-blue-deep border-r border-[#001733] shadow-2xl z-20">
        {/* Sidebar Header / Brand */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Dashboard</h1>
          <Badge variant="outline" className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 w-fit rounded-full text-[9px] border-white/20 bg-white/10 text-white/80`}>
             <span className={`w-1.5 h-1.5 rounded-full ${verificationStatus === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
             {verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="px-3 pt-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Menu</span>
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 transition-all text-left rounded-sm border-l-[3px] ${activeTab === item.id
                  ? 'border-unswap-silver-light bg-white/10 text-white'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                <span className={`flex-1 text-[13px] tracking-wide ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                {item.count > 0 && (
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${activeTab === item.id ? 'bg-white text-unswap-blue-deep' : 'bg-white/10 text-white'}`}>{item.count}</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Points at bottom */}
        <div className="px-3 pb-6 mt-auto border-t border-white/10 pt-4 space-y-2">
            <div className="px-3 flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden flex-shrink-0">
                <AvatarUI user={user} className="w-full h-full text-white text-[10px] bg-white/10" />
              </div>
              <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white truncate">
                    {user?.full_name || user?.username || user?.email?.split('@')[0] || '—'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-bold text-white/70">{(user?.guest_points ?? 0).toLocaleString()} <span className="uppercase text-[9px] font-normal">pts</span></span>
                  </div>
                </div>
            </div>

          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="w-full justify-start text-white/50 hover:text-red-300 hover:bg-white/5 transition-all font-semibold text-[11px] tracking-wide gap-2 h-9 rounded-sm">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER (shown only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-unswap-blue-deep font-display">Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="text-stone-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest">
            <LogOut className="w-3 h-3 mr-1.5" />
            Sign Out
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-sm transition-all ${activeTab === item.id
                ? 'bg-unswap-blue-deep text-white'
                : 'text-stone-500 hover:bg-stone-100'
                }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              {item.count > 0 && <span className="ml-1 opacity-70">({item.count})</span>}
            </button>
          ))}
        </div>
      </div>

       {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto lg:pt-0 pt-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
          <div className="mb-8">
            <h2 className="text-3xl font-light text-slate-900 tracking-tight">
              Welcome back, <span className="font-medium">{user?.username || user?.full_name || 'Colleague'}</span>
            </h2>
            <p className="text-stone-500 text-sm mt-1">Manage your listings, swaps, and account settings</p>
          </div>

          <div className="space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Listings', value: stats.activeListings, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Exchanges', value: stats.swapsCompleted, icon: ArrowLeftRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Rating', value: stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} (${stats.reviewsCount})` : '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                              <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</p>
                          <p className="text-xs text-stone-400 mt-1 font-medium">{stat.label}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <Link to={createPageUrl('MySwaps')}>
                      <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-medium text-sm h-8">
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <Card className="border border-stone-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-0">
                      {swapRequests.length === 0 ? (
                        <div className="text-center py-16 px-8">
                          <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ArrowLeftRight className="w-6 h-6 text-stone-300" />
                          </div>
                          <p className="text-lg font-medium text-slate-900 mb-1">No swap requests yet</p>
                          <p className="text-stone-400 text-sm mb-6 max-w-sm mx-auto">Start browsing properties or add your own to begin swapping</p>
                          <Link to={createPageUrl('FindProperties')}>
                            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8 h-10 text-sm font-medium shadow-lg shadow-blue-600/20">
                              Find Properties
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {swapRequests.slice(0, 5).map((request) => (
                            <div key={request.id} className="flex items-center justify-between px-6 py-5 hover:bg-stone-50/50 transition-colors duration-200 group">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                    request.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                      'bg-stone-100 text-stone-500'
                                  }`}>
                                  {request.status === 'approved' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{request.property_title}</p>
                                  <p className="text-xs text-stone-400 mt-0.5">
                                    {request.check_in && format(new Date(request.check_in), 'MMM dd')} – {request.check_out && format(new Date(request.check_out), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${request.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  request.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    'bg-stone-100 text-slate-600 border-stone-200'
                                } border rounded-full capitalize text-xs font-medium px-3 py-0.5 ml-4 flex-shrink-0 shadow-none`}>
                                {request.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Guest Points Card */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <Coins className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Available Balance</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-5xl font-light tracking-tight">
                            {stats.guestPoints.toLocaleString()}
                          </span>
                          <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">GP</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:min-w-[220px]">
                        <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] text-stone-400 font-medium">Total Earned</span>
                            <span className="text-xs text-emerald-400 font-semibold">+{(stats.totalEarned || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-stone-400 font-medium">Total Spent</span>
                            <span className="text-xs text-stone-300 font-semibold">-{(stats.totalSpent || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setActiveTab('guest-points')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl h-10 text-sm transition-all shadow-lg shadow-blue-600/20"
                        >
                          Earn More Points
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}


            {activeTab === 'listings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">My Listings</h2>
                  <Link to={createPageUrl('AddProperty')}>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 h-10 font-medium text-sm shadow-lg shadow-blue-600/20">
                      + Add Property
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.length === 0 ? (
                    <Card className="col-span-2 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 p-16 text-center">
                      <Home className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500 font-medium">No properties listed yet</p>
                      <p className="text-stone-400 text-sm mt-1">Add your first property to start swapping</p>
                    </Card>
                  ) : (
                    properties.map((property) => (
                      <Card key={property.id} className="border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group bg-white">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-stone-100 relative overflow-hidden">
                            {property.image_url ? (
                              <img src={property.image_url} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                <Home className="w-12 h-12" />
                              </div>
                            )}
                            <Badge className={`absolute top-3 right-3 rounded-full border-0 font-medium text-xs capitalize ${property.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                              }`}>
                              {property.status}
                            </Badge>
                          </div>
                          <div className="p-5">
                            <p className="text-xs text-blue-600 font-medium mb-1">{property.location}</p>
                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-3 group-hover:text-blue-600 transition-colors">{property.title}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-stone-400 text-xs font-medium">
                                <span>{property.bedrooms} Beds</span>
                                <span>{property.bathrooms} Baths</span>
                              </div>
                              <Link to={createPageUrl('PropertyDetails') + `?id=${property.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium text-sm h-8">
                                  Manage →
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Messages</h2>
                  <Link to={createPageUrl('Messages')}>
                    <Button variant="outline" size="sm" className="rounded-xl text-sm font-medium">View All Messages</Button>
                  </Link>
                </div>

                <Card className="border border-stone-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-0">
                    {messages.length === 0 ? (
                      <div className="text-center py-20">
                        <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-stone-500 font-medium">No unread messages</p>
                        <p className="text-stone-400 text-sm mt-1">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {messages.map((msg) => (
                          <Link key={msg.id} to={createPageUrl('Messages')}>
                            <div className="px-6 py-5 hover:bg-stone-50/50 transition-colors cursor-pointer group">
                              <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs flex-shrink-0">
                                  {msg.sender_name?.[0] || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900">{msg.sender_name}</p>
                                    <span className="text-xs text-stone-400">
                                      {format(new Date(msg.created_date), 'HH:mm · MMM dd')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-stone-500 truncate mt-1">{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900">Upcoming Video Calls</h2>

                <div className="grid grid-cols-1 gap-4">
                  {upcomingCalls.length === 0 ? (
                    <Card className="border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 p-16 text-center">
                      <Video className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500 font-medium">No upcoming calls</p>
                      <p className="text-stone-400 text-sm mt-1">Video calls will appear here once scheduled</p>
                    </Card>
                  ) : (
                    upcomingCalls.map((call) => (
                      <Card key={call.id} className="border border-stone-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white">
                              <span className="text-[10px] font-bold uppercase">{format(new Date(call.scheduled_time), 'MMM')}</span>
                              <span className="text-xl font-light">{format(new Date(call.scheduled_time), 'dd')}</span>
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 font-medium mb-0.5">Upcoming Call</p>
                              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                                Meeting with {call.guest_email === user?.email ? call.host_email : call.guest_email}
                              </h3>
                              <p className="text-stone-400 text-sm mt-0.5">
                                {format(new Date(call.scheduled_time), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                          <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6 font-medium text-sm shadow-lg shadow-blue-600/20">
                            Join Call
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <SubscriptionPlans isTab={true} />
            )}

            {activeTab === 'referrals' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900">Referral Program</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Referral Card */}
                  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 rounded-2xl overflow-hidden shadow-xl">
                    <CardContent className="p-8 relative">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent)]" />
                      <UsersIcon className="absolute -right-6 -bottom-6 w-36 h-36 opacity-5" />

                      <div className="relative z-10">
                        <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">Network Growth</p>
                        <h3 className="text-4xl font-light mb-1 tracking-tight">
                          {user?.referred_users_verified_count || 0}
                          <span className="text-sm font-medium text-stone-400 ml-2">verified referrals</span>
                        </h3>

                        <div className="mt-8 space-y-3">
                          <label className="text-xs font-medium text-stone-400">Your Referral Link</label>
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={`${window.location.origin}/login?ref=${user?.referral_code || user?.id}`}
                              className="bg-white/5 border-white/10 text-white rounded-xl h-10 font-mono text-xs"
                            />
                            <Button
                              size="icon"
                              onClick={copyReferralLink}
                              className="bg-white text-slate-900 rounded-xl h-10 w-10 hover:bg-stone-100 transition-all flex-shrink-0"
                            >
                              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rewards Track + Leaderboard */}
                  <Card className="border border-stone-100 rounded-2xl shadow-sm bg-white">
                    <CardHeader className="pb-3 px-6 pt-6">
                      <CardTitle className="text-sm font-semibold text-slate-900">Rewards Track</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pb-2">
                      {[
                        { count: 1, text: '1,000 bonus GuestPoints', icon: '🎁' },
                        { count: 5, text: 'Lifetime fee waiver', icon: '✨' },
                        { count: 10, text: 'VIP Status', icon: '👑' }
                      ].map((tier, i) => {
                        const achieved = (user?.referred_users_verified_count || 0) >= tier.count;
                        return (
                          <div key={i} className={`flex items-center justify-between px-6 py-4 mx-2 rounded-xl mb-1 transition-colors ${achieved ? 'bg-blue-50/50' : ''}`}>
                            <div className="flex items-center gap-3">
                              {achieved ? (
                                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-stone-200" />
                              )}
                              <span className={`text-sm font-medium ${achieved ? 'text-blue-700' : 'text-stone-500'}`}>
                                {tier.count} {tier.count === 1 ? 'Colleague' : 'Colleagues'}
                              </span>
                            </div>
                            <span className="text-xs text-stone-400 font-medium">{tier.icon} {tier.text}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Leaderboard */}
                <Card className="border border-stone-100 rounded-2xl shadow-sm bg-white">
                  <CardHeader className="px-6 pt-6 pb-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <CardTitle className="text-sm font-semibold text-slate-900">Referral Leaderboard</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 pb-4">
                    {!leaderboard ? (
                      <p className="text-center text-stone-400 py-8 text-sm">Loading leaderboard…</p>
                    ) : (
                      <div>
                        {(leaderboard.top5 || []).map((entry, i) => {
                          const isMe = entry.email === user?.email;
                          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                          return (
                            <div key={entry.rank} className={`flex items-center justify-between px-6 py-3 mx-2 rounded-xl mb-0.5 ${isMe ? 'bg-blue-50 border border-blue-100' : 'hover:bg-stone-50'}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-6 text-center text-sm font-bold text-stone-400">
                                  {medal || `#${entry.rank}`}
                                </span>
                                <span className={`text-sm font-medium ${isMe ? 'text-blue-700' : 'text-slate-700'}`}>
                                  {isMe ? 'You' : entry.name}
                                </span>
                                {isMe && <Badge className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0 border-0">You</Badge>}
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{entry.verified} <span className="text-xs text-stone-400 font-normal">referrals</span></span>
                            </div>
                          );
                        })}

                        {/* User's position if outside top 10 */}
                        {leaderboard.currentUser && !leaderboard.top5?.some(e => e.email === user?.email) && (
                          <>
                            <div className="flex items-center gap-2 px-6 py-1">
                              <div className="flex-1 border-t border-dashed border-stone-200" />
                              <span className="text-[10px] text-stone-400">your position</span>
                              <div className="flex-1 border-t border-dashed border-stone-200" />
                            </div>
                            <div className="flex items-center justify-between px-6 py-3 mx-2 rounded-xl bg-blue-50 border border-blue-100">
                              <div className="flex items-center gap-3">
                                <span className="w-6 text-center text-sm font-bold text-blue-600">#{leaderboard.currentUser.rank}</span>
                                <span className="text-sm font-medium text-blue-700">You</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{leaderboard.currentUser.verified} <span className="text-xs text-stone-400 font-normal">referrals</span></span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Saved Properties</h2>
                  <Link to={createPageUrl('FindProperties')}>
                    <Button variant="outline" size="sm" className="rounded-xl text-sm font-medium">Browse More</Button>
                  </Link>
                </div>

                {savedIds.length === 0 ? (
                  <Card className="border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 p-16 text-center">
                    <Heart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-500 font-medium">No saved properties yet</p>
                    <p className="text-stone-400 text-sm mt-1">Tap the heart icon on any property to save it here</p>
                    <Link to={createPageUrl('FindProperties')} className="inline-block mt-6">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8 h-10 text-sm font-medium">Browse Properties</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedProperties.map((property) => (
                      <Card key={property.id} className="border border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group bg-white">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-stone-100 relative overflow-hidden">
                            <img
                              src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
                              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium mb-1">
                              <MapPin className="w-3 h-3" />
                              {property.city}{property.country ? `, ${property.country}` : ''}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-3 group-hover:text-blue-600 transition-colors">{property.title}</h3>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-stone-400 text-xs font-medium">
                                <span>{property.bedrooms} Beds</span>
                                <span>{property.bathrooms} Baths</span>
                                <span className="text-blue-600 font-semibold">{property.nightly_points || 200} pts/night</span>
                              </div>
                              <Link to={createPageUrl('PropertyDetails') + `?id=${property.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium text-sm h-8">View →</Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'guest-points' && (
              <GuestPointsTab user={user} />
            )}
          </div>
        </div>
      </main>

      <OnboardingWizard user={user} open={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}