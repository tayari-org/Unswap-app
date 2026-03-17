import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeftRight, Coins, Loader2, Home, Users, HelpCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { notifySwapRequest } from '../notifications/notificationHelpers';
import VerificationRequiredDialog from '../verification/VerificationRequiredDialog';

export default function CreateSwapRequestDialog({ open, onOpenChange, user, preselectedProperty, isVerified = false }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(preselectedProperty?.id || '');
  const [swapType, setSwapType] = useState('guestpoints');
  const [reciprocalPropertyId, setReciprocalPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guestsCount, setGuestsCount] = useState(1);
  const [message, setMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  // Check login status
  React.useEffect(() => {
    if (open && !user) {
      toast.error('Please log in to continue');
      api.auth.redirectToLogin(window.location.pathname);
      onOpenChange(false);
    }
  }, [open, user, onOpenChange]);



  const { data: allProperties = [] } = useQuery({
    queryKey: ['all-properties-active'],
    queryFn: () => api.entities.Property.filter({ status: 'active' }, '-created_date', 100),
  });

  const { data: myProperties = [] } = useQuery({
    queryKey: ['my-properties', user?.email],
    queryFn: () => api.entities.Property.filter({ owner_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const availableProperties = allProperties.filter(p => p.owner_email !== user?.email);
  const selectedProp = availableProperties.find(p => p.id === selectedProperty);

  // Determine available swap types based on property preference
  const availableSwapTypes = selectedProp?.swap_preference || 'both';

  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 0;
  const basePoints = nights * (selectedProp?.nightly_points || 200);
  const totalPoints = swapType === 'guestpoints' ? basePoints : 0;

  const createSwapMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user has enough points for guestpoints swap
      if (data.swap_type === 'guestpoints') {
        const userPoints = user?.guest_points ?? 500;
        if (userPoints < data.total_points) {
          throw new Error('Insufficient GuestPoints');
        }
      }

      // Remove message from swapData before sending to API
      const { message, ...swapDataCopy } = data;
      const result = await api.entities.SwapRequest.create(swapDataCopy);

      // Create initial message in conversation
      if (data.message && data.message.trim()) {
        const conversationId = `swap_${result.id}`;
        await api.entities.Message.create({
          conversation_id: conversationId,
          swap_request_id: result.id,
          sender_email: user?.email,
          sender_name: user?.full_name || user?.email,
          recipient_email: data.host_email,
          content: data.message,
          message_type: 'text',
          is_read: false
        });
      }

      // Send notification to host
      await notifySwapRequest({
        hostEmail: data.host_email,
        requesterName: user?.full_name || user?.email,
        propertyTitle: data.property_title,
        swapRequestId: result.id
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('Swap request sent successfully!');
      onOpenChange(false);
      resetForm();
      navigate(createPageUrl('MySwaps') + '?tab=outgoing');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create swap request');
    }
  });

  const resetForm = () => {
    setSelectedProperty(preselectedProperty?.id || '');
    setSwapType('guestpoints');
    setReciprocalPropertyId('');
    setCheckIn(null);
    setCheckOut(null);
    setGuestsCount(1);
    setMessage('');
    setAgreedToTerms(false);
  };

  const handleSubmit = () => {
    if (!selectedProperty) {
      toast.error('Please select a property');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (swapType === 'reciprocal' && !reciprocalPropertyId) {
      toast.error('Please select your property for reciprocal swap');
      return;
    }

    // Check if user has enough points for guestpoints swap
    if (swapType === 'guestpoints') {
      const userPoints = user?.guest_points ?? 500;
      if (userPoints < totalPoints) {
        toast.error(`Insufficient GuestPoints. You need ${totalPoints} points but only have ${userPoints}.`);
        return;
      }
    }

    const property = availableProperties.find(p => p.id === selectedProperty);

    const swapRequestPayload = {
      property_id: selectedProperty,
      property_title: property?.title,
      requester_email: user?.email,
      host_email: property?.owner_email,
      swap_type: swapType,
      requester_property_id: swapType === 'reciprocal' ? reciprocalPropertyId : null,
      check_in: checkIn ? checkIn.toISOString() : null,
      check_out: checkOut ? checkOut.toISOString() : null,
      duration_nights: nights,
      party_size: guestsCount,
      total_points: swapType === 'guestpoints' ? totalPoints : 0,
      status: 'pending',
      guest_agreed_to_terms: true,
      guest_agreed_at: new Date().toISOString()
    };

    createSwapMutation.mutate({
      ...swapRequestPayload,
      message, // Passed separately for mutationFn
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-none border-0 shadow-[0_100px_150px_-30px_rgba(0,0,0,0.2)] p-0">
        <DialogHeader className="p-12 border-b bg-stone-50/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-unswap-blue-deep" />
            <p className="text-unswap-blue-deep font-bold tracking-[0.5em] uppercase text-[10px]">Swap Request</p>
          </div>
          <DialogTitle className="text-5xl font-extralight text-slate-900 tracking-tighter leading-none mb-6">
            Initiate <span className="italic font-serif">Swap Request.</span>
          </DialogTitle>
          <p className="text-[13px] text-slate-500 font-light max-w-xl leading-relaxed">
            Send a swap request to the host. You can choose to use GuestPoints or a reciprocal swap if both of you have properties listed.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-slate-100">
          {/* LEFT: Parameters & Selection */}
          <div className="p-12 space-y-12 border-r border-slate-100 bg-white">
            {/* Property Selection */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Select Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="mt-1 h-14 rounded-none border-slate-200 bg-slate-50/50 focus:ring-0 focus:border-slate-400">
                  <SelectValue placeholder="Choose a property to swap with" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-200 shadow-2xl">
                  {availableProperties.map(property => (
                    <SelectItem key={property.id} value={property.id} className="py-3 rounded-none">
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">{property.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">— {property.location}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Select Dates</Label>
              <div className="border border-slate-100 bg-stone-50/30 shadow-inner overflow-hidden rounded-none p-6 flex justify-center">
                <Calendar
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(range) => {
                    setCheckIn(range?.from);
                    setCheckOut(range?.to);
                  }}
                  disabled={(date) => date < new Date()}
                  className="rounded-none border-0 p-0"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Protocol Details */}
          <div className="p-12 space-y-12 bg-slate-50/30">
            {/* Swap Type */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Swap Type</Label>
              <Select value={swapType} onValueChange={setSwapType}>
                <SelectTrigger className="mt-1 h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400">
                  <SelectValue placeholder="Select swap type" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-200 shadow-2xl">
                  {(availableSwapTypes === 'guestpoints_only' || availableSwapTypes === 'both') && (
                    <SelectItem value="guestpoints" className="py-3 rounded-none">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-sm font-medium">GuestPoints Distribution</span>
                      </div>
                    </SelectItem>
                  )}
                  {myProperties.length > 0 && (availableSwapTypes === 'reciprocal_only' || availableSwapTypes === 'both') && (
                    <SelectItem value="reciprocal" className="py-3 rounded-none">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-unswap-blue-deep" />
                        <span className="text-sm font-medium">Reciprocal Swap</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reciprocal Property Selection */}
            {swapType === 'reciprocal' && myProperties.length > 0 && (
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Select Your Property</Label>
                <Select value={reciprocalPropertyId} onValueChange={setReciprocalPropertyId}>
                  <SelectTrigger className="mt-1 h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400">
                    <SelectValue placeholder="Select your property" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-slate-200 shadow-2xl">
                    {myProperties.map(property => (
                      <SelectItem key={property.id} value={property.id} className="py-3 rounded-none">
                        <span className="text-sm font-medium">{property.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Guests */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Number of Guests</Label>
              <Select value={guestsCount.toString()} onValueChange={(val) => setGuestsCount(parseInt(val))}>
                <SelectTrigger className="mt-1 h-14 rounded-none border-slate-200 bg-white focus:ring-0 focus:border-slate-400">
                  <SelectValue placeholder="1 guest" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-200 shadow-2xl">
                  {Array.from({ length: selectedProp?.max_guests || 10 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()} className="py-3 rounded-none">
                      {num} {num === 1 ? 'guest' : 'guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Message to Host</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain the professional context of your stay..."
                rows={4}
                className="mt-1 rounded-none border-slate-200 bg-white p-4 focus:ring-0 focus:border-slate-400 resize-none"
              />
            </div>

            {/* Reciprocal Swap Info */}
            {checkIn && checkOut && swapType === 'reciprocal' && (
              <div className="border border-blue-100 p-6 bg-blue-50/50 rounded-none">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900">Swap Details</h4>
                </div>
                <p className="text-sm text-blue-800/80 font-light leading-relaxed">
                  Reciprocal swap selected. No GuestPoints will be deducted.
                </p>
              </div>
            )}

            {/* Points Breakdown */}
            {checkIn && checkOut && selectedProp && swapType === 'guestpoints' && (
              <div className="border border-slate-100 p-6 bg-white shadow-sm rounded-none">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-amber-500/30" />
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Points Breakdown</h4>
                  </div>
                  <HelpCircle className="w-4 h-4 text-slate-300" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{selectedProp.nightly_points || 200} PTS × {nights} nights</span>
                    <span className="text-2xl font-extralight tracking-tighter text-slate-900">{totalPoints} <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">pts</span></span>
                  </div>
                </div>

                {/* Balance Section */}
                <div className={`mt-8 pt-8 border-t border-slate-50 ${(user?.guest_points ?? 500) < totalPoints ? 'bg-red-50/50 -mx-6 px-6 pb-4' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Balance</span>
                    <span className={`text-sm font-semibold ${(user?.guest_points ?? 500) < totalPoints ? 'text-red-600' : 'text-slate-900'}`}>
                      {user?.guest_points ?? 500} PTS
                    </span>
                  </div>
                  {(user?.guest_points ?? 500) < totalPoints && (
                    <div className="mt-4 p-4 border border-red-100 bg-white flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-[11px] text-red-600 font-medium">
                        Insufficient balance. You need {totalPoints - (user?.guest_points ?? 500)} more points.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms Agreement */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="request_terms" 
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="rounded-none border-slate-300 data-[state=checked]:bg-unswap-blue-deep data-[state=checked]:border-unswap-blue-deep"
                />
                <label 
                  htmlFor="request_terms" 
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] cursor-pointer"
                >
                  I agree to the <span className="text-unswap-blue-deep underline underline-offset-2">UNswap Terms & Conditions</span> and house rules
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 flex justify-between items-center bg-slate-50/50 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-none text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors h-14"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!agreedToTerms || createSwapMutation.isPending || (swapType === 'guestpoints' && (user?.guest_points ?? 500) < totalPoints) || !checkIn || !checkOut}
            className={`rounded-none h-16 px-16 text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl ${!agreedToTerms || createSwapMutation.isPending || (swapType === 'guestpoints' && (user?.guest_points ?? 500) < totalPoints) || !checkIn || !checkOut
              ? 'bg-slate-200 text-slate-400'
              : 'bg-unswap-blue-deep text-white hover:bg-slate-900 active:scale-95'
              }`}
          >
            {createSwapMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-3 animate-spin" />
                Processing...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}