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
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex w-60 flex-col bg-unswap-blue-deep border-r border-[#001733] shadow-2xl z-20">
        {/* Sidebar Header / Brand */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-bold text-white tracking-tight font-display">{host?.username || 'Host Profile'}</h1>
          {isVerified && (
            <Badge variant="outline" className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 w-fit rounded-full text-[9px] border-emerald-400/50 bg-emerald-400/20 text-emerald-400`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400`} />
              VERIFIED HOST
            </Badge>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="px-3 pt-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Profile</span>
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
              </button>
            ))}
          </div>

          {/* Contact Host Button */}
          {!isOwnProfile && currentUser && isCurrentUserVerified && (
            <div className="px-3 mt-8">
              <Button
                className="w-full bg-white text-unswap-blue-deep hover:bg-stone-100 rounded-sm h-10 text-[10px] uppercase font-bold tracking-[0.2em]"
                onClick={() => setShowContactDialog(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Host
              </Button>
            </div>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-6 mt-auto border-t border-white/10 pt-4 space-y-2">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start text-white/50 hover:text-white hover:bg-white/5 transition-all font-semibold text-[11px] tracking-wide gap-2 h-9 rounded-sm">
             <Link to={createPageUrl('FindProperties')}><ArrowLeft className="w-3.5 h-3.5" /> Back to Properties</Link>
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER (shown only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-200 px-4 py-3 shadow-sm flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-unswap-blue-deep font-display">{host?.username || host?.full_name || 'Host Profile'}</h1>
          <Link to={createPageUrl('FindProperties')}>
            <Button variant="ghost" size="sm" className="text-stone-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              Back
            </Button>
          </Link>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar w-full">
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
            </button>
          ))}
          {!isOwnProfile && currentUser && isCurrentUserVerified && (
            <button
              onClick={() => setShowContactDialog(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-sm transition-all bg-emerald-500 text-white ml-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Contact
            </button>
          )}
        </div>
      </div>

       {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto lg:pt-0 pt-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
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
                      <div className="w-24 h-24 rounded-none bg-stone-200 overflow-hidden border-4 border-white shadow-lg">
                        {host?.avatar_url ? (
                          <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-stone-100">
                            <User className="w-10 h-10 text-stone-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-extralight tracking-tighter text-slate-900">
                          {host?.username || host?.full_name}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">
                          {host?.organization || 'UN Staff Member'}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="text-xl font-serif italic font-extralight text-slate-900">{averageRating}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-6 py-6 mt-4 border-t border-unswap-border">
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{properties.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">Listings</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{host?.swaps_completed || 0}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">Swaps</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extralight italic font-serif text-slate-900">{completedSwaps.length}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mt-1">Completed</p>
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
                      <p className="text-stone-400 text-sm italic">No bio provided</p>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      {host?.organization && (
                        <div className="flex items-center gap-3 text-sm">
                          <Building2 className="w-4 h-4 text-stone-400" />
                          <span className="text-slate-600">{host.organization}</span>
                        </div>
                      )}
                      {host?.duty_station && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-4 h-4 text-stone-400" />
                          <span className="text-slate-600">{host.duty_station}</span>
                        </div>
                      )}
                      {host?.staff_grade && (
                        <div className="flex items-center gap-3 text-sm">
                          <Briefcase className="w-4 h-4 text-stone-400" />
                          <span className="text-slate-600">Grade {host.staff_grade}</span>
                        </div>
                      )}
                      {host?.created_date && (
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-stone-400" />
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
                  <div className="text-center py-12 text-stone-500">Loading properties...</div>
                ) : properties.length === 0 ? (
                  <Card className="rounded-none border-unswap-border">
                    <CardContent className="text-center py-12">
                      <div className="w-16 h-16 bg-stone-50 rounded-none border border-unswap-border flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-stone-400" />
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
                      <div className="w-16 h-16 bg-stone-50 rounded-none border border-unswap-border flex items-center justify-center mx-auto mb-4">
                        <ArrowLeftRight className="w-8 h-8 text-stone-400" />
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
                                  <p className="text-xs text-stone-500 font-serif italic">
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
        </div>
      </main>

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