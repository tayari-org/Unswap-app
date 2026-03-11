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
          const requesterPoints = user?.guest_points || 500;
          setInsufficientPoints(requesterPoints < request.total_points);
        } else {
          const reqUsers = await api.entities.User.filter({ email: request.requester_email });
          const req = reqUsers[0];
          setRequesterData(req);
          const requesterPoints = req?.guest_points || 500;
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

  const requesterPoints = requesterData?.guest_points || 500;
  const hostPoints = hostData?.guest_points || 500;

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
      <DialogContent className="max-w-md rounded-none border-0 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-10 border-b bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-emerald-500/20" />
            <p className="text-emerald-600 font-bold tracking-[0.4em] uppercase text-[9px]">Swap Conclusion</p>
          </div>
          <DialogTitle className="text-3xl font-extralight text-slate-900 tracking-tighter leading-tight">
            Stay <span className="italic font-serif">Completed.</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-light mt-4 leading-relaxed">
            Please confirm that the home swap has been successfully concluded to release GuestPoints and finalize the record.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Swap Summary */}
          <Card className="bg-slate-50">
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-sm text-slate-500">Property</p>
                <p className="font-medium">{request?.property_title}</p>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-500">Dates</p>
                  <p className="font-medium">
                    {request?.check_in && format(new Date(request.check_in), 'MMM d')} -
                    {request?.check_out && format(new Date(request.check_out), 'MMM d')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium">{nights} nights</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Transfer Info */}
          {isGuestPointsSwap && (
            <Card className={insufficientPoints ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">From</p>
                    <p className="font-medium text-slate-900">
                      {isRequester ? 'You' : request?.requester_name || request?.requester_email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500">Balance: {requesterPoints} pts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className={`w-5 h-5 ${insufficientPoints ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className={`text-xl font-bold ${insufficientPoints ? 'text-red-600' : 'text-amber-600'}`}>
                      {request?.total_points}
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600">To</p>
                    <p className="font-medium text-slate-900">
                      {!isRequester ? 'You' : request?.host_email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500">Balance: {hostPoints} pts</p>
                  </div>
                </div>

                {insufficientPoints && (
                  <div className="flex items-center gap-2 p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">
                      Insufficient points! {isRequester ? 'You need' : 'Requester needs'} {request?.total_points - requesterPoints} more points.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              This action cannot be undone. Make sure the stay has been completed satisfactorily.
            </p>
          </div>

          {/* Confirmation */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={setConfirmed}
            />
            <Label htmlFor="confirm" className="text-sm">
              I confirm that the swap has been completed and I'm satisfied with the exchange
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => completeSwapMutation.mutate()}
            disabled={!confirmed || completeSwapMutation.isPending || (isGuestPointsSwap && insufficientPoints) || loadingUsers}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {(completeSwapMutation.isPending || loadingUsers) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {insufficientPoints ? 'Insufficient Points' : 'Complete & Transfer Points'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}