import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Bath, Users, MapPin, Heart, Shield, Wifi, Car, Star, Lock, Share2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import VerificationRequiredDialog from '../verification/VerificationRequiredDialog';
import { toast } from 'sonner';

const amenityIcons = {
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Secure': Shield,
};

export default function PropertyCard({ property, variant = 'default', index = 0 }) {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const savedProperties = React.useMemo(() => {
    try {
      const sp = currentUser?.saved_properties;
      return Array.isArray(sp) ? sp : JSON.parse(sp || '[]');
    } catch { return []; }
  }, [currentUser?.saved_properties]);

  const isFavorite = savedProperties.includes(property.id);

  const favoriteMutation = useMutation({
    mutationFn: () => api.favorites.toggle(property.id),
    onMutate: async () => {
      // Optimistic update
      const newSaved = isFavorite
        ? savedProperties.filter(id => id !== property.id)
        : [...savedProperties, property.id];
      queryClient.setQueryData(['current-user'], prev => prev ? { ...prev, saved_properties: newSaved } : prev);
      return { previousSaved: savedProperties };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['current-user'], prev => prev ? { ...prev, saved_properties: data.saved_properties } : prev);
      queryClient.invalidateQueries(['property', property.id]);
      toast.success(data.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['current-user'], prev => prev ? { ...prev, saved_properties: context.previousSaved } : prev);
      }
      toast.error('Could not update favorites');
    },
  });

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please log in to save properties');
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${createPageUrl('PropertyDetails')}?id=${property.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, text: `Check out this property on UNswap`, url });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const isCurrentUserVerified = currentUser?.verification_status === 'verified' || currentUser?.role === 'admin';

  const { data: reviews = [] } = useQuery({
    queryKey: ['property-reviews', property.id],
    queryFn: () => api.entities.Review.filter({ property_id: property.id, status: 'approved' }),
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleHostProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      api.auth.redirectToLogin(window.location.pathname);
      return;
    }

    if (!isCurrentUserVerified) {
      setShowVerificationDialog(true);
      return;
    }

    window.location.href = createPageUrl('HostProfile') + `?email=${encodeURIComponent(property.owner_email)}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        className={`group bg-white rounded-none border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 w-full flex cursor-pointer relative ${variant === 'grid' ? 'flex-col' : 'flex-col md:flex-row'}`}
      >
        <Link 
          to={createPageUrl('PropertyDetails') + `?id=${property.id}`}
          className="absolute inset-0 z-[1]"
        />
        {/* Image Section */}
        <div className={`relative overflow-hidden shrink-0 w-full ${variant === 'grid' ? 'h-60' : 'md:w-64 lg:w-80 h-52 md:h-auto'}`}>
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500" />

          {/* Points Badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-none shadow-lg border border-slate-100 z-10 pointer-events-none">
            <span className="font-serif italic font-extralight text-lg text-slate-900">{property.nightly_points || 200}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">pts/night</span>
          </div>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-[10px] group-hover:translate-x-0">
            <button
              onClick={toggleFavorite}
              className="w-9 h-9 bg-white shadow-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 bg-white shadow-xl flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Verified badge overlay */}
          {property.is_verified && (
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <Badge className="rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-unswap-blue-deep/10 text-unswap-blue-deep border-unswap-blue-deep/20 border backdrop-blur-sm">
                Verified
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={`flex-1 flex flex-col ${variant === 'grid' ? 'p-6' : 'p-8 lg:p-10'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`space-y-3 flex-1 min-w-0 ${variant === 'grid' ? '' : 'pr-4'}`}>
              <div className="flex items-center gap-2 flex-wrap pointer-events-none">
                <Badge className="rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
                  {property.status || 'Active'}
                </Badge>
              </div>

              <div className="relative">
                <h3 className={`font-light text-slate-900 tracking-tight leading-tight group-hover:text-unswap-blue-deep transition-colors duration-300 ${variant === 'grid' ? 'text-xl' : 'text-2xl'}`}>
                  {property.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] truncate">{property.location || property.city}</p>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-100 flex-shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-900">{averageRating}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">({reviews.length})</span>
              </div>
            )}
          </div>

          {/* Room stats */}
          <div className="flex items-center gap-6 text-slate-500 text-xs mb-6 py-4 border-y border-slate-50 font-serif italic">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 opacity-40 text-unswap-blue-deep" />
              <span>{property.bedrooms || 1} Bed</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="w-4 h-4 opacity-40 text-unswap-blue-deep" />
              <span>{property.bathrooms || 1} Bath</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 opacity-40 text-unswap-blue-deep" />
              <span>{property.max_guests || 2} Guests</span>
            </div>
          </div>

          {/* Footer Stats — matching My Listings */}
          <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-slate-500">
                <Eye className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{property.views_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Heart className="w-3.5 h-3.5 text-rose-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{property.favorites_count || 0} favs</span>
              </div>
            </div>

            {/* Host link */}
            {property.owner_email && (
              <button
                onClick={handleHostProfileClick}
                className="relative z-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-unswap-blue-deep transition-colors"
              >
                <div className="w-7 h-7 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {!currentUser || !isCurrentUserVerified ? (
                    <Lock className="w-3 h-3 text-slate-300" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                </div>
                <span className="hidden sm:inline">View Host</span>
              </button>
            )}
          </div>
        </div>
    </motion.div>
      <VerificationRequiredDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        action="view host profiles"
      />
    </>
  );
}