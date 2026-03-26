import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Home, TrendingUp, Calendar, MessageSquare, Settings, Plus,
  Eye, Heart, Star, Coins, Users, ArrowUpRight, Clock, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import PerformanceMetrics from '../components/host/PerformanceMetrics';
import BookingTrends from '../components/host/BookingTrends';
import EarningsOverview from '../components/host/EarningsOverview';
import AvailabilityCalendar from '../components/host/AvailabilityCalendar';
import QuickActions from '../components/host/QuickActions';
import RecentReviews from '../components/host/RecentReviews';
import NotificationCenter from '../components/notifications/NotificationCenter';
import NotificationPreferences from '../components/notifications/NotificationPreferences';
import ReferralProgram from '../components/host/ReferralProgram';

export default function HostDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedProperty, setSelectedProperty] = useState('all');

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  // Fetch host's properties
  const { data: properties = [] } = useQuery({
    queryKey: ['host-properties', user?.email],
    queryFn: () => api.entities.Property.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch swap requests for host's properties
  const { data: swapRequests = [] } = useQuery({
    queryKey: ['host-swap-requests', user?.email],
    queryFn: () => api.entities.SwapRequest.filter({ host_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch reviews for host
  const { data: reviews = [] } = useQuery({
    queryKey: ['host-reviews', user?.email],
    queryFn: () => api.entities.Review.filter({ target_email: user?.email, status: 'approved' }),
    enabled: !!user?.email,
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['host-messages', user?.email],
    queryFn: async () => {
      const sent = await api.entities.Message.filter({ sender_email: user?.email });
      const received = await api.entities.Message.filter({ recipient_email: user?.email });
      return [...sent, ...received];
    },
    enabled: !!user?.email,
  });

  // Calculate metrics
  const activeListings = properties.filter(p => p.status === 'active').length;
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const totalFavorites = properties.reduce((sum, p) => sum + (p.favorites_count || 0), 0);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const completedSwaps = swapRequests.filter(s => s.status === 'completed').length;
  const pendingRequests = swapRequests.filter(s => s.status === 'pending').length;
  const unreadMessages = messages.filter(m => m.recipient_email === user?.email && !m.is_read).length;

  // Filter data by selected property
  const filteredSwapRequests = selectedProperty === 'all'
    ? swapRequests
    : swapRequests.filter(s => s.property_id === selectedProperty);

  const filteredReviews = selectedProperty === 'all'
    ? reviews
    : reviews.filter(r => r.property_id === selectedProperty);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please log in to access the host dashboard</p>
          <Button onClick={() => api.auth.redirectToLogin()}>Log In</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'earnings', label: 'Earnings', icon: Coins },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* FULL-HEIGHT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-unswap-blue-deep sticky top-0 h-screen overflow-y-auto z-40">
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Host Dashboard</h1>
          <Badge variant="outline" className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 w-fit rounded-full text-[9px] border-white/20 bg-white/10 text-white/80`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user?.verification_status === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {user?.verification_status?.toUpperCase() || 'UNVERIFIED'}
          </Badge>
        </div>

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
                <span className={`text-[13px] tracking-wide ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="px-3 pb-6 mt-auto border-t border-white/10 pt-4">
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="w-full justify-start text-white/50 hover:text-red-300 hover:bg-white/5 transition-all font-semibold text-[11px] tracking-wide gap-2 h-9 rounded-sm">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-unswap-blue-deep font-display">Host Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest">
            <LogOut className="w-3 h-3 mr-1.5" />
            Sign Out
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-sm transition-all ${activeTab === item.id
                ? 'bg-unswap-blue-deep text-white'
                : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto md:pt-0 pt-28">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep mb-2">Host Options</p>
              <h1 className="text-4xl font-extralight tracking-tighter text-slate-900">
                {navItems.find(i => i.id === activeTab)?.label || 'Overview'}
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-serif italic">
                Manage your listings and track your performance
              </p>
            </div>

        </div>

        {/* Property Filter */}
        {properties.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">View data for:</span>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedProperty === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProperty('all')}
              >
                All Properties
              </Button>
              {properties.map(property => (
                <Button
                  key={property.id}
                  variant={selectedProperty === property.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedProperty(property.id)}
                >
                  {property.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Home className="w-8 h-8 text-slate-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{activeListings}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Active Listings</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{totalViews}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Total Views</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{totalFavorites}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Favorites</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Star className="w-8 h-8 text-amber-500" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{averageRating || '—'}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{completedSwaps}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Completed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{pendingRequests}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Pending</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="hover:shadow-xl transition-shadow rounded-none border-unswap-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                  {unreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-[10px] rounded-none w-5 h-5 flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extralight italic font-serif text-slate-900">{unreadMessages}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Unread</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>



        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            <PerformanceMetrics
              properties={properties}
              selectedProperty={selectedProperty}
              swapRequests={filteredSwapRequests}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <BookingTrends swapRequests={filteredSwapRequests} />
              <RecentReviews reviews={filteredReviews.slice(0, 5)} />
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingTrends swapRequests={filteredSwapRequests} detailed />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <AvailabilityCalendar
              properties={properties.filter(p => selectedProperty === 'all' || p.id === selectedProperty)}
              swapRequests={filteredSwapRequests}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <RecentReviews reviews={filteredReviews} detailed />
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <EarningsOverview
              swapRequests={filteredSwapRequests}
              properties={properties.filter(p => selectedProperty === 'all' || p.id === selectedProperty)}
            />
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <ReferralProgram user={user} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Center</CardTitle>
                    <CardDescription>View and manage your notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NotificationCenter user={user} showFullView={true} />
                  </CardContent>
                </Card>
              </div>
              <div>
                <NotificationPreferences />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
     </main>
    </div>
  );
}