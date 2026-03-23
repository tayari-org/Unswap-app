import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Clock, PhoneOff, Users, Loader2, Video, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function VideoCallRoom({ videoCall, user, onCallEnd }) {
  const queryClient = useQueryClient();
  const [callDuration, setCallDuration] = useState(0);
  const [joinedCall, setJoinedCall] = useState(false);
  const callStartTime = useRef(null);

  const isHost = user?.email === videoCall.host_email;

  const updateVideoCallMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.VideoCall.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['video-calls']),
  });

  // Timer
  useEffect(() => {
    if (callStartTime.current) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStartTime.current]);

  const handleJoinCall = async () => {
    try {
      callStartTime.current = Date.now();
      setJoinedCall(true);

      // Open Jitsi in new tab — no DB update needed at join time
      window.open(videoCall.room_url, '_blank', 'noopener,noreferrer');

      toast.success('Call opened in new tab. Return here when done to mark it completed.');
    } catch (error) {
      console.error('Error joining call:', error);
      toast.error('Could not open video call. Please try again.');
    }
  };

  const endCall = async () => {
    await updateVideoCallMutation.mutateAsync({
      id: videoCall.id,
      data: {
        meeting_completed: true,
        call_ended_at: new Date().toISOString(),
      }
    });

    // Mark video call as completed via backend function
    if (videoCall.swap_request_id) {
      try {
        await api.functions.invoke('markVideoCallCompleted', {
          video_call_id: videoCall.id
        });
      } catch (error) {
        console.error('Error marking video call completed:', error);
      }
    }

    onCallEnd?.();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-500 text-white">
            Meeting Coordinator
          </Badge>
          {joinedCall && (
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span>
            {videoCall.host_name} & {videoCall.guest_name}
          </span>
        </div>

        <Button
          onClick={() => onCallEnd?.()}
          variant="outline"
          className="bg-transparent text-white border-white/20 hover:bg-white/10"
        >
          Close Window
        </Button>
      </div>

      {/* Main Content Status View */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
        {!joinedCall ? (
          <>
            <Video className="w-20 h-20 mb-6 text-slate-400" />
            <h2 className="text-3xl font-bold mb-3">Ready to join your secure video call?</h2>
            <p className="text-slate-300 mb-8 max-w-lg">
              To ensure the best and uninterrupted experience, your secure Jitsi video call will open in a new tab. When you are finished with your meeting, return here to mark the call as completed.
            </p>
            <Button
              onClick={handleJoinCall}
              className="bg-unswap-blue-deep hover:bg-blue-800 text-white text-lg px-8 py-6 rounded-md shadow-lg"
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              Join Call in New Tab
            </Button>
          </>
        ) : (
          <>
            <Badge className="bg-amber-500 text-white animate-pulse mb-6 rounded-md px-3 py-1">
              <div className="w-2 h-2 bg-white rounded-full mr-2" />
              Call in Progress
            </Badge>
            <h2 className="text-3xl font-bold mb-3">Meeting opened in a new tab</h2>
            <p className="text-slate-300 mb-8 max-w-lg">
              Your video call is currently active in another tab. If you accidentally closed it, you can rejoin using the button below. Once your meet and greet is successfully completed, ensure you click 'Mark Call as Completed' to advance your swap request.
            </p>
            
            <div className="flex gap-4">
              <Button
                onClick={() => window.open(videoCall.room_url, '_blank', 'noopener,noreferrer')}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 px-6 py-6"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Rejoin Tab
              </Button>
              {isHost ? (
                <Button
                  onClick={endCall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-md shadow-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-3" />
                  Mark Call as Completed
                </Button>
              ) : (
                <div className="flex items-center text-amber-400 text-sm italic ml-4">
                  Only the Host can mark the call as completed.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm px-6 py-3 text-center">
        <p className="text-white/60 text-sm">
          Complete this mandatory Meet & Greet call to proceed with your swap request
        </p>
      </div>
    </div>
  );
}