import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, Shield, Star, MapPin, Building2, Briefcase, Calendar,
  MessageSquare, Home, ArrowLeftRight, CheckCircle, User, ChevronRight, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import PropertyCard from '../components/properties/PropertyCard';
import HostContactDialog from '../components/host/HostContactDialog';
import ReviewList from '../components/reviews/ReviewList';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';

export default function HostProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostEmail = urlParams.get('email');
  const [activeTab, setActiveTab] = useState('overview');
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
    queryFn: async () => {
      return await api.entities.Review.filter({
        target_email: hostEmail,
        status: 'approved'
      }, '-created_date');
    },
    enabled: !!hostEmail,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const isOwnProfile = currentUser?.email === hostEmail;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Eye, desc: 'Host info & stats' },
    { id: 'properties', label: 'Properties', icon: Home, desc: `${properties.length} active listings` },
    { id: 'reviews', label: 'Reviews', icon: Star, desc: `${reviews.length} reviews` },
    { id: 'history', label: 'Swap History', icon: ArrowLeftRight, desc: 'Completed swaps' },
  ];

  if (!hostEmail) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-extralight tracking-tighter text-slate-900 mb-2">Host not found</h2>
          <Link to={createPageUrl('FindProperties')}>
            <Button className="rounded-none bg-unswap-blue-deep text-[10px] uppercase font-bold tracking-[0.2em]">Browse Properties</Button>
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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('FindProperties')} className="inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Back to Properties</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-bold text-slate-900">{host?.username || host?.full_name || 'Host Profile'}</h1>
            {isVerified && (
              <Badge className="bg-emerald-500 text-white rounded-none text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          {!isOwnProfile && currentUser && isCurrentUserVerified && (
            <Button
              size="sm"
              className="bg-unswap-blue-deep hover:bg-slate-800 rounded-none text-[10px] uppercase font-bold tracking-[0.2em]"
              onClick={() => setShowContactDialog(true)}
            >
              <MessageSquare className="w-3 h-3 mr-2" />
              Contact Host
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* SIDEBAR NAVIGATION */}
          <aside className="w-full md:w-52 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex items-start gap-4 p-4 transition-all text-left border-l-2 ${activeTab === item.id
                    ? 'bg-slate-50 border-unswap-blue-deep text-unswap-blue-deep shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                    }`}
                >
                  <div className={`p-2 rounded-none transition-all ${activeTab === item.id ? 'bg-unswap-blue-deep text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                    <span className="text-[9px] font-medium opacity-50 uppercase tracking-widest">{item.desc}</span>
                  </div>
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0">
            <Tabs value={activeTab} className="mt-0">

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
                <div>
                  <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Overview</h2>
                </div>

                {/* Profile Card */}
                <Card className="rounded-none border-unswap-border shadow-2xl overflow-hidden">
                  <div className="h-28 bg-gradient-to-r from-unswap-blue-deep to-slate-700 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent)]" />
                  </div>
                  <CardContent className="relative pb-8 px-6">
                    <div className="relative -top-12 mb-[-32px] flex flex-col sm:flex-row items-end gap-4">
                      <div className="w-24 h-24 rounded-none bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                        {host?.avatar_url ? (
                          <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <User className="w-10 h-10 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-extralight tracking-tighter text-slate-900">
                          {host?.username || host?.full_name}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                          {host?.organization || 'UN Staff Member'}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="text-xl font-serif italic font-extralight text-slate-900">{averageRating}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-6 py-6 mt-4 border-t border-unswap-border">
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{properties.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Listings</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{host?.swaps_completed || 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Swaps</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{completedSwaps.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Completed</p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3 mt-2">
                      {!isOwnProfile && currentUser && isCurrentUserVerified && (
                        <Button
                          className="bg-unswap-blue-deep hover:bg-slate-800 rounded-none h-12 text-[10px] uppercase font-bold tracking-[0.2em] flex-1"
                          onClick={() => setShowContactDialog(true)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Host
                        </Button>
                      )}
                      {isOwnProfile && (
                        <Link to={createPageUrl('Settings')} className="flex-1">
                          <Button variant="outline" className="w-full rounded-none border-unswap-border h-12 text-[10px] uppercase font-bold tracking-[0.2em]">
                            Edit Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* About Section */}
                <Card className="rounded-none border-unswap-border">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {host?.bio && (
                      <p className="text-slate-600 text-sm font-serif italic">{host.bio}</p>
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
              </TabsContent>

              {/* PROPERTIES TAB */}
              <TabsContent value="properties" className="m-0 focus-visible:outline-none space-y-6">
                <div>
                  <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Properties</h2>
                </div>
                {propertiesLoading ? (
                  <div className="text-center py-12 text-slate-500">Loading properties...</div>
                ) : properties.length === 0 ? (
                  <Card className="rounded-none border-unswap-border">
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-none border border-unswap-border flex items-center justify-center mx-auto mb-4">
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

              {/* REVIEWS TAB */}
              <TabsContent value="reviews" className="m-0 focus-visible:outline-none space-y-6">
                <div>
                  <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Reviews</h2>
                </div>
                <ReviewList hostEmail={hostEmail} />
              </TabsContent>

              {/* SWAP HISTORY TAB */}
              <TabsContent value="history" className="m-0 focus-visible:outline-none space-y-6">
                <div>
                  <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Swap History</h2>
                </div>
                {completedSwaps.length === 0 ? (
                  <Card className="rounded-none border-unswap-border">
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-none border border-unswap-border flex items-center justify-center mx-auto mb-4">
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
                        <Card className="rounded-none border-unswap-border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 rounded-none border border-emerald-200 flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{swap.property_title}</p>
                                  <p className="text-xs text-slate-500 font-serif italic">
                                    {format(new Date(swap.check_in), 'MMM d')} - {format(new Date(swap.check_out), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-emerald-100 text-emerald-700 rounded-none text-[10px] font-bold uppercase tracking-[0.1em]">Completed</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

            </Tabs>
          </main>
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