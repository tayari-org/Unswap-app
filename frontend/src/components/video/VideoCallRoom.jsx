import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Clock, Users, Video, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function VideoCallRoom({ videoCall, user, onCallEnd }) {
  const queryClient = useQueryClient();

  // Phases: 'pre' | 'joined' | 'success' | 'guest-done'
  const [phase, setPhase] = useState('pre');
  const [callDuration, setCallDuration] = useState(0);
  const callStartTime = useRef(null);
  const timerRef = useRef(null);

  const isHost = user?.email === videoCall.host_email;

  const markCompletedMutation = useMutation({
    mutationFn: () =>
      api.functions.invoke('markVideoCallCompleted', { video_call_id: videoCall.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['video-calls']);
      queryClient.invalidateQueries(['my-swaps']);
    },
  });

  const formatDuration = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Join call — open Jitsi in new tab, show post-call UI on this page ──────
  const handleJoinCall = () => {
    window.open(videoCall.room_url, '_blank', 'noopener,noreferrer');
    callStartTime.current = Date.now();
    timerRef.current = setInterval(
      () => setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000)),
      1000,
    );
    if (isHost) {
      setPhase('joined');
    } else {
      // Guest: show brief info then auto-close back to swaps
      setPhase('guest-done');
      setTimeout(() => {
        clearInterval(timerRef.current);
        queryClient.invalidateQueries(['video-calls']);
        queryClient.invalidateQueries(['my-swaps']);
        onCallEnd?.();
      }, 3000);
    }
  };

  // ── Host marks call completed ─────────────────────────────────────────────
  const handleMarkCompleted = async () => {
    clearInterval(timerRef.current);
    try {
      await markCompletedMutation.mutateAsync();
      setPhase('success');
      setTimeout(() => { onCallEnd?.(); }, 2500);
    } catch (err) {
      toast.error('Failed to mark call as completed. Please try again.');
    }
  };

  const handleClose = () => {
    clearInterval(timerRef.current);
    queryClient.invalidateQueries(['video-calls']);
    queryClient.invalidateQueries(['my-swaps']);
    onCallEnd?.();
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-500 text-white">Meeting Coordinator</Badge>
          {phase === 'joined' && (
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span>{videoCall.host_name} &amp; {videoCall.guest_name}</span>
        </div>

        {!['guest-done', 'success'].includes(phase) && (
          <Button
            onClick={handleClose}
            variant="outline"
            className="bg-transparent text-white border-white/20 hover:bg-white/10"
          >
            Close Window
          </Button>
        )}
        {['guest-done', 'success'].includes(phase) && <div className="w-28" />}
      </div>

      {/* ── PRE-CALL SCREEN ────────────────────────────────────────────────── */}
      {phase === 'pre' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
          <Video className="w-20 h-20 mb-6 text-slate-400" />
          <h2 className="text-3xl font-bold mb-3">Ready to join your secure video call?</h2>
          <p className="text-slate-300 mb-8 max-w-lg">
            Your Jitsi video call will open in a new tab. Return to this page when the
            call is done — {isHost ? 'you\'ll mark it as completed here.' : 'the host will confirm completion here.'}
          </p>
          <Button
            onClick={handleJoinCall}
            className="bg-unswap-blue-deep hover:bg-blue-800 text-white text-lg px-8 py-6 rounded-md shadow-lg"
          >
            <ExternalLink className="w-5 h-5 mr-3" />
            Join Call in New Tab
          </Button>
        </div>
      )}

      {/* ── JOINED / POST-CALL SCREEN (host only) ──────────────────────────── */}
      {phase === 'joined' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
          <Badge className="bg-amber-500 text-white animate-pulse mb-6 rounded-md px-3 py-1">
            <div className="w-2 h-2 bg-white rounded-full mr-2 inline-block" />
            Call in Progress
          </Badge>
          <h2 className="text-3xl font-bold mb-3">Meeting opened in a new tab</h2>
          <p className="text-slate-300 mb-8 max-w-lg">
            Your video call is active in the other tab. When the meeting is done, come
            back here and click <strong>Mark Call as Completed</strong> to advance your swap.
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

            <Button
              onClick={handleMarkCompleted}
              disabled={markCompletedMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-md shadow-lg"
            >
              {markCompletedMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Marking…</>
              ) : (
                <><CheckCircle className="w-5 h-5 mr-3" />Mark Call as Completed</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── GUEST-DONE SCREEN ──────────────────────────────────────────────── */}
      {phase === 'guest-done' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-14 h-14 text-blue-400" />
          </div>
          <h2 className="text-4xl font-bold mb-3 text-blue-300">Call Joined!</h2>
          <p className="text-slate-300 mb-2 max-w-lg text-lg">
            Your Meet &amp; Greet is underway in the other tab.
          </p>
          <p className="text-slate-400 text-sm">
            The host will confirm call completion. Returning you to your swaps…
          </p>
        </div>
      )}

      {/* ── SUCCESS SCREEN (host only) ─────────────────────────────────────── */}
      {phase === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-14 h-14 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold mb-3 text-emerald-400">Call Completed!</h2>
          <p className="text-slate-300 mb-2 max-w-lg text-lg">
            Your Meet &amp; Greet has been successfully recorded.
          </p>
          <p className="text-slate-400 text-sm">
            Your swap request has been advanced to the next stage. Redirecting…
          </p>
        </div>
      )}

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-sm px-6 py-3 text-center">
        <p className="text-white/60 text-sm">
          Complete this mandatory Meet &amp; Greet call to proceed with your swap request
        </p>
      </div>
    </div>
  );
}