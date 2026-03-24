import React from 'react';
import { format, isPast, differenceInMinutes } from 'date-fns';
import { Calendar, Clock, Video, Users, CheckCircle, AlertCircle, User as UserIcon, Home, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';

export default function ScheduledCallCard({ videoCall, user, onJoinCall, onEdit, onDelete }) {
  // Fetch swap request details to get property info
  const { data: swapRequests = [] } = useQuery({
    queryKey: ['swap-request', videoCall.swap_request_id],
    queryFn: () => api.entities.SwapRequest.filter({ id: videoCall.swap_request_id }),
    enabled: !!videoCall.swap_request_id,
  });

  const swapRequest = swapRequests[0];
  const scheduledTime = new Date(videoCall.scheduled_time);
  const isUpcoming = !isPast(scheduledTime);
  const minutesUntil = differenceInMinutes(scheduledTime, new Date());
  const canJoin = minutesUntil <= 10 && minutesUntil >= -30; // Join 10 min before, up to 30 min after

  const isHost = user?.email === videoCall.host_email;
  const otherPartyName = isHost ? videoCall.guest_name : videoCall.host_name;
  const otherPartyEmail = isHost ? videoCall.guest_email : videoCall.host_email;

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-green-100 text-green-700',
    completed: 'bg-slate-100 text-slate-700',
    missed: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-700',
  };

  const statusIcons = {
    scheduled: Calendar,
    in_progress: Video,
    completed: CheckCircle,
    missed: AlertCircle,
    cancelled: AlertCircle,
  };

  const StatusIcon = statusIcons[videoCall.status] || Calendar;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className={statusColors[videoCall.status]}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {videoCall.status.replace('_', ' ')}
            </Badge>
            <h3 className="text-lg font-semibold text-slate-900 mt-2">
              Meet & Greet Video Call
            </h3>
            <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
              <Users className="w-4 h-4" />
              <span>with {otherPartyName}</span>
            </div>
          </div>

          {(videoCall.status === 'scheduled' || videoCall.status === 'in_progress') && (
            <Button 
              onClick={onJoinCall}
              className={`bg-blue-500 hover:bg-blue-600 text-white ${
                canJoin ? 'animate-pulse' : ''
              }`}
            >
              <Video className="w-4 h-4 mr-2" />
              {videoCall.status === 'in_progress' ? 'Rejoin Call' : 'Join Call'}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{format(scheduledTime, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Clock className="w-4 h-4" />
            <span>{format(scheduledTime, 'h:mm a')}</span>
            <span className="text-slate-400">• {videoCall.duration_minutes} minutes</span>
          </div>
        </div>

        {isUpcoming && !canJoin && minutesUntil > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Call starts in {minutesUntil < 60 ? `${minutesUntil} minutes` : `${Math.floor(minutesUntil / 60)} hours`}. 
              You can join 10 minutes before.
            </p>
          </div>
        )}

        {videoCall.status === 'completed' && videoCall.meeting_completed && (
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-800 font-medium">
                Call completed successfully
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <Link 
            to={createPageUrl('GuestProfile') + `?email=${otherPartyEmail}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <UserIcon className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
          {swapRequest?.property_id && (
            <Link 
              to={createPageUrl('PropertyDetails') + `?id=${swapRequest.property_id}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                View Property
              </Button>
            </Link>
          )}
          {(videoCall.status === 'scheduled' || videoCall.status === 'in_progress') && (
            <Button
              size="sm"
              onClick={onJoinCall}
              className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
            >
              <Video className="w-4 h-4 mr-2" />
              {videoCall.status === 'in_progress' ? 'Rejoin Call' : 'Join Call'}
            </Button>
          )}
          {videoCall.status === 'scheduled' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit?.(videoCall)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete?.(videoCall)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}