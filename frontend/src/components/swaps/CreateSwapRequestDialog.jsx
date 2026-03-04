import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeftRight, Coins, Loader2, Home, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedProperty, setSelectedProperty] = useState(preselectedProperty?.id || '');
  const [swapType, setSwapType] = useState('guestpoints');
  const [reciprocalPropertyId, setReciprocalPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guestsCount, setGuestsCount] = useState(1);
  const [message, setMessage] = useState('');
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
  const basePoints = nights * (selectedProp?.smart_credit_value || 200);
  const totalPoints = swapType === 'guestpoints' ? basePoints : 0;

  const createSwapMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user has enough points for guestpoints swap
      if (data.swap_type === 'guestpoints') {
        const userPoints = user?.guest_points || 500;
        if (userPoints < data.total_points) {
          throw new Error('Insufficient GuestPoints');
        }
      }

      const result = await api.entities.SwapRequest.create(data);
      
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
      const userPoints = user?.guest_points || 500;
      if (userPoints < totalPoints) {
        toast.error(`Insufficient GuestPoints. You need ${totalPoints} points but only have ${userPoints}.`);
        return;
      }
    }

    const property = availableProperties.find(p => p.id === selectedProperty);

    createSwapMutation.mutate({
      property_id: selectedProperty,
      property_title: property?.title,
      requester_id: user?.id,
      requester_email: user?.email,
      requester_name: user?.full_name,
      host_id: property?.owner_id,
      host_email: property?.owner_email,
      swap_type: swapType,
      reciprocal_property_id: swapType === 'reciprocal' ? reciprocalPropertyId : null,
      check_in: format(checkIn, 'yyyy-MM-dd'),
      check_out: format(checkOut, 'yyyy-MM-dd'),
      guests_count: guestsCount,
      total_points: swapType === 'guestpoints' ? totalPoints : 0,
      message,
      status: 'pending'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request to Swap</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">Send a swap request to the host. You'll need to complete a video call before the swap is confirmed.</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 py-4">
          {/* LEFT: Calendar and Property Selection */}
          <div className="space-y-6">
            {/* Property Selection */}
            <div>
              <Label>Select Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a property to swap with" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        {property.title} - {property.location}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar */}
            <div>
              <Label className="block mb-3">Select Dates</Label>
              <div className="border rounded-lg p-4 bg-white">
                <Calendar
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(range) => {
                    setCheckIn(range?.from);
                    setCheckOut(range?.to);
                  }}
                  disabled={(date) => date < new Date()}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Form and Summary */}
          <div className="space-y-6">
            {/* Swap Type */}
            <div>
              <Label>Swap Type</Label>
              <Select value={swapType} onValueChange={setSwapType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select swap type" />
                </SelectTrigger>
                <SelectContent>
                  {(availableSwapTypes === 'guestpoints_only' || availableSwapTypes === 'both') && (
                    <SelectItem value="guestpoints">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-500" />
                        GuestPoints
                      </div>
                    </SelectItem>
                  )}
                  {myProperties.length > 0 && (availableSwapTypes === 'reciprocal_only' || availableSwapTypes === 'both') && (
                    <SelectItem value="reciprocal">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                        Reciprocal Exchange
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Reciprocal Property Selection */}
            {swapType === 'reciprocal' && myProperties.length > 0 && (
              <div>
                <Label>Your Property to Offer</Label>
                <Select value={reciprocalPropertyId} onValueChange={setReciprocalPropertyId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your property" />
                  </SelectTrigger>
                  <SelectContent>
                    {myProperties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Guests */}
            <div>
              <Label>Number of Guests</Label>
              <Select value={guestsCount.toString()} onValueChange={(val) => setGuestsCount(parseInt(val))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="1 guest" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: selectedProp?.max_guests || 10 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'guest' : 'guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div>
              <Label>Message to Host</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like to stay..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Reciprocal Swap Info */}
            {checkIn && checkOut && swapType === 'reciprocal' && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Reciprocal Exchange</h4>
                </div>
                <p className="text-sm text-blue-700">
                  No GuestPoints required. You're offering your property in exchange for staying at this property.
                </p>
              </div>
            )}

            {/* Points Breakdown */}
            {checkIn && checkOut && selectedProp && swapType === 'guestpoints' && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-slate-900">Points Breakdown</h4>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between text-lg font-bold">
                     <span>{selectedProp.smart_credit_value || 200} PTS × {nights} nights</span>
                     <span className="text-amber-600">{totalPoints} PTS</span>
                   </div>
                 </div>

                {/* Balance Section */}
                <div className={`mt-4 pt-4 border-t ${(user?.guest_points || 500) < totalPoints ? 'bg-red-50 p-3 rounded' : 'bg-green-50 p-3 rounded'}`}>
                  <div className="flex justify-between mb-2">
                    <span className={(user?.guest_points || 500) < totalPoints ? 'text-red-700 font-medium' : 'text-teal-700 font-medium'}>
                      Your balance
                    </span>
                    <span className={(user?.guest_points || 500) < totalPoints ? 'text-red-700 font-medium' : 'text-teal-700 font-medium'}>
                      {user?.guest_points || 500} PTS
                    </span>
                  </div>
                  {(user?.guest_points || 500) < totalPoints && (
                    <p className="text-red-700 text-sm font-medium">
                      You need {totalPoints - (user?.guest_points || 500)} more points for this swap
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createSwapMutation.isPending || (swapType === 'guestpoints' && (user?.guest_points || 500) < totalPoints) || !checkIn || !checkOut}
            className={createSwapMutation.isPending || (swapType === 'guestpoints' && (user?.guest_points || 500) < totalPoints) || !checkIn || !checkOut ? 'bg-slate-400 hover:bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'}
          >
            {createSwapMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}