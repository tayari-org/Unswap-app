import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Bath, Users, MapPin, Heart, Shield, Wifi, Car, Star, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import VerificationRequiredDialog from '../verification/VerificationRequiredDialog';

const amenityIcons = {
  'Wi-Fi': Wifi,
  'Parking': Car,
  'Secure': Shield,
};

export default function PropertyCard({ property, onFavorite, isFavorite }) {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

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

    // Navigate to host profile
    window.location.href = createPageUrl('HostProfile') + `?email=${encodeURIComponent(property.owner_email)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      <Link to={createPageUrl('PropertyDetails') + `?id=${property.id}`}>
        <div className="relative h-56 overflow-hidden">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Points Badge */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <span className="font-bold text-slate-900">{property.smart_credit_value || 200}</span>
            <span className="text-slate-500 text-sm"> pts/night</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite?.(property.id);
            }}
            className="absolute top-4 left-4 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>

          {/* Badges */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {property.is_verified && (
              <Badge className="bg-emerald-500 text-white shadow-lg">
                <Shield className="w-3 h-3 mr-1" />
                Verified Property
              </Badge>
            )}
            {property.availability_type === 'long_term' && (
              <Badge className="bg-blue-500 text-white shadow-lg">Long-term</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {property.location}
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-slate-900">{averageRating}</span>
              <span className="text-xs text-slate-500">({reviews.length})</span>
            </div>
          )}
        </div>

        <Link to={createPageUrl('PropertyDetails') + `?id=${property.id}`}>
          <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-1">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 text-slate-600 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{property.bedrooms || 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            <span>{property.bathrooms || 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{property.max_guests || 2}</span>
          </div>
        </div>

        {property.nearest_duty_station && (
          <Badge variant="outline" className="text-slate-600 mb-3">
            Near {property.nearest_duty_station}
          </Badge>
        )}

        {property.mobility_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {property.mobility_tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs bg-slate-100">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Host Link */}
        {property.owner_email && (
          <button
            onClick={handleHostProfileClick}
            className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-sm text-slate-500 hover:text-amber-600 transition-colors w-full"
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
              {!currentUser || !isCurrentUserVerified ? (
                <Lock className="w-3 h-3 text-slate-400" />
              ) : (
                <Users className="w-3 h-3" />
              )}
            </div>
            <span>View host profile</span>
          </button>
        )}
      </div>

      {/* Verification Dialog */}
      <VerificationRequiredDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        action="view host profiles"
      />
    </motion.div>
  );
}