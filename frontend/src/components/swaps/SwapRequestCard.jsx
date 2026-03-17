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
  video_scheduled: 'bg-unswap-blue-deep/10 text-unswap-blue-deep border-unswap-blue-deep/20',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-100',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  counter_proposed: 'bg-violet-50 text-violet-700 border-violet-100',
  pending_guest_approval: 'bg-orange-50 text-orange-700 border-orange-100',
  guest_agreed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function SwapRequestCard({
  request, isIncoming, user, property, type, onApprove, onReject, onCounterPropose,
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
    <Card className="rounded-none border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Property Image */}
          {property?.images?.[0] && (
            <div className="w-full h-40 lg:h-auto lg:w-48 shrink-0 bg-slate-100 relative group overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200">
              <img 
                src={property.images[0]} 
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
            </div>
          )}

          {/* Main Details */}
          <div className="flex-1 p-4">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${statusStyles[request.status].split(' ')[1].replace('text-', 'bg-')}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-[0.4em] ${statusStyles[request.status].split(' ')[1]}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight leading-tight group-hover:text-unswap-blue-deep transition-colors duration-500">
                  {request.property_title}
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-none border border-slate-100 bg-slate-50 text-[9px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                  {request.swap_type === 'reciprocal' ? (
                    <><ArrowLeftRight className="w-3 h-3 text-unswap-blue-deep/60" /> Reciprocal</>
                  ) : (
                    <><Coins className="w-3 h-3 text-unswap-blue-deep/60" /> {request.total_points} Pts</>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                  <span className="text-xs font-light tracking-tight">
                    {request.check_in && format(new Date(request.check_in), 'MMM d')} — {request.check_out && format(new Date(request.check_out), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Analysis</span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-unswap-blue-deep/30" />
                  <span className="text-xs font-light tracking-tight">{nights} nights</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isIncoming ? 'Requester' : 'Host'}</p>
                <p className="text-xs font-light text-slate-900 tracking-tight truncate">{isIncoming ? (request.requester_name || request.requester_email) : request.host_email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Guests</p>
                <div className="flex items-center gap-1.5 text-xs font-light text-slate-900 tracking-tight">
                  <Users className="w-3.5 h-3.5 opacity-20" />
                  {request.guests_count}
                </div>
              </div>
            </div>

            {request.status === 'counter_proposed' && (
              <div className="mb-4 p-4 bg-violet-50/30 border-l-4 border-violet-400">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-violet-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-900">Adjustment Requested</span>
                </div>
                <p className="text-sm font-light text-violet-800 mb-4 tracking-tight">
                  {request.counter_check_in && format(new Date(request.counter_check_in), 'MMM d')} — {request.counter_check_out && format(new Date(request.counter_check_out), 'MMM d, yyyy')}
                </p>
                {!isIncoming && (
                  <Button
                    size="sm"
                    onClick={() => acceptCounterMutation.mutate()}
                    disabled={acceptCounterMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-none text-[9px] font-bold uppercase tracking-widest px-4 h-9"
                  >
                    {acceptCounterMutation.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
                    Accept Adjustment
                  </Button>
                )}
              </div>
            )}

            {request.message && (
              <div className="mb-4 p-4 bg-slate-50/50 border border-slate-100 text-xs font-light text-slate-600 italic leading-relaxed">
                "{request.message}"
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="flex items-center gap-4">
                <Link to={createPageUrl(`PropertyDetails?id=${request.property_id}`)} className="text-[9px] font-bold text-unswap-blue-deep uppercase tracking-[0.2em] hover:text-slate-900 transition-colors flex items-center gap-2">
                  View Asset <ExternalLink className="w-3 h-3 opacity-40" />
                </Link>
                {isIncoming && (
                  <Link to={createPageUrl('GuestProfile') + `?email=${request.requester_email}`} className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors border-l pl-4 border-slate-200">
                    Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Action Sidebar - High Contrast Vertical Actions */}
          <div className="w-full xl:w-48 bg-slate-50/80 p-4 xl:border-l border-slate-200 flex flex-col gap-2 shrink-0">
            {isIncoming && request.status === 'pending' && (
              <>
                <Button onClick={() => onApprove(request)} className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all">Approve</Button>
                <Button variant="outline" onClick={() => onCounterPropose(request)} className="w-full bg-white border-slate-200 rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50">Counter</Button>
                <Button variant="ghost" onClick={() => onReject(request)} className="w-full text-red-500 hover:text-red-700 hover:bg-rose-50 rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em]">Decline</Button>
              </>
            )}

            {isIncoming && request.status === 'approved' && (
              <>
                <Button onClick={() => onScheduleVideo(request)} className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all"><Video className="w-3 h-3 mr-2 opacity-60" /> Video Call</Button>
                {onFinalizeSwap && (
                  <Button onClick={() => onFinalizeSwap(request)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm mt-1">Finalize Stay</Button>
                )}
              </>
            )}

            {!isIncoming && request.status === 'pending_guest_approval' && (
              <Button onClick={() => onGuestApprovalNeeded?.(request)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all">Accept Stay</Button>
            )}

            {isIncoming && request.status === 'guest_agreed' && (
              <Button onClick={() => onCompleteSwap?.(request)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all"><CheckCircle className="w-3 h-3 mr-2 opacity-60" /> Mark Complete</Button>
            )}

            {request.status === 'completed' && onLeaveReview && (
              <Button onClick={() => onLeaveReview(request)} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all"><Star className="w-3 h-3 mr-2 opacity-60" /> Leave Review</Button>
            )}

            {!['rejected', 'cancelled'].includes(request.status) && request.status !== 'pending' && (
              <Button variant="outline" onClick={() => onMessage(request)} className="w-full bg-white border-slate-200 rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 mt-auto shadow-sm"><MessageSquare className="w-3 h-3 mr-2 text-unswap-blue-deep/60" /> Open Chat</Button>
            )}

            {['pending', 'rejected', 'cancelled', 'counter_proposed'].includes(request.status) && onDelete && (
              <Button variant="ghost" onClick={() => onDelete(request)} className="w-full text-slate-400 hover:text-red-500 rounded-none h-10 text-[9px] font-bold uppercase tracking-[0.3em] mt-auto">Remove Record</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}