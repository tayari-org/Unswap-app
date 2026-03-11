import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeftRight, Calendar, Clock, CheckCircle, XCircle,
  Video, MessageSquare, Coins, ChevronRight, Home, AlertCircle, Plus,
  LayoutDashboard, History, CalendarDays, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';

import VideoCallScheduler from '../components/video/VideoCallScheduler';
import { notifySwapApproved, notifySwapRejected } from '../components/notifications/notificationHelpers';
import ScheduledCallCard from '../components/video/ScheduledCallCard';
import VideoCallRoom from '../components/video/VideoCallRoom';
import CreateSwapRequestDialog from '../components/swaps/CreateSwapRequestDialog';
import SwapRequestCard from '../components/swaps/SwapRequestCard';
import CounterProposalDialog from '../components/swaps/CounterProposalDialog';
import SwapMessaging from '../components/swaps/SwapMessaging';
import CompleteSwapDialog from '../components/swaps/CompleteSwapDialog';
import VerificationRequiredDialog from '../components/verification/VerificationRequiredDialog';
import ReviewForm from '../components/reviews/ReviewForm';
import FinalizeSwapDialog from '../components/swaps/FinalizeSwapDialog';
import GuestFinalizeApprovalDialog from '../components/swaps/GuestFinalizeApprovalDialog';

export default function MySwaps() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showVideoScheduler, setShowVideoScheduler] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCounterDialog, setShowCounterDialog] = useState(null);
  const [showMessaging, setShowMessaging] = useState(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(null);
  const [showGuestApprovalDialog, setShowGuestApprovalDialog] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [editVideoCall, setEditVideoCall] = useState(null);
  const [deleteVideoCall, setDeleteVideoCall] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: verification } = useQuery({
    queryKey: ['user-verification', user?.email],
    queryFn: () => api.entities.Verification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const isVerified = verification?.[0]?.status === 'approved';

  const handleNewSwapRequest = () => {
    navigate(createPageUrl('FindProperties'));
  };

  const { data: swapRequests = [], isLoading } = useQuery({
    queryKey: ['my-swaps', user?.email],
    queryFn: () => api.entities.SwapRequest.filter({
      $or: [{ requester_email: user?.email }, { host_email: user?.email }]
    }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: videoCalls = [] } = useQuery({
    queryKey: ['video-calls', user?.email],
    queryFn: () => api.entities.VideoCall.filter({
      $or: [{ host_email: user?.email }, { guest_email: user?.email }]
    }, '-scheduled_time'),
    enabled: !!user?.email,
  });

  const updateSwapMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.SwapRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-swaps']);
      setSelectedRequest(null);
    },
  });

  const incomingRequests = swapRequests.filter(r => r.host_email === user?.email);
  const outgoingRequests = swapRequests.filter(r => r.requester_email === user?.email);

  const { data: properties = [] } = useQuery({
    queryKey: ['all-properties'],
    queryFn: () => api.entities.Property.list(),
  });

  const handleApprove = async (request) => {
    await updateSwapMutation.mutateAsync({
      id: request.id,
      data: { status: 'approved' }
    });

    await notifySwapApproved({
      requesterEmail: request.requester_email,
      hostName: user?.full_name || user?.email,
      propertyTitle: request.property_title,
      swapRequestId: request.id
    });
  };

  const handleScheduleVideo = (request) => {
    const existingCall = videoCalls.find(v => v.swap_request_id === request.id && v.status !== 'completed');
    if (existingCall) {
      setActiveVideoCall(existingCall);
    } else {
      setShowVideoScheduler(request);
    }
  };

  const handleVideoCallScheduled = async () => {
    if (!showVideoScheduler) return;
    await updateSwapMutation.mutateAsync({
      id: showVideoScheduler.id,
      data: { status: 'video_scheduled' }
    });

    await notifySwapApproved({
      requesterEmail: showVideoScheduler.requester_email,
      hostName: user?.full_name || user?.email,
      propertyTitle: showVideoScheduler.property_title,
      swapRequestId: showVideoScheduler.id
    });

    setShowVideoScheduler(null);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    await updateSwapMutation.mutateAsync({
      id: selectedRequest.id,
      data: { status: 'rejected' }
    });

    await notifySwapRejected({
      requesterEmail: selectedRequest.requester_email,
      hostName: user?.full_name || user?.email,
      propertyTitle: selectedRequest.property_title,
      swapRequestId: selectedRequest.id
    });

    toast.success('Request rejected');
    setRejectReason('');
  };

  const handleDelete = (request) => {
    setShowDeleteDialog(request);
  };

  const confirmDelete = async () => {
    if (!showDeleteDialog) return;
    try {
      const otherPartyEmail = showDeleteDialog.host_email === user?.email ? showDeleteDialog.requester_email : showDeleteDialog.host_email;
      const otherPartyName = user?.full_name || user?.email;

      await api.entities.Notification.create({
        user_email: otherPartyEmail,
        type: 'system',
        title: 'Swap Request Cancelled',
        message: `${otherPartyName} has cancelled the swap request for "${showDeleteDialog.property_title}"`,
        link: '/MySwaps',
        related_id: showDeleteDialog.id,
        sender_name: otherPartyName,
        sender_email: user?.email
      });

      await api.entities.SwapRequest.delete(showDeleteDialog.id);
      queryClient.invalidateQueries(['my-swaps']);
      toast.success('Swap request deleted');
    } catch (error) {
      if (error.message?.includes('not found')) {
        toast.info('This request has already been cancelled');
        queryClient.invalidateQueries(['my-swaps']);
      } else {
        toast.error('Failed to delete swap request');
      }
    } finally {
      setShowDeleteDialog(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Structural Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-unswap-blue-deep/20" />
                <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[10px]">Operations</p>
              </div>
              <h1 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">My <span className="italic font-serif">Swaps</span></h1>
              <p className="text-slate-500 text-sm font-light">Manage and track your swap requests</p>
            </div>
            <Button onClick={handleNewSwapRequest} className="bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl">
              <Plus className="w-4 h-4 mr-2" />
              New Swap Request
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation - Prestigious Architectural Style */}
          <aside className="lg:w-80 shrink-0">
            <nav className="flex flex-col gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'incoming', label: 'Incoming', icon: ArrowLeftRight, badge: incomingRequests.filter(r => r.status === 'pending').length },
                { id: 'outgoing', label: 'Outgoing', icon: ArrowLeftRight },
                { id: 'upcoming', label: 'Upcoming', icon: CalendarDays },
                { id: 'video-calls', label: 'Video Calls', icon: Video },
                { id: 'completed', label: 'History', icon: History }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between w-full px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border-l-2 ${activeTab === item.id
                    ? 'bg-white border-unswap-blue-deep text-unswap-blue-deep shadow-lg shadow-unswap-blue-deep/5'
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-unswap-blue-deep' : 'text-slate-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-unswap-blue-deep text-white text-[9px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-12"
                >
                  {/* Stats Grid - High Contrast Architectural */}
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Pending', value: swapRequests.filter(r => r.status === 'pending').length, icon: Clock },
                      { label: 'Approved', value: swapRequests.filter(r => r.status === 'approved').length, icon: CheckCircle },
                      { label: 'Completed', value: swapRequests.filter(r => r.status === 'completed').length, icon: History },
                      { label: 'Total', value: swapRequests.length, icon: LayoutDashboard },
                    ].map((stat, index) => (
                      <Card key={index} className="rounded-none border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 border-l-4 border-l-unswap-blue-deep/5 hover:border-l-unswap-blue-deep">
                        <CardContent className="p-8 flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center transition-all duration-500 group-hover:bg-unswap-blue-deep group-hover:text-white">
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-extralight text-slate-900 tracking-tighter leading-none">{stat.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-white p-12 border border-slate-100 rounded-none border-l-4 border-l-unswap-blue-deep">
                    <h3 className="text-xl font-light tracking-tight text-slate-900 mb-4 italic font-serif">Overview</h3>
                    <p className="text-slate-500 text-sm font-light leading-relaxed max-w-2xl">
                      Manage your swap requests and track their status. Use the sidebar to navigate through your incoming, outgoing, and upcoming swaps.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'incoming' && (
                <motion.div
                  key="incoming"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {incomingRequests.filter(r => r.status !== 'completed').length === 0 ? (
                    <EmptyState message="No incoming swap requests yet" />
                  ) : (
                    incomingRequests
                      .filter(r => r.status !== 'completed')
                      .map(request => (
                        <SwapRequestCard
                          key={request.id}
                          request={request} isIncoming user={user}
                          onApprove={handleApprove} onReject={setSelectedRequest}
                          onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                          onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                          onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                          onDelete={handleDelete}
                        />
                      ))
                  )}
                </motion.div>
              )}

              {activeTab === 'outgoing' && (
                <motion.div
                  key="outgoing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {outgoingRequests.filter(r => r.status !== 'completed').length === 0 ? (
                    <EmptyState message="You haven't requested any swaps yet" onCreateNew={handleNewSwapRequest} />
                  ) : (
                    outgoingRequests
                      .filter(r => r.status !== 'completed')
                      .map(request => (
                        <SwapRequestCard
                          key={request.id}
                          request={request} isIncoming={false} user={user}
                          onApprove={handleApprove} onReject={setSelectedRequest}
                          onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                          onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                          onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                          onDelete={handleDelete}
                        />
                      ))
                  )}
                </motion.div>
              )}

              {activeTab === 'upcoming' && (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {swapRequests.filter(r => r.status === 'approved' && new Date(r.check_in) > new Date()).length === 0 ? (
                    <EmptyState message="No upcoming swaps scheduled" onCreateNew={handleNewSwapRequest} />
                  ) : (
                    swapRequests
                      .filter(r => r.status === 'approved' && new Date(r.check_in) > new Date())
                      .map(request => (
                        <SwapRequestCard
                          key={request.id}
                          request={request} isIncoming={request.host_email === user?.email} user={user}
                          onApprove={handleApprove} onReject={setSelectedRequest}
                          onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                          onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                          onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                          onDelete={handleDelete}
                        />
                      ))
                  )}
                </motion.div>
              )}

              {activeTab === 'video-calls' && (
                <motion.div
                  key="video-calls"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {videoCalls.length === 0 ? (
                    <EmptyState message="No scheduled video calls yet" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {videoCalls.map(call => (
                        <ScheduledCallCard
                          key={call.id} videoCall={call} user={user}
                          onJoinCall={() => setActiveVideoCall(call)}
                          onEdit={setEditVideoCall} onDelete={setDeleteVideoCall}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {swapRequests.filter(r => r.status === 'completed').length === 0 ? (
                    <EmptyState message="No completed swaps yet" />
                  ) : (
                    swapRequests
                      .filter(r => r.status === 'completed')
                      .map(request => (
                        <SwapRequestCard
                          key={request.id}
                          request={request} isIncoming={request.host_email === user?.email} user={user}
                          onApprove={handleApprove} onReject={setSelectedRequest}
                          onCounterPropose={setShowCounterDialog} onScheduleVideo={setShowVideoScheduler}
                          onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                          onFinalizeSwap={setShowFinalizeDialog} onLeaveReview={setShowReviewDialog}
                          onDelete={handleDelete}
                        />
                      ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Video Call Scheduler Dialog - Architectural refinement */}
      <Dialog open={!!showVideoScheduler} onOpenChange={() => setShowVideoScheduler(null)}>
        <DialogContent className="max-w-2xl rounded-none border-0 shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b bg-slate-50">
            <DialogTitle className="text-2xl font-extralight tracking-tight text-slate-900">Schedule Video Call</DialogTitle>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Video Call Verification</p>
          </div>
          <div className="p-8">
            {showVideoScheduler && (
              <VideoCallScheduler
                swapRequest={showVideoScheduler} user={user}
                onScheduled={handleVideoCallScheduled} isOptional={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog - High Contrast */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="rounded-none border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b bg-rose-50/30">
            <DialogTitle className="text-2xl font-extralight tracking-tight text-slate-900 flex items-center gap-4">
              <XCircle className="w-6 h-6 text-red-500" />
              Decline Swap Request
            </DialogTitle>
          </div>
          <div className="p-8">
            <p className="text-slate-500 font-light mb-6 tracking-tight leading-relaxed">Please provide a reason for declining this request.</p>
            <Textarea
              placeholder="Reason for decline (Optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[120px] bg-slate-50/30 border-slate-200 focus-visible:ring-red-500 rounded-none font-light italic"
            />
            <div className="mt-8 flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="rounded-none font-bold text-[10px] uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-widest shadow-xl">Confirm Decline</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messaging Sheet - Architectural Precision */}
      <Sheet open={!!showMessaging} onOpenChange={() => setShowMessaging(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 border-l border-slate-200 shadow-2xl rounded-none">
          {showMessaging && (
            <SwapMessaging swapRequest={showMessaging} user={user} onClose={() => setShowMessaging(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="rounded-none border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extralight tracking-tight text-red-600">Delete Request</DialogTitle>
          </DialogHeader>
          <div className="py-8">
            <p className="text-slate-500 font-light tracking-tight leading-relaxed">Are you sure you want to delete this swap request? This action cannot be undone.</p>
            {showDeleteDialog && (
              <div className="mt-6 p-6 bg-slate-50 border border-slate-100 rounded-none border-l-4 border-l-red-400">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">{showDeleteDialog.property_title}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {showDeleteDialog.check_in && format(new Date(showDeleteDialog.check_in), 'MMM d')} -
                  {showDeleteDialog.check_out && format(new Date(showDeleteDialog.check_out), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)} className="rounded-none font-bold text-[10px] uppercase tracking-widest border-slate-200">Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-widest shadow-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeVideoCall && <VideoCallRoom videoCall={activeVideoCall} user={user} onCallEnd={() => { setActiveVideoCall(null); queryClient.invalidateQueries(['video-calls']); }} />}
      <CreateSwapRequestDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} user={user} isVerified={isVerified} />
      <VerificationRequiredDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog} action="send swap requests" />
      <CounterProposalDialog open={!!showCounterDialog} onOpenChange={() => setShowCounterDialog(null)} request={showCounterDialog} user={user} />
      <CompleteSwapDialog open={!!showCompleteDialog} onOpenChange={() => setShowCompleteDialog(null)} request={showCompleteDialog} user={user} />
      <Dialog open={!!showReviewDialog} onOpenChange={() => setShowReviewDialog(null)}>
        <DialogContent className="max-w-2xl rounded-none border-0 shadow-2xl p-0 overflow-hidden">
          <div className="p-8 border-b bg-slate-50">
            <DialogTitle className="text-2xl font-extralight tracking-tight text-slate-900">Review</DialogTitle>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Leave a Review</p>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {showReviewDialog && <ReviewForm swapRequest={showReviewDialog} onSuccess={() => setShowReviewDialog(null)} />}
          </div>
        </DialogContent>
      </Dialog>
      {showFinalizeDialog && <FinalizeSwapDialog open={!!showFinalizeDialog} onOpenChange={() => setShowFinalizeDialog(null)} swapRequest={showFinalizeDialog} user={user} property={properties.find(p => p.id === showFinalizeDialog.property_id)} />}
      {showGuestApprovalDialog && <GuestFinalizeApprovalDialog open={!!showGuestApprovalDialog} onOpenChange={() => setShowGuestApprovalDialog(null)} swapRequest={showGuestApprovalDialog} user={user} />}
    </div>
  );
}

function EmptyState({ message, onCreateNew }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white rounded-none border border-slate-100 shadow-sm border-2 border-dashed">
      <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center mx-auto mb-8">
        <ArrowLeftRight className="w-8 h-8 text-slate-200" />
      </div>
      <h3 className="text-2xl font-light text-slate-900 tracking-tight mb-2">No Active Records</h3>
      <p className="text-slate-500 font-light text-sm mb-10 max-w-sm mx-auto">{message}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center px-8">
        {onCreateNew && (
          <Button onClick={onCreateNew} className="bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-14 px-10 text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all">
            <Plus className="w-4 h-4 mr-2.5" />
            New Swap Request
          </Button>
        )}
        <Link to={createPageUrl('FindProperties')}>
          <Button variant="outline" className="rounded-none border-slate-200 h-14 px-10 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
            Explore Properties
            <ChevronRight className="w-4 h-4 ml-2.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}