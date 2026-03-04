import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { notifySwapCounterProposal } from '../notifications/notificationHelpers';

export default function CounterProposalDialog({ open, onOpenChange, request, user }) {
  const queryClient = useQueryClient();
  const [checkIn, setCheckIn] = useState(request?.check_in ? new Date(request.check_in) : null);
  const [checkOut, setCheckOut] = useState(request?.check_out ? new Date(request.check_out) : null);
  const [message, setMessage] = useState('');

  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 0;

  const counterProposalMutation = useMutation({
    mutationFn: async () => {
      // Create a new message with counter-proposal details
      await api.entities.Message.create({
        conversation_id: `swap_${request.id}`,
        swap_request_id: request.id,
        sender_id: user?.id,
        sender_email: user?.email,
        sender_name: user?.full_name,
        recipient_id: request.requester_id,
        recipient_email: request.requester_email,
        content: `Counter-proposal: I'd like to suggest different dates.\n\nNew dates: ${format(checkIn, 'MMM d, yyyy')} - ${format(checkOut, 'MMM d, yyyy')} (${nights} nights)\n\n${message}`,
        message_type: 'system',
        is_read: false
      });

      // Update swap request with counter proposal
      await api.entities.SwapRequest.update(request.id, {
        counter_check_in: format(checkIn, 'yyyy-MM-dd'),
        counter_check_out: format(checkOut, 'yyyy-MM-dd'),
        counter_message: message,
        status: 'counter_proposed'
      });

      // Send notification to requester
      await notifySwapCounterProposal({
        requesterEmail: request.requester_email,
        hostName: user?.full_name || user?.email,
        propertyTitle: request.property_title,
        swapRequestId: request.id,
        newDates: `${format(checkIn, 'MMM d, yyyy')} - ${format(checkOut, 'MMM d, yyyy')}`
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('Counter-proposal sent!');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to send counter-proposal');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            Send Counter-Proposal
          </DialogTitle>
          <DialogDescription>
            Suggest alternative dates for this swap request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Request Info */}
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-2">Original request:</p>
              <p className="font-medium">
                {request?.check_in && format(new Date(request.check_in), 'MMM d')} - 
                {request?.check_out && format(new Date(request.check_out), 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-slate-500">From: {request?.requester_name}</p>
            </CardContent>
          </Card>

          {/* New Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>New Check-in</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-start text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {checkIn ? format(checkIn, 'MMM d') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>New Check-out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-start text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {checkOut ? format(checkOut, 'MMM d') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => date <= (checkIn || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {nights > 0 && (
            <p className="text-sm text-slate-600 text-center">
              {nights} nights proposed
            </p>
          )}

          {/* Message */}
          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain why you're suggesting different dates..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => counterProposalMutation.mutate()}
            disabled={counterProposalMutation.isPending || !checkIn || !checkOut}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {counterProposalMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Counter-Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}