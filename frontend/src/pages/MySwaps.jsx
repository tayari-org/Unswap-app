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
  const [activeTab, setActiveTab] = useState('incoming');
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
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* UNSwap Branded Header */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#009EDB]/10 p-2 rounded-lg">
              <Globe className="w-6 h-6 text-[#009EDB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Swaps</h1>
              <p className="text-slate-500 text-sm">Coordinate your global mission mobility</p>
            </div>
          </div>
          <Button 
            onClick={handleNewSwapRequest}
            className="bg-[#009EDB] hover:bg-[#007bb1] text-white shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Swap Request
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Grid - Updated with UN Blue and Teal */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', value: swapRequests.filter(r => r.status === 'pending').length, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
            { label: 'Approved', value: swapRequests.filter(r => r.status === 'approved').length, color: 'text-teal-600', bg: 'bg-teal-50', icon: CheckCircle },
            { label: 'Completed', value: swapRequests.filter(r => r.status === 'completed').length, color: 'text-[#009EDB]', bg: 'bg-blue-50', icon: History },
            { label: 'Total Swaps', value: swapRequests.length, color: 'text-slate-600', bg: 'bg-slate-50', icon: LayoutDashboard },
          ].map((stat, index) => (
            <Card key={index} className="border-none shadow-sm hover:shadow-md transition-all border-b-2 border-transparent hover:border-[#009EDB]">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-full flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-200/50 p-1 mb-8 w-full sm:w-auto overflow-x-auto rounded-xl border border-slate-200">
            <TabsTrigger value="incoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#009EDB] data-[state=active]:shadow-sm px-6 py-2 transition-all">
              Incoming
              {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#009EDB] text-[10px] font-bold text-white">
                  {incomingRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#009EDB] px-6 py-2">
              Outgoing
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#009EDB] px-6 py-2">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="video-calls" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#009EDB] px-6 py-2">
              <Video className="w-4 h-4 mr-2" />
              Pre-Swap Calls
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#009EDB] px-6 py-2">
              History
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="incoming" className="space-y-5 focus-visible:outline-none">
              {incomingRequests.filter(r => r.status !== 'completed').length === 0 ? (
                <EmptyState message="No incoming swap requests yet" />
              ) : (
                incomingRequests
                  .filter(r => r.status !== 'completed')
                  .map(request => (
                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <SwapRequestCard 
                        request={request} isIncoming user={user}
                        onApprove={handleApprove} onReject={setSelectedRequest}
                        onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                        onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                        onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-5 focus-visible:outline-none">
              {outgoingRequests.filter(r => r.status !== 'completed').length === 0 ? (
                <EmptyState message="You haven't requested any swaps yet" onCreateNew={handleNewSwapRequest} />
              ) : (
                outgoingRequests
                  .filter(r => r.status !== 'completed')
                  .map(request => (
                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <SwapRequestCard 
                        request={request} isIncoming={false} user={user}
                        onApprove={handleApprove} onReject={setSelectedRequest}
                        onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                        onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                        onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-5 focus-visible:outline-none">
              {swapRequests.filter(r => r.status === 'approved' && new Date(r.check_in) > new Date()).length === 0 ? (
                <EmptyState message="No upcoming swaps scheduled" onCreateNew={handleNewSwapRequest} />
              ) : (
                swapRequests
                  .filter(r => r.status === 'approved' && new Date(r.check_in) > new Date())
                  .map(request => (
                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <SwapRequestCard 
                        request={request} isIncoming={request.host_email === user?.email} user={user}
                        onApprove={handleApprove} onReject={setSelectedRequest}
                        onCounterPropose={setShowCounterDialog} onScheduleVideo={handleScheduleVideo}
                        onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                        onFinalizeSwap={setShowFinalizeDialog} onGuestApprovalNeeded={setShowGuestApprovalDialog}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="video-calls" className="space-y-5 focus-visible:outline-none">
              {videoCalls.length === 0 ? (
                <EmptyState message="No scheduled video calls yet" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoCalls.map(call => (
                    <ScheduledCallCard 
                      key={call.id} videoCall={call} user={user}
                      onJoinCall={() => setActiveVideoCall(call)}
                      onEdit={setEditVideoCall} onDelete={setDeleteVideoCall}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-5 focus-visible:outline-none">
              {swapRequests.filter(r => r.status === 'completed').length === 0 ? (
                <EmptyState message="No completed swaps yet" />
              ) : (
                swapRequests
                  .filter(r => r.status === 'completed')
                  .map(request => (
                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <SwapRequestCard 
                        request={request} isIncoming={request.host_email === user?.email} user={user}
                        onApprove={handleApprove} onReject={setSelectedRequest}
                        onCounterPropose={setShowCounterDialog} onScheduleVideo={setShowVideoScheduler}
                        onMessage={setShowMessaging} onCompleteSwap={setShowCompleteDialog}
                        onFinalizeSwap={setShowFinalizeDialog} onLeaveReview={setShowReviewDialog}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Video Call Scheduler Dialog */}
      <Dialog open={!!showVideoScheduler} onOpenChange={() => setShowVideoScheduler(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Schedule Meet & Greet Call (Optional)</DialogTitle>
          </DialogHeader>
          {showVideoScheduler && (
            <VideoCallScheduler 
              swapRequest={showVideoScheduler} user={user}
              onScheduled={handleVideoCallScheduled} isOptional={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="rounded-2xl border-t-4 border-t-red-500">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Decline Swap Request
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-slate-500 mb-4">Are you sure you want to decline this swap request?</p>
            <Textarea
              placeholder="Optional: Add a reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] bg-slate-50 border-slate-200 focus:ring-red-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">Confirm Decline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messaging Sheet */}
      <Sheet open={!!showMessaging} onOpenChange={() => setShowMessaging(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-slate-200 shadow-2xl">
          {showMessaging && (
            <SwapMessaging swapRequest={showMessaging} user={user} onClose={() => setShowMessaging(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Swap Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">This action cannot be undone. Are you sure you want to delete this request?</p>
            {showDeleteDialog && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-bold text-red-900">{showDeleteDialog.property_title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-red-700 opacity-80">
                  <CalendarDays className="w-3 h-3" />
                  {showDeleteDialog.check_in && format(new Date(showDeleteDialog.check_in), 'MMM d')} - 
                  {showDeleteDialog.check_out && format(new Date(showDeleteDialog.check_out), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>Cancel</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeVideoCall && <VideoCallRoom videoCall={activeVideoCall} user={user} onCallEnd={() => { setActiveVideoCall(null); queryClient.invalidateQueries(['video-calls']); }} />}
      <CreateSwapRequestDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} user={user} isVerified={isVerified} />
      <VerificationRequiredDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog} action="send swap requests" />
      <CounterProposalDialog open={!!showCounterDialog} onOpenChange={() => setShowCounterDialog(null)} request={showCounterDialog} user={user} />
      <CompleteSwapDialog open={!!showCompleteDialog} onOpenChange={() => setShowCompleteDialog(null)} request={showCompleteDialog} user={user} />
      <Dialog open={!!showReviewDialog} onOpenChange={() => setShowReviewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-xl font-bold">Leave a Review</DialogTitle></DialogHeader>
          {showReviewDialog && <ReviewForm swapRequest={showReviewDialog} onSuccess={() => setShowReviewDialog(null)} />}
        </DialogContent>
      </Dialog>
      {showFinalizeDialog && <FinalizeSwapDialog open={!!showFinalizeDialog} onOpenChange={() => setShowFinalizeDialog(null)} swapRequest={showFinalizeDialog} user={user} property={properties.find(p => p.id === showFinalizeDialog.property_id)} />}
      {showGuestApprovalDialog && <GuestFinalizeApprovalDialog open={!!showGuestApprovalDialog} onOpenChange={() => setShowGuestApprovalDialog(null)} swapRequest={showGuestApprovalDialog} user={user} />}
    </div>
  );
}

function EmptyState({ message, onCreateNew }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ArrowLeftRight className="w-10 h-10 text-[#009EDB]/40" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No active missions found</h3>
      <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto leading-relaxed">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
        {onCreateNew && (
          <Button onClick={onCreateNew} className="bg-[#009EDB] hover:bg-[#007bb1] text-white px-8">
            <Plus className="w-4 h-4 mr-2" />
            Start a Request
          </Button>
        )}
        <Link to={createPageUrl('FindProperties')}>
          <Button variant="outline" className="w-full sm:w-auto border-slate-200 hover:bg-slate-50">
            Explore Duty Stations
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}