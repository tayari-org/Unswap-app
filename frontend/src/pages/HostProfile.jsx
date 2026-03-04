import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, Shield, Star, MapPin, Building2, Briefcase, Calendar,
  MessageSquare, Home, ArrowLeftRight, CheckCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PropertyCard from '../components/properties/PropertyCard';
import HostContactDialog from '../components/host/HostContactDialog';
import ReviewList from '../components/reviews/ReviewList';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';

export default function HostProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostEmail = urlParams.get('email');
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const isCurrentUserVerified = currentUser?.verification_status === 'verified' || currentUser?.role === 'admin';

  const { data: users = [] } = useQuery({
    queryKey: ['host-user', hostEmail],
    queryFn: () => api.entities.User.filter({ email: hostEmail }),
    enabled: !!hostEmail,
  });

  const host = users[0];

  const { data: verification } = useQuery({
    queryKey: ['host-verification', hostEmail],
    queryFn: () => api.entities.Verification.filter({ user_email: hostEmail }),
    enabled: !!hostEmail,
  });

  const isVerified = (verification?.[0]?.status === 'approved') || host?.role === 'admin';

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['host-properties', hostEmail],
    queryFn: () => api.entities.Property.filter({ owner_email: hostEmail, status: 'active' }),
    enabled: !!hostEmail,
  });

  const { data: completedSwaps = [] } = useQuery({
    queryKey: ['host-swaps', hostEmail],
    queryFn: () => api.entities.SwapRequest.filter({
      host_email: hostEmail,
      status: 'completed'
    }, '-completed_at', 10),
    enabled: !!hostEmail,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['host-reviews', hostEmail],
    queryFn: () => api.entities.Review.filter({ host_email: hostEmail, status: 'approved' }, '-created_date'),
    enabled: !!hostEmail,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const isOwnProfile = currentUser?.email === hostEmail;

  if (!hostEmail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Host not found</h2>
          <Link to={createPageUrl('FindProperties')}>
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Redirect unverified users
  if (currentUser && !isOwnProfile && !isCurrentUserVerified) {
    return (
      <>
        <VerificationRequiredDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              window.history.back();
            }
          }}
          action="view host profiles"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to={createPageUrl('FindProperties')} className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Host Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                  {host?.avatar_url ? (
                    <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Name & Verification */}
                <h1 className="text-xl font-bold text-slate-900 mb-1">
                  {host?.username || host?.full_name}
                </h1>

                {isVerified && (
                  <Badge className="bg-emerald-500 text-white mb-4">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Staff Member
                  </Badge>
                )}

                {/* Rating */}
                {reviews.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-900">{averageRating}</span>
                    <span className="text-slate-500">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-100 my-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
                    <p className="text-sm text-slate-500">Listings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{host?.swaps_completed || 0}</p>
                    <p className="text-sm text-slate-500">Swaps</p>
                  </div>
                </div>

                {/* Contact Button */}
                {!isOwnProfile && currentUser && isCurrentUserVerified && (
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={() => setShowContactDialog(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Host
                  </Button>
                )}

                {isOwnProfile && (
                  <Link to={createPageUrl('Settings')}>
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Host Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {host?.bio && (
                  <p className="text-slate-600 text-sm">{host.bio}</p>
                )}

                {!host?.bio && (
                  <p className="text-slate-400 text-sm italic">No bio provided</p>
                )}

                <Separator />

                <div className="space-y-3">
                  {host?.organization && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{host.organization}</span>
                    </div>
                  )}

                  {host?.duty_station && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{host.duty_station}</span>
                    </div>
                  )}

                  {host?.staff_grade && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Grade {host.staff_grade}</span>
                    </div>
                  )}

                  {host?.created_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        Member since {format(new Date(host.created_date), 'MMMM yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="properties">
              <TabsList className="bg-white border border-slate-200 p-1 mb-6">
                <TabsTrigger value="properties" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Properties ({properties.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <Star className="w-4 h-4 mr-2" />
                  Reviews ({reviews.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Swap History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="properties">
                {propertiesLoading ? (
                  <div className="text-center py-12 text-slate-500">Loading properties...</div>
                ) : properties.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600">No active listings</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {properties.map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <PropertyCard property={property} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews">
                <ReviewList hostEmail={hostEmail} />
              </TabsContent>

              <TabsContent value="history">
                {completedSwaps.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowLeftRight className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600">No completed swaps yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {completedSwaps.map((swap, index) => (
                      <motion.div
                        key={swap.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{swap.property_title}</p>
                                  <p className="text-sm text-slate-500">
                                    {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <HostContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        host={host}
        currentUser={currentUser}
      />

      {/* Verification Dialog */}
      <VerificationRequiredDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        action="contact hosts"
      />
    </div>
  );
}