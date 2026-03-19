import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Calendar, Clock, Video, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { notifyVideoCallScheduled } from '../notifications/notificationHelpers';

export default function VideoCallScheduler({ swapRequest, user, onScheduled }) {
  const queryClient = useQueryClient();
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const createVideoCallMutation = useMutation({
    mutationFn: async (data) => {
      const videoCall = await api.entities.VideoCall.create(data);
      
      // Create Daily.co room
      try {
        await api.functions.invoke('createDailyRoom', {
          videoCallId: videoCall.id
        });
      } catch (error) {
        console.error('Error creating Daily room:', error);
        toast.error('Failed to create video room');
        throw error;
      }
      
      // Send notifications to both parties
      await notifyVideoCallScheduled({
        guestEmail: data.guest_email,
        hostEmail: data.host_email,
        guestName: data.guest_name,
        hostName: data.host_name,
        propertyTitle: swapRequest.property_title,
        scheduledTime: data.scheduled_time,
        videoCallId: videoCall.id
      });
      
      return videoCall;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['video-calls']);
      toast.success('Video call scheduled!');
      onScheduled?.();
    },
  });

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const isHost = user?.email === swapRequest.host_email;

    // Fetch the requester's name from the User table so the notification isn't 'undefined'
    let guestDisplayName = swapRequest.requester_email;
    try {
      const requesterUsers = await api.entities.User.filter({ email: swapRequest.requester_email });
      const requester = requesterUsers?.[0];
      guestDisplayName = requester?.full_name || requester?.username || swapRequest.requester_email;
    } catch (_) {}

    await createVideoCallMutation.mutateAsync({
      swap_request_id: swapRequest.id,
      host_id: swapRequest.host_id,
      host_email: swapRequest.host_email,
      host_name: isHost ? (user?.full_name || user?.username || user?.email) : swapRequest.host_email,
      guest_id: swapRequest.requester_id,
      guest_email: swapRequest.requester_email,
      guest_name: guestDisplayName,
      scheduled_time: scheduledDateTime.toISOString(),
      duration_minutes: 30,
      room_id: '',
      status: 'scheduled',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-500" />
          Schedule Meet-and-Greet Video Call
        </CardTitle>
        <CardDescription>
          This mandatory video call helps establish trust before finalizing the swap
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Video Call Requirements</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Introduce yourself and discuss the property</li>
                <li>Review house rules and expectations</li>
                <li>Discuss arrival/departure procedures</li>
                <li>Build trust and rapport</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSchedule}
          disabled={!scheduledDate || !scheduledTime || createVideoCallMutation.isPending}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Video Call
        </Button>
      </CardContent>
    </Card>
  );
}