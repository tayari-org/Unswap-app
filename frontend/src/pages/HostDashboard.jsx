import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Home, TrendingUp, Calendar, MessageSquare, Settings, Plus,
  Eye, Heart, Star, Coins, Users, ArrowUpRight, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMetrics from '../components/host/PerformanceMetrics';
import BookingTrends from '../components/host/BookingTrends';
import EarningsOverview from '../components/host/EarningsOverview';
import AvailabilityCalendar from '../components/host/AvailabilityCalendar';
import QuickActions from '../components/host/QuickActions';
import RecentReviews from '../components/host/RecentReviews';
import NotificationCenter from '../components/notifications/NotificationCenter';
import NotificationPreferences from '../components/notifications/NotificationPreferences';

export default function HostDashboard() {
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
    queryFn: () => api.entities.Review.filter({ host_email: user?.email, status: 'approved' }),
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Host Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Manage your listings and track your performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MyListings')}>
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                My Listings
              </Button>
            </Link>
            <Link to={createPageUrl('PropertyForm')}>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Property Filter */}
        {properties.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-700">View data for:</span>
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
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Home className="w-8 h-8 text-slate-600" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{activeListings}</p>
                  <p className="text-sm text-slate-600 mt-1">Active Listings</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
                  <p className="text-sm text-slate-600 mt-1">Total Views</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{totalFavorites}</p>
                  <p className="text-sm text-slate-600 mt-1">Favorites</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Star className="w-8 h-8 text-amber-500" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{averageRating || '—'}</p>
                  <p className="text-sm text-slate-600 mt-1">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{completedSwaps}</p>
                  <p className="text-sm text-slate-600 mt-1">Completed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{pendingRequests}</p>
                  <p className="text-sm text-slate-600 mt-1">Pending</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                  {unreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-slate-900">{unreadMessages}</p>
                  <p className="text-sm text-slate-600 mt-1">Unread</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <QuickActions 
          pendingCount={pendingRequests}
          unreadCount={unreadMessages}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
            <TabsTrigger value="overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <Coins className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

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
    </div>
  );
}