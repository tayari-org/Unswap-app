import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isFuture, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar, Heart, MapPin, Star, TrendingUp, Home, 
  Clock, CheckCircle, User, Settings, Search, Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PropertyCard from '../components/properties/PropertyCard';
import GuestPointsWidget from '../components/points/GuestPointsWidget';
import PointsRedemptionDialog from '../components/points/PointsRedemptionDialog';

export default function GuestDashboard() {
  const [activeTab, setActiveTab] = useState('approved');
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  // Fetch guest's swap requests
  const { data: mySwaps = [] } = useQuery({
    queryKey: ['guest-swaps', user?.email],
    queryFn: () => api.entities.SwapRequest.filter({ 
      requester_email: user?.email 
    }, '-created_date'),
    enabled: !!user?.email,
  });

  // Fetch saved properties (wishlist)
  const { data: wishlistProperties = [] } = useQuery({
    queryKey: ['wishlist-properties', user?.saved_properties],
    queryFn: async () => {
      if (!user?.saved_properties || user.saved_properties.length === 0) return [];
      const properties = await api.entities.Property.list();
      return properties.filter(p => user.saved_properties.includes(p.id));
    },
    enabled: !!user?.saved_properties,
  });

  // Fetch all properties to get images
  const { data: properties = [] } = useQuery({
    queryKey: ['all-properties'],
    queryFn: () => api.entities.Property.list(),
  });

  // Fetch reviews left by the guest
  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => api.entities.Review.filter({ 
      reviewer_email: user?.email 
    }),
    enabled: !!user?.email,
  });

  // Categorize swaps
  const approvedSwaps = mySwaps.filter(s => 
    ['approved', 'video_scheduled', 'pending_guest_approval', 'guest_agreed'].includes(s.status)
  );

  const currentSwaps = mySwaps.filter(s => 
    (s.status === 'approved' || s.status === 'video_scheduled') && 
    s.check_in && s.check_out &&
    !isFuture(new Date(s.check_in)) && isFuture(new Date(s.check_out))
  );

  const pastSwaps = mySwaps.filter(s => 
    s.status === 'completed' || 
    (s.check_out && isPast(new Date(s.check_out)))
  );

  const pendingSwaps = mySwaps.filter(s => 
    s.status === 'pending' || s.status === 'counter_proposed'
  );

  // Stats
  const totalStays = pastSwaps.length;
  const totalPoints = user?.guest_points || 500;
  const avgRating = user?.average_rating || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Please log in to access your dashboard</p>
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
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.full_name}!</h1>
            <p className="text-slate-600 mt-1">Your travel hub for all your stays</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('FindProperties')}>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Search className="w-4 h-4 mr-2" />
                Find Properties
              </Button>
            </Link>
            <Link to={createPageUrl('Settings')}>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Coins className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalPoints}</p>
                  <p className="text-sm text-slate-600 mt-1">GuestPoints</p>
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
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{approvedSwaps.length}</p>
                  <p className="text-sm text-slate-600 mt-1">Approved Stays</p>
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
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalStays}</p>
                  <p className="text-sm text-slate-600 mt-1">Completed Stays</p>
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
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{wishlistProperties.length}</p>
                  <p className="text-sm text-slate-600 mt-1">Saved Properties</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="approved">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved
              {approvedSwaps.length > 0 && (
                <Badge className="ml-2 bg-blue-500">{approvedSwaps.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="w-4 h-4 mr-2" />
              Pending
              {pendingSwaps.length > 0 && (
                <Badge className="ml-2 bg-amber-500">{pendingSwaps.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              <CheckCircle className="w-4 h-4 mr-2" />
              Past Stays
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              My Reviews
            </TabsTrigger>
          </TabsList>

          {/* Approved Bookings */}
          <TabsContent value="approved" className="space-y-4">
            {currentSwaps.length > 0 && (
              <Card className="border-blue-500 border-2">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="text-blue-900">Currently Staying</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {currentSwaps.map(swap => {
                    const property = properties.find(p => p.id === swap.property_id);
                    return (
                      <div key={swap.id} className="p-4 bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {property?.images?.[0] && (
                            <div className="w-full sm:w-32 h-24 shrink-0 rounded-md overflow-hidden bg-slate-100">
                              <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-lg">{swap.property_title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <Badge className="bg-blue-500">Active Stay</Badge>
                              <Link to={createPageUrl('MySwaps')}>
                                <Button size="sm">View Details</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {approvedSwaps.filter(s => !currentSwaps.find(c => c.id === s.id)).length > 0 ? (
              <div className="space-y-4">
                {approvedSwaps.filter(s => !currentSwaps.find(c => c.id === s.id)).map(swap => {
                  const property = properties.find(p => p.id === swap.property_id);
                  return (
                    <Card key={swap.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {property?.images?.[0] && (
                            <div className="w-full sm:w-40 h-28 shrink-0 rounded-md overflow-hidden bg-slate-100">
                              <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 text-lg">{swap.property_title}</h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-600">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                              </div>
                              <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-700">
                                {swap.swap_type === 'reciprocal' ? 'Reciprocal' : `${swap.total_points} pts`}
                              </Badge>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Link to={createPageUrl('MySwaps')}>
                                <Button variant="outline" size="sm">Manage</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-4">No approved stays</p>
                  <Link to={createPageUrl('FindProperties')}>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Properties
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="pending" className="space-y-4">
            {pendingSwaps.length > 0 ? (
              pendingSwaps.map(swap => {
                const property = properties.find(p => p.id === swap.property_id);
                return (
                  <Card key={swap.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {property?.images?.[0] && (
                          <div className="w-full sm:w-40 h-28 shrink-0 rounded-md overflow-hidden bg-slate-100">
                            <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-lg">{swap.property_title}</h3>
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              {swap.status === 'counter_proposed' ? 'Counter Offer' : 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                          </div>
                          {swap.status === 'counter_proposed' && swap.counter_check_in && (
                            <p className="text-sm text-amber-700 mt-2 font-medium">
                              Host proposed: {format(new Date(swap.counter_check_in), 'MMM d')} - {format(new Date(swap.counter_check_out), 'MMM d, yyyy')}
                            </p>
                          )}
                          <div className="mt-4 flex justify-end">
                            <Link to={createPageUrl('MySwaps')}>
                              <Button size="sm">Review</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No pending requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Past Stays */}
          <TabsContent value="past" className="space-y-4">
            {pastSwaps.length > 0 ? (
              pastSwaps.map(swap => {
                const property = properties.find(p => p.id === swap.property_id);
                const hasReviewed = myReviews.some(r => r.swap_request_id === swap.id);
                return (
                  <Card key={swap.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        {property?.images?.[0] && (
                          <div className="w-full sm:w-40 h-28 shrink-0 rounded-md overflow-hidden bg-slate-100">
                            <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-lg">{swap.property_title}</h3>
                          <div className="flex items-center gap-2 mt-2 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                          </div>
                          <div className="mt-2">
                            {hasReviewed ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Reviewed</Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">Review Pending</Badge>
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 justify-end">
                            {!hasReviewed && (
                              <Link to={createPageUrl('MySwaps')}>
                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                                  <Star className="w-4 h-4 mr-2" />
                                  Leave Review
                                </Button>
                              </Link>
                            )}
                            <Link to={createPageUrl(`PropertyDetails?id=${swap.property_id}`)}>
                              <Button variant="outline" size="sm">View Property</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-4">No past stays yet</p>
                  <p className="text-sm text-slate-500">Start exploring properties to book your first stay!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist">
            {wishlistProperties.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProperties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-4">Your wishlist is empty</p>
                  <p className="text-sm text-slate-500 mb-4">Save properties you like to easily find them later</p>
                  <Link to={createPageUrl('FindProperties')}>
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      Browse Properties
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Reviews */}
          <TabsContent value="reviews" className="space-y-4">
            {myReviews.length > 0 ? (
              myReviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{review.property_title}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {format(new Date(review.created_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-slate-600">{review.review_text}</p>
                    )}
                    {review.response_from_host && (
                      <div className="mt-3 pl-4 border-l-2 border-slate-200">
                        <p className="text-sm font-medium text-slate-700">Host Response:</p>
                        <p className="text-sm text-slate-600 mt-1">{review.response_from_host}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600 mb-2">No reviews yet</p>
                  <p className="text-sm text-slate-500">Leave reviews after your stays to help other guests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Points Widget */}
          <div className="lg:col-span-1">
            <GuestPointsWidget user={user} onRedeem={() => setShowRedeemDialog(true)} />
          </div>
        </div>

        {/* Redemption Dialog */}
        <PointsRedemptionDialog
          open={showRedeemDialog}
          onOpenChange={setShowRedeemDialog}
          user={user}
        />
      </div>
    </div>
  );
}