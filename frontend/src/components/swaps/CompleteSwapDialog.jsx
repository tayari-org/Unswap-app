import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { differenceInDays, format } from 'date-fns';
import { CheckCircle, Coins, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompleteSwapDialog({ open, onOpenChange, request, user }) {
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const nights = request?.check_in && request?.check_out
    ? differenceInDays(new Date(request.check_out), new Date(request.check_in))
    : 0;

  const isRequester = request?.requester_email === user?.email;
  const isGuestPointsSwap = request?.swap_type === 'guestpoints';

  // Get requester's current points to check sufficiency
  const [requesterData, setRequesterData] = useState(null);
  const [hostData, setHostData] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [insufficientPoints, setInsufficientPoints] = useState(false);

  React.useEffect(() => {
    if (open && request && isGuestPointsSwap) {
      setLoadingUsers(true);
      const fetchUsers = async () => {
        // Get requester data
        if (isRequester) {
          setRequesterData(user);
          const requesterPoints = user?.guest_points ?? 500;
          setInsufficientPoints(requesterPoints < request.total_points);
        } else {
          const reqUsers = await api.entities.User.filter({ email: request.requester_email });
          const req = reqUsers[0];
          setRequesterData(req);
          const requesterPoints = req?.guest_points ?? 500;
          setInsufficientPoints(requesterPoints < request.total_points);
        }

        // Get host data
        if (!isRequester) {
          setHostData(user);
        } else {
          const hostUsers = await api.entities.User.filter({ email: request.host_email });
          setHostData(hostUsers[0]);
        }

        setLoadingUsers(false);
      };
      fetchUsers();
    }
  }, [open, request, user, isRequester, isGuestPointsSwap]);

  const requesterPoints = requesterData?.guest_points ?? 500;
  const hostPoints = hostData?.guest_points ?? 500;

  const completeSwapMutation = useMutation({
    mutationFn: async () => {
      // Use backend function to complete swap
      const response = await api.functions.invoke('completeSwap', {
        swap_request_id: request.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      queryClient.invalidateQueries(['current-user']);
      toast.success('Swap completed successfully! Points have been transferred.');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete swap');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-none border-0 shadow-2xl p-0">
        <DialogHeader className="p-10 border-b bg-stone-50/80 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-emerald-500" />
            <p className="text-emerald-600 font-bold tracking-[0.4em] uppercase text-[9px]">Swap Conclusion</p>
          </div>
          <DialogTitle className="text-5xl font-extralight text-slate-900 tracking-tighter leading-none mb-4">
            Stay <span className="italic font-serif">Completed.</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500 font-light max-w-sm leading-relaxed">
            Please confirm that the home swap has been successfully concluded to release GuestPoints and finalize the record.
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-10">
          {/* Swap Summary */}
          <div className="p-8 bg-stone-50/50 border border-slate-100 rounded-none shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Swap Summary</p>
            <div className="grid grid-cols-2 gap-8">
              <div className="col-span-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Property</p>
                <p className="text-lg font-extralight tracking-tight text-slate-900 leading-tight">{request?.property_title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Dates</p>
                <div className="flex items-center gap-2 text-slate-900 font-light text-sm">
                  {request?.check_in && format(new Date(request.check_in), 'MMM d')} - {request?.check_out && format(new Date(request.check_out), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Duration</p>
                <p className="text-sm font-light tracking-tight text-slate-900">{nights} nights</p>
              </div>
            </div>
          </div>

          {/* Points Transfer Info */}
          {isGuestPointsSwap && (
            <div className={`p-8 border rounded-none shadow-sm ${insufficientPoints ? 'bg-rose-50/50 border-rose-100' : 'bg-stone-50/50 border-slate-100'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-3">Origin</p>
                  <p className="text-lg font-light tracking-tighter text-slate-900">
                    {isRequester ? 'YOU' : (request?.requester_name || request?.requester_email?.split('@')[0]).toUpperCase()}
                  </p>
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Balance</span>
                    <span className="text-xs font-bold text-slate-500">{requesterPoints} GP</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className={`flex items-center gap-4 px-8 py-4 ${insufficientPoints ? 'bg-rose-100/50 text-rose-600 border-rose-200' : 'bg-emerald-500 text-white border-emerald-600'} rounded-none border shadow-lg`}>
                    <Coins className="w-5 h-5 opacity-80" />
                    <span className="text-2xl font-bold tracking-tighter">
                      {request?.total_points}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-200 mt-6 rotate-90 sm:rotate-0" />
                </div>
                
                <div className="flex-1 text-center sm:text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-3">Destination</p>
                  <p className="text-lg font-light tracking-tighter text-slate-900">
                    {!isRequester ? 'YOU' : (request?.host_email?.split('@')[0]).toUpperCase()}
                  </p>
                  <div className="mt-3 flex items-center justify-center sm:justify-end gap-2">
                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Balance</span>
                    <span className="text-xs font-bold text-slate-500">{hostPoints} GP</span>
                  </div>
                </div>
              </div>

              {insufficientPoints && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex items-center gap-4 p-5 bg-rose-600 text-white rounded-none shadow-xl"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold">
                    Critical: Insufficient Balance. {isRequester ? 'Deficit' : 'Requester Deficit'}: {request?.total_points - requesterPoints} GP
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-4 p-6 bg-stone-50 border border-slate-100 rounded-none border-l-4 border-l-amber-500">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 font-light leading-relaxed">
              <strong className="font-bold block mb-2 uppercase text-[9px] tracking-[0.2em] text-amber-700">Protocol Warning</strong>
              This action cannot be undone. Make sure the stay has been completed satisfactorily before final authorization.
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-start space-x-5 p-8 bg-stone-50/50 border border-slate-100 rounded-none transition-all duration-300 hover:bg-white hover:shadow-md group">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={setConfirmed}
              className="mt-1 rounded-none border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
            />
            <Label htmlFor="confirm" className="text-xs font-light tracking-tight leading-relaxed text-slate-600 cursor-pointer group-hover:text-slate-900">
              I confirm that the swap has been completed and I'm satisfied with the exchange
            </Label>
          </div>
        </div>

        <DialogFooter className="p-0 flex flex-row h-16 bg-white border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-none h-full text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Button>
          <Button
            onClick={() => completeSwapMutation.mutate()}
            disabled={!confirmed || completeSwapMutation.isPending || (isGuestPointsSwap && insufficientPoints) || loadingUsers}
            className={`flex-1 rounded-none h-full text-[10px] font-bold uppercase tracking-[0.5em] transition-all shadow-2xl ${
              !confirmed || completeSwapMutation.isPending || (isGuestPointsSwap && insufficientPoints) || loadingUsers
                ? 'bg-slate-50 text-slate-300'
                : 'bg-emerald-600 text-white hover:bg-slate-900'
            }`}
          >
            {(completeSwapMutation.isPending || loadingUsers) ? <Loader2 className="w-4 h-4 animate-spin" /> : (insufficientPoints ? 'Insufficient' : 'Complete & Transfer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}