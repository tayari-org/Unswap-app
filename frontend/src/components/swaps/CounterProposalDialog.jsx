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
      <DialogContent className="max-w-2xl rounded-none border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-violet-500/20" />
            <p className="text-violet-600 font-bold tracking-[0.4em] uppercase text-[9px]">Change Dates</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Suggest New <span className="italic font-serif">Dates.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            Suggest alternative dates for this swap. Your verified colleague will be notified to review and accept the adjustment.
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-8">
          {/* Original Request Info */}
          <div className="p-6 border border-slate-100 bg-slate-50 rounded-none">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Original Request</p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-unswap-blue-deep/30" />
                <span className="text-sm font-light text-slate-900 tracking-tight">
                  {request?.check_in && format(new Date(request.check_in), 'MMM d')} — {request?.check_out && format(new Date(request.check_out), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l pl-6 border-slate-200">
                From: {request?.requester_name}
              </div>
            </div>
          </div>

          {/* New Dates */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">New Check-in</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-14 rounded-none border-slate-200 justify-start text-sm font-light tracking-tight px-6 shadow-sm">
                    <CalendarIcon className="w-4 h-4 mr-4 opacity-30" />
                    {checkIn ? format(checkIn, 'MMM d, yyyy') : 'Select Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none border-slate-200 shadow-2xl">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">New Check-out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-14 rounded-none border-slate-200 justify-start text-sm font-light tracking-tight px-6 shadow-sm">
                    <CalendarIcon className="w-4 h-4 mr-4 opacity-30" />
                    {checkOut ? format(checkOut, 'MMM d, yyyy') : 'Select Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-none border-slate-200 shadow-2xl">
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
            <div className="text-center">
              <span className="inline-block px-4 py-1.5 bg-violet-50 text-violet-600 text-[10px] font-bold uppercase tracking-[0.3em] rounded-none">
                {nights} Nights Proposed
              </span>
            </div>
          )}

          {/* Message */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Your Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide context for your suggested adjustment..."
              rows={4}
              className="mt-1 rounded-none border-slate-200 focus:ring-unswap-blue-deep focus:border-unswap-blue-deep resize-none p-6 text-sm font-light tracking-tight"
            />
          </div>
        </div>

        <DialogFooter className="p-10 border-t bg-slate-50/50 flex justify-between items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-none text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={() => counterProposalMutation.mutate()}
            disabled={counterProposalMutation.isPending || !checkIn || !checkOut}
            className={`rounded-none h-14 px-10 text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-xl ${counterProposalMutation.isPending || !checkIn || !checkOut
              ? 'bg-slate-200 text-slate-400'
              : 'bg-violet-600 text-white hover:bg-slate-900'
              }`}
          >
            {counterProposalMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-3 animate-spin" />}
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}