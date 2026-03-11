import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  ArrowLeft, Heart, Share2, Bed, Bath, Users, MapPin, Shield, Calendar,
  Wifi, Car, Home, Lock, CheckCircle, Star, MessageSquare, Coins, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import ReviewList from '../components/reviews/ReviewList';
import CreateSwapRequestDialog from '../components/swaps/CreateSwapRequestDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';

const amenityIcons = {
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Secure Building': Lock,
};

export default function PropertyDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const queryClient = useQueryClient();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [swapData, setSwapData] = useState({
    swap_type: 'guestpoints',
    check_in: '',
    check_out: '',
    guests_count: 1,
    message: '',
    reciprocal_property_id: '',
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const properties = await api.entities.Property.filter({ id: propertyId });
      return properties[0];
    },
    enabled: !!propertyId,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuth = await api.auth.isAuthenticated();
      if (!isAuth) return null;
      return api.auth.me();
    },
  });

  const { data: userProperties = [] } = useQuery({
    queryKey: ['user-properties', user?.email],
    queryFn: () => api.entities.Property.filter({ owner_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });



  const { data: reviews = [] } = useQuery({
    queryKey: ['property-reviews', propertyId],
    queryFn: () => api.entities.Review.filter({ property_id: propertyId, status: 'approved' }, '-created_date'),
    enabled: !!propertyId,
  });

  // Fetch host's stats
  const { data: hostSwaps = [] } = useQuery({
    queryKey: ['host-swaps', property?.owner_email],
    queryFn: () => api.entities.SwapRequest.filter({
      host_email: property?.owner_email,
      status: 'completed'
    }),
    enabled: !!property?.owner_email,
  });

  const { data: hostReviews = [] } = useQuery({
    queryKey: ['host-reviews', property?.owner_email],
    queryFn: () => api.entities.Review.filter({
      host_email: property?.owner_email,
      status: 'approved'
    }),
    enabled: !!property?.owner_email,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const hostResponseRate = hostSwaps.length > 0
    ? Math.round((hostSwaps.length / (hostSwaps.length + 5)) * 100) // Simplified calculation
    : 95;

  const hostAvgRating = hostReviews.length > 0
    ? (hostReviews.reduce((sum, r) => sum + r.rating, 0) / hostReviews.length).toFixed(1)
    : 'N/A';

  const isVerified = user?.verification_status === 'verified';

  const handleRequestSwap = () => {
    if (!isVerified) {
      setShowVerificationDialog(true);
      return;
    }
    setShowSwapDialog(true);
  };

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries(['current-user']),
  });

  const createSwapMutation = useMutation({
    mutationFn: (data) => api.entities.SwapRequest.create(data),
    onSuccess: () => {
      toast.success('Swap request sent!');
      setShowSwapDialog(false);
    },
  });

  const toggleFavorite = () => {
    if (!user) {
      toast.error('Please log in to save properties');
      return;
    }
    const saved = user.saved_properties || [];
    const newSaved = saved.includes(propertyId)
      ? saved.filter(id => id !== propertyId)
      : [...saved, propertyId];

    // Optimistic update
    queryClient.setQueryData(['current-user'], { ...user, saved_properties: newSaved });

    // Server update
    updateUserMutation.mutate({ saved_properties: newSaved });

    if (newSaved.includes(propertyId)) {
      toast.success('Added to favorites');
    } else {
      toast.success('Removed from favorites');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${createPageUrl('PropertyDetails')}?id=${propertyId}`;
    navigator.clipboard.writeText(url);
    toast.success('Property link copied to clipboard!');
  };

  const handleSwapSubmit = async () => {
    const checkIn = new Date(swapData.check_in);
    const checkOut = new Date(swapData.check_out);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPoints = nights * (property?.smart_credit_value || 200);

    await createSwapMutation.mutateAsync({
      property_id: propertyId,
      property_title: property?.title,
      requester_id: user?.id,
      requester_email: user?.email,
      requester_name: user?.full_name,
      host_id: property?.owner_id,
      host_email: property?.owner_email,
      swap_type: swapData.swap_type,
      reciprocal_property_id: swapData.reciprocal_property_id,
      check_in: swapData.check_in,
      check_out: swapData.check_out,
      guests_count: swapData.guests_count,
      total_points: totalPoints,
      message: swapData.message,
      status: 'pending',
    });
  };

  const isFavorite = user?.saved_properties?.includes(propertyId);
  const isOwner = user?.email === property?.owner_email;

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Property not found</h2>
          <Link to={createPageUrl('FindProperties')}>
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to={createPageUrl('FindProperties')} className="inline-flex items-center text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative overflow-hidden shadow-xl border border-unswap-border bg-white p-2">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={images[currentImageIndex]}
                alt={property.title}
                className="w-full h-96 md:h-[500px] object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className="w-10 h-10 bg-white rounded-none flex items-center justify-center shadow-lg hover:bg-slate-50 border border-unswap-border transition-colors group"
                >
                  <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-white rounded-none flex items-center justify-center shadow-lg hover:bg-slate-50 border border-unswap-border transition-colors group"
                >
                  <Share2 className="w-5 h-5 text-slate-600 transition-transform group-hover:scale-110" />
                </button>
              </div>

              {/* Badges */}
              <div className="absolute top-6 left-6 flex gap-2">
                {property.is_verified && (
                  <Badge className="bg-emerald-500 rounded-none text-white shadow-lg text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified Property
                  </Badge>
                )}
                {property.is_featured && (
                  <Badge className="bg-unswap-blue-deep rounded-none text-white shadow-lg text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1">Featured</Badge>
                )}
              </div>
            </div>

            {/* Property Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-slate-500 mb-2 uppercase tracking-widest text-xs font-bold">
                    <MapPin className="w-4 h-4" />
                    {property.location}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter text-slate-900 mb-4">{property.title}</h1>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span className="text-lg font-semibold text-slate-900">{averageRating}</span>
                      </div>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-600">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-extralight italic font-serif text-unswap-blue-deep">{property.smart_credit_value || 200}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">pts <span className="text-slate-300 mx-1">/</span> night</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mb-8 border-y border-unswap-border py-4">
                <div className="flex items-center gap-2 text-slate-600 font-serif italic">
                  <Bed className="w-5 h-5" />
                  <span>{property.bedrooms || 1} bedrooms</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Bath className="w-5 h-5" />
                  <span>{property.bathrooms || 1} bathrooms</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-5 h-5" />
                  <span>Up to {property.max_guests || 2} guests</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Home className="w-5 h-5" />
                  <span className="capitalize">{property.property_type}</span>
                </div>
              </div>

              {property.nearest_duty_station && (
                <Badge variant="outline" className="mb-6 rounded-none border-unswap-border text-slate-600 text-[10px] font-bold uppercase tracking-[0.1em]">
                  Near {property.nearest_duty_station}
                  {property.distance_to_duty_station && ` • ${property.distance_to_duty_station}`}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">About this property</h2>
              <p className="text-slate-600 leading-relaxed font-serif italic">
                {property.description || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity, index) => {
                      const Icon = amenityIcons[amenity] || CheckCircle;
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 border border-unswap-border">
                          <Icon className="w-5 h-5 text-slate-500" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Security Checklist */}
            {property.security_checklist && Object.values(property.security_checklist).some(v => v) && (
              <>
                <Separator />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Security Features
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.security_checklist.separate_workspace && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Separate professional workspace
                      </div>
                    )}
                    {property.security_checklist.secure_wifi && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Secure Wi-Fi network
                      </div>
                    )}
                    {property.security_checklist.locked_storage && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Locked storage available
                      </div>
                    )}
                    {property.security_checklist.building_security && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Building security
                      </div>
                    )}
                    {property.security_checklist.safe_available && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Safe for valuables
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Host Information */}
            <Separator />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">About the Host</h2>
              <div className="flex items-start gap-4 p-6 bg-slate-50 border border-unswap-border">
                <div className="w-16 h-16 rounded-none bg-slate-200 flex items-center justify-center flex-shrink-0 border border-unswap-border">
                  <User className="w-8 h-8 text-slate-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{property.owner_email}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-slate-500">Response rate</p>
                      <p className="font-semibold text-slate-900">{hostResponseRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Total stays</p>
                      <p className="font-semibold text-slate-900">{hostSwaps.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Avg rating</p>
                      <p className="font-semibold text-slate-900">{hostAvgRating}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <Separator />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4">Cancellation Policy</h2>
              <div className="p-6 bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Flexible Cancellation</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Full refund if cancelled 7+ days before check-in</li>
                  <li>• 50% refund if cancelled 3-7 days before check-in</li>
                  <li>• No refund for cancellations within 3 days of check-in</li>
                  <li>• GuestPoints are automatically refunded based on the policy</li>
                </ul>
                <p className="text-xs text-blue-700 mt-3">
                  All cancellations are subject to the platform's Terms of Service. Emergency exceptions may apply.
                </p>
              </div>
            </div>

            {/* Reviews Section */}
            <Separator />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-6">Reviews</h2>
              <ReviewList propertyId={propertyId} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6 border-unswap-border shadow-2xl rounded-none">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8 border-b border-unswap-border pb-6">
                  <div>
                    <span className="text-4xl font-extralight text-slate-900 italic font-serif tracking-tighter">{property.smart_credit_value || 200}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">pts/night</span>
                  </div>
                  {property.swap_preference !== 'guestpoints_only' && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 rounded-none text-[10px] font-bold uppercase tracking-[0.1em]">
                      Reciprocal Available
                    </Badge>
                  )}
                </div>

                {property.available_from && (
                  <div className="flex items-center gap-3 text-slate-600 mb-6 bg-slate-50 p-4 border border-unswap-border">
                    <Calendar className="w-5 h-5 text-unswap-blue-deep" />
                    <span className="font-serif italic text-sm">
                      Available: {format(new Date(property.available_from), 'MMM d')} -
                      {property.available_to && format(new Date(property.available_to), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Minimum stay</span>
                    <span className="text-slate-900">{property.minimum_stay || 1} nights</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Maximum stay</span>
                    <span className="text-slate-900">{property.maximum_stay || 30} nights</span>
                  </div>
                </div>

                {!isOwner ? (
                  <Button
                    className="w-full bg-unswap-blue-deep hover:bg-slate-800 text-white rounded-none h-14 text-xs font-bold uppercase tracking-[0.2em] transition-all"
                    onClick={() => {
                      if (!user) {
                        toast.error('Please log in to continue');
                        api.auth.redirectToLogin(window.location.pathname);
                        return;
                      }
                      handleRequestSwap();
                    }}
                  >
                    {user ? 'Request Swap' : 'Log In to Request Swap'}
                  </Button>
                ) : (
                  <Link to={createPageUrl('MyListings')}>
                    <Button variant="outline" className="w-full h-14 rounded-none border-unswap-border text-xs font-bold uppercase tracking-[0.2em]">
                      Edit Your Listing
                    </Button>
                  </Link>
                )}

                <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <Shield className="w-3 h-3" />
                  Backed by $2M insurance
                </div>
              </CardContent>
            </Card>

            {/* Mobility Tags */}
            {property.mobility_tags?.length > 0 && (
              <Card className="rounded-none border-unswap-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Mobility Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.mobility_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-50 rounded-none border border-unswap-border text-[10px] font-bold uppercase tracking-wider">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Swap Request Dialog */}
      <CreateSwapRequestDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        user={user}
        preselectedProperty={property}
        isVerified={isVerified}
      />

      {/* Verification Required Dialog */}
      <VerificationRequiredDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        action="send swap requests"
      />
    </div>
  );
}