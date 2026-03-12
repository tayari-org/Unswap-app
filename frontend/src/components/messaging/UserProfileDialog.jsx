import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  User, MapPin, Building2, Mail, Shield, Star, Home,
  CheckCircle, Calendar, ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UserProfileDialog({ open, onOpenChange, userEmail }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user-profile', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;

      try {
        // First, try to fetch from User entity directly
        const allUsers = await api.entities.User.list();
        const foundUser = allUsers.find(u => u.email === userEmail);

        if (foundUser) {
          return foundUser;
        }

        // If not found in users, try to get info from their messages
        const messages = await api.entities.Message.filter({
          $or: [{ sender_email: userEmail }, { recipient_email: userEmail }]
        }, '-created_date', 1);

        if (messages.length > 0) {
          const msg = messages[0];
          const isUser = msg.sender_email === userEmail;
          return {
            email: userEmail,
            username: isUser ? msg.sender_name?.split('@')[0] : userEmail.split('@')[0],
            full_name: isUser ? msg.sender_name : userEmail.split('@')[0],
            avatar_url: null,
            created_date: msg.created_date,
          };
        }

        // Final fallback
        return {
          email: userEmail,
          username: userEmail.split('@')[0],
          full_name: userEmail.split('@')[0],
          avatar_url: null,
        };
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Return basic info on error
        return {
          email: userEmail,
          username: userEmail.split('@')[0],
          full_name: userEmail.split('@')[0],
          avatar_url: null,
        };
      }
    },
    enabled: open && !!userEmail,
    retry: 2,
  });

  const { data: verification } = useQuery({
    queryKey: ['user-verification', userEmail],
    queryFn: async () => {
      const verifications = await api.entities.Verification.filter({
        user_email: userEmail,
        status: 'approved'
      });
      return verifications[0];
    },
    enabled: open && !!userEmail,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['user-properties', userEmail],
    queryFn: () => api.entities.Property.filter({
      owner_email: userEmail,
      status: 'active'
    }),
    enabled: open && !!userEmail,
  });

  const { data: completedSwaps = [] } = useQuery({
    queryKey: ['user-swaps', userEmail],
    queryFn: () => api.entities.SwapRequest.filter({
      $or: [
        { requester_email: userEmail, status: 'completed' },
        { host_email: userEmail, status: 'completed' }
      ]
    }),
    enabled: open && !!userEmail,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', userEmail],
    queryFn: () => api.entities.Review.filter({
      host_email: userEmail,
      status: 'approved'
    }),
    enabled: open && !!userEmail,
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-y-auto rounded-none border-0 shadow-2xl">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-unswap-blue-deep/20" />
            <p className="text-unswap-blue-deep font-bold tracking-[0.4em] uppercase text-[9px]">Verification Status</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            User <span className="italic font-serif">Profile</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            Verified identity and status of the community member.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading profile...</div>
        ) : !user ? (
          <div className="py-12 text-center text-slate-500">User not found</div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-8 p-10 bg-white">
              <div className="w-24 h-24 rounded-none bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm relative group">
                <div className="absolute inset-0 bg-unswap-blue-deep/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{user.username || user.full_name}</h3>
                  {user.verification_status === 'verified' && (
                    <Badge className="bg-emerald-500 text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                {user.location && (
                  <p className="text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {user.location}
                  </p>
                )}
              </div>
            </div>

            {/* Organization Info */}
            {user.organization && (
              <Card className="p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-900">Organization</span>
                </div>
                <p className="text-slate-700">{user.organization}</p>
                {user.duty_station && (
                  <p className="text-sm text-slate-600 mt-1">Duty Station: {user.duty_station}</p>
                )}
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-0 border-y border-slate-100">
              <div className="p-8 text-center border-r border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-extralight text-slate-900 tracking-tighter mb-1">{properties.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Home className="w-3 h-3 text-unswap-blue-deep/30" />
                  Properties
                </div>
              </div>
              <div className="p-8 text-center border-r border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-extralight text-slate-900 tracking-tighter mb-1">{completedSwaps.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <ArrowLeftRight className="w-3 h-3 text-unswap-blue-deep/30" />
                  Swaps
                </div>
              </div>
              <div className="p-8 text-center hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-extralight text-slate-900 tracking-tighter mb-1">
                  {averageRating || 'N/A'}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Star className="w-3 h-3 text-unswap-blue-deep/30" />
                  Rating
                </div>
              </div>
            </div>

            {/* Verification Details */}
            {verification && (
              <Card className="p-4 border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Verification Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Type:</span>
                    <span className="text-slate-900 font-medium">{verification.verification_type}</span>
                  </div>
                  {verification.organization && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Organization:</span>
                      <span className="text-slate-900 font-medium">{verification.organization}</span>
                    </div>
                  )}
                  {verification.reviewed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Verified:</span>
                      <span className="text-slate-900 font-medium">
                        {format(new Date(verification.reviewed_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Active Properties */}
            {properties.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Active Properties
                </h4>
                <div className="space-y-3">
                  {properties.slice(0, 3).map((property) => (
                    <Link
                      key={property.id}
                      to={createPageUrl('PropertyDetails') + `?id=${property.id}`}
                      onClick={() => onOpenChange(false)}
                    >
                      <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex gap-3">
                          {property.images?.[0] && (
                            <img
                              src={property.images[0]}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{property.title}</p>
                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {property.location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {property.nightly_points || 200} pts/night
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Member Since */}
            {user.created_date && (
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since {format(new Date(user.created_date), 'MMMM yyyy')}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Link to={createPageUrl('GuestProfile') + `?email=${userEmail}`} className="flex-1">
                <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  View Full Profile
                </Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}