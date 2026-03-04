import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Clock, PhoneOff, Users, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function VideoCallRoom({ videoCall, user, onCallEnd }) {
  const queryClient = useQueryClient();
  const [callDuration, setCallDuration] = useState(0);
  const [dailyReady, setDailyReady] = useState(false);
  const [joinedCall, setJoinedCall] = useState(false);
  const callFrameRef = useRef(null);
  const callStartTime = useRef(null);

  const isHost = user?.email === videoCall.host_email;

  const updateVideoCallMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.VideoCall.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['video-calls']),
  });

  // Load Daily.co script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.async = true;
    script.onload = () => {
      setDailyReady(true);
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize Daily.co call
  useEffect(() => {
    if (!dailyReady || !window.DailyIframe) return;

    // Join if: status is in_progress OR user explicitly clicked join button
    if (videoCall.status === 'in_progress' || joinedCall) {
      initializeCall();
    }
    
    return () => {
      cleanup();
    };
  }, [dailyReady, joinedCall]);

  // Timer
  useEffect(() => {
    if (callStartTime.current) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callStartTime.current]);

  const initializeCall = async () => {
    try {
      // Create Daily.co room URL (using room_id as the room name)
      const roomUrl = `https://unswap.daily.co/${videoCall.room_id}`;

      // Create Daily iframe
      callFrameRef.current = window.DailyIframe.createFrame(
        document.getElementById('daily-video-container'),
        {
          iframeStyle: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: '0',
          },
          showLeaveButton: false,
          showFullscreenButton: true,
        }
      );

      // Join the call
      await callFrameRef.current.join({ url: roomUrl });

      // Update join status
      const joinField = isHost ? 'host_joined' : 'guest_joined';
      await updateVideoCallMutation.mutateAsync({
        id: videoCall.id,
        data: { 
          [joinField]: true,
          status: 'in_progress',
          call_started_at: new Date().toISOString()
        }
      });

      // After status update, fetch fresh data to update component
      await queryClient.invalidateQueries(['video-calls']);
      
      callStartTime.current = Date.now();

      // Listen for events
      callFrameRef.current.on('left-meeting', () => {
        endCall();
      });

      toast.success('Connected to video call');
    } catch (error) {
      console.error('Error joining call:', error);
      toast.error('Could not join video call. Please try again.');
    }
  };

  const cleanup = () => {
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
  };

  const endCall = async () => {
    await updateVideoCallMutation.mutateAsync({
      id: videoCall.id,
      data: {
        status: 'completed',
        call_ended_at: new Date().toISOString(),
        meeting_completed: true,
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

    cleanup();
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
          <Badge className="bg-red-500 text-white animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-2" />
            Live
          </Badge>
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatDuration(callDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span>
            {videoCall.host_name} & {videoCall.guest_name}
          </span>
        </div>

        <Button
          onClick={endCall}
          variant="outline"
          className="bg-red-500 hover:bg-red-600 text-white border-0"
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          Leave Call
        </Button>
      </div>

      {/* Daily.co Video Container */}
      {!dailyReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Loading video call...</p>
          </div>
        </div>
      ) : (
        <div id="daily-video-container" className="flex-1" />
      )}

      {/* Join Call Button Overlay */}
      {!joinedCall && dailyReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white">
          <Video className="w-24 h-24 mb-6 text-slate-400" />
          <h2 className="text-2xl font-bold mb-2">Ready to join the call?</h2>
          <p className="text-slate-300 mb-6">
            {isHost ? videoCall.guest_name : videoCall.host_name} will be notified when you join.
          </p>
          <Button
            onClick={() => setJoinedCall(true)}
            className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3 rounded-full"
          >
            <Video className="w-5 h-5 mr-3" />
            Join Call
          </Button>
        </div>
      )}

      {/* Waiting for Other Participant */}
      {joinedCall && dailyReady && videoCall.status === 'in_progress' && !(videoCall.host_joined && videoCall.guest_joined) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white">
          <Loader2 className="w-24 h-24 animate-spin mb-6 text-slate-400" />
          <h2 className="text-2xl font-bold mb-2">Waiting for the other participant...</h2>
          <p className="text-slate-300 mb-6">
            {isHost ? videoCall.guest_name : videoCall.host_name} hasn't joined yet.
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm px-6 py-3 text-center">
        <p className="text-white/60 text-sm">
          Complete this mandatory Meet & Greet call to proceed with your swap request
        </p>
      </div>
    </div>
  );
}