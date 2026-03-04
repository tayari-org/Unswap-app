import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeftRight, Calendar, Clock, CheckCircle, XCircle, 
  Video, MessageSquare, Coins, ChevronRight, RefreshCw,
  Loader2, ExternalLink, Star, Trash2, Users, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  video_scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-100',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  counter_proposed: 'bg-violet-50 text-violet-700 border-violet-100',
  pending_guest_approval: 'bg-orange-50 text-orange-700 border-orange-100',
};

export default function SwapRequestCard({ 
  request, isIncoming, user, type, onApprove, onReject, onCounterPropose,
  onScheduleVideo, onMessage, onCompleteSwap, onLeaveReview, onFinalizeSwap,
  onGuestApprovalNeeded, onDelete
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const nights = request.check_in && request.check_out 
    ? differenceInDays(new Date(request.check_out), new Date(request.check_in)) 
    : 0;

  const acceptCounterMutation = useMutation({
    mutationFn: async () => {
      await api.entities.SwapRequest.update(request.id, {
        check_in: request.counter_check_in,
        check_out: request.counter_check_out,
        status: 'pending',
        counter_check_in: null,
        counter_check_out: null,
        counter_message: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('Counter-proposal accepted.');
    }
  });

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col xl:flex-row">
          {/* Main Details */}
          <div className="flex-1 p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="space-y-1.5">
                <Badge variant="outline" className={`${statusStyles[request.status]} border font-medium capitalize`}>
                  {request.status.replace('_', ' ')}
                </Badge>
                <h3 className="text-xl font-semibold text-slate-900 leading-tight">
                  {request.property_title}
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  {request.swap_type === 'reciprocal' ? (
                    <><ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" /> Reciprocal</>
                  ) : (
                    <><Coins className="w-3.5 h-3.5 text-blue-600" /> {request.total_points} pts</>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stay Dates</span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">
                    {request.check_in && format(new Date(request.check_in), 'MMM d')} — {request.check_out && format(new Date(request.check_out), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Trip Length</span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">{nights} nights total</span>
                </div>
              </div>
            </div>

            {request.status === 'counter_proposed' && (
              <div className="mb-6 rounded-lg border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-900">New Dates Proposed</span>
                </div>
                <p className="text-sm text-violet-700 mb-3 font-medium">
                  {request.counter_check_in && format(new Date(request.counter_check_in), 'MMM d')} — {request.counter_check_out && format(new Date(request.counter_check_out), 'MMM d, yyyy')}
                </p>
                {!isIncoming && (
                  <Button size="sm" onClick={() => acceptCounterMutation.mutate()} disabled={acceptCounterMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {acceptCounterMutation.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                    Accept Changes
                  </Button>
                )}
              </div>
            )}

            {request.message && (
              <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                "{request.message}"
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">{isIncoming ? 'Requester' : 'Host'}</p>
                  <p className="text-sm font-semibold text-slate-800">{isIncoming ? (request.requester_name || request.requester_email) : request.host_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Guests</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {request.guests_count}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to={createPageUrl(`PropertyDetails?id=${request.property_id}`)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 whitespace-nowrap">
                  View Property <ExternalLink className="w-3 h-3" />
                </Link>
                {isIncoming && (
                  <Link to={createPageUrl('GuestProfile') + `?email=${request.requester_email}`} className="text-xs font-semibold text-slate-600 hover:text-slate-900 border-l pl-3 border-slate-200 whitespace-nowrap">
                    Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="w-full xl:w-56 bg-slate-50/50 p-4 xl:p-6 border-t xl:border-t-0 xl:border-l border-slate-200 flex flex-col gap-2 shrink-0">
            {isIncoming && request.status === 'pending' && (
              <>
                <Button onClick={() => onApprove(request)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">Approve</Button>
                <Button variant="outline" onClick={() => onCounterPropose(request)} className="w-full bg-white border-slate-200 font-semibold">Counter</Button>
                <Button variant="ghost" onClick={() => onReject(request)} className="w-full text-red-600 hover:bg-red-50 font-semibold">Decline</Button>
              </>
            )}

            {isIncoming && request.status === 'approved' && (
              <>
                <Button onClick={() => onScheduleVideo(request)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"><Video className="w-4 h-4 mr-2" /> Video Call</Button>
                {onFinalizeSwap && (
                  <Button onClick={() => onFinalizeSwap(request)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Finalize Stay</Button>
                )}
              </>
            )}

            {!isIncoming && request.status === 'pending_guest_approval' && (
              <Button onClick={() => onGuestApprovalNeeded?.(request)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Accept Stay</Button>
            )}

            {request.status === 'completed' && onLeaveReview && (
              <Button onClick={() => onLeaveReview(request)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"><Star className="w-4 h-4 mr-2" /> Leave Review</Button>
            )}

            {!['rejected', 'cancelled'].includes(request.status) && request.status !== 'pending' && (
              <Button variant="outline" onClick={() => onMessage(request)} className="w-full bg-white border-slate-200 font-semibold"><MessageSquare className="w-4 h-4 mr-2 text-blue-600" /> Open Chat</Button>
            )}

            {['pending', 'rejected', 'cancelled', 'counter_proposed'].includes(request.status) && onDelete && (
              <Button variant="ghost" onClick={() => onDelete(request)} className="w-full text-slate-400 hover:text-red-600 mt-auto font-medium">Remove</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}