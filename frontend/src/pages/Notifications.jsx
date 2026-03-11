import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckCircle, Mail, MessageSquare, ArrowLeftRight, Home, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteNotificationId, setDeleteNotificationId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['user-notifications', user?.email],
    queryFn: () => api.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
      toast.success('Notification deleted');
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      for (const notification of notifications) {
        await api.entities.Notification.delete(notification.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
      toast.success('All notifications deleted');
      setShowDeleteAllDialog(false);
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-unswap-blue-deep" />;
      case 'swap_pending':
      case 'swap_approved':
      case 'swap_rejected':
      case 'swap_counter':
        return <ArrowLeftRight className="w-5 h-5 text-unswap-blue-deep" />;
      case 'property_match':
        return <Home className="w-5 h-5 text-unswap-blue-deep" />;
      case 'system':
        return <Shield className="w-5 h-5 text-unswap-blue-deep" />;
      default:
        return <Bell className="w-5 h-5 text-unswap-blue-deep" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-12 bg-white border border-slate-200 rounded-none shadow-2xl max-w-md">
          <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertCircle className="w-10 h-10 text-slate-200" />
          </div>
          <h1 className="text-2xl font-extralight tracking-tighter text-slate-900 mb-2">Access <span className="italic font-serif">Restricted</span></h1>
          <p className="text-slate-400 text-sm font-light uppercase tracking-widest mb-8">Please log in to view notifications</p>
          <Button onClick={() => api.auth.redirectToLogin()} className="bg-unswap-blue-deep hover:bg-slate-900 text-white rounded-none h-14 px-8 text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-xl">Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Structural Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-px bg-unswap-blue-deep/20" />
                <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[10px]">Notifications</p>
              </div>
              <h1 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Notifi<span className="italic font-serif">cations</span></h1>
              {unreadCount > 0 ? (
                <p className="text-unswap-blue-deep text-[10px] font-bold uppercase tracking-widest">{unreadCount} UNREAD ALERTS ACTIVE</p>
              ) : (
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No new notifications</p>
              )}
            </div>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllDialog(true)}
                className="rounded-none h-12 px-6 text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-rose-50 hover:text-red-600 hover:border-red-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2.5" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List - Architectural Precision */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-unswap-blue-deep/20 border-t-unswap-blue-deep rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 border-2 border-dashed border-slate-200"
          >
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Bell className="w-8 h-8 text-slate-200" />
            </div>
            <h2 className="text-2xl font-extralight text-slate-900 tracking-tight mb-2 italic font-serif">No notifications yet</h2>
            <p className="text-slate-400 text-xs font-light uppercase tracking-widest">You'll see notifications here as they arrive</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                >
                  <Card
                    className={`rounded-none border-slate-200 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer ${!notification.is_read ? 'border-l-4 border-l-unswap-blue-deep' : 'border-l-4 border-l-transparent'
                      }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="p-6 flex items-start gap-6">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-none flex items-center justify-center transition-all duration-500 ${!notification.is_read ? 'bg-unswap-blue-deep/5 border border-unswap-blue-deep/10' : 'bg-slate-50 border border-slate-100'
                        } group-hover:scale-110`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h3 className={`text-sm font-bold uppercase tracking-widest ${!notification.is_read ? 'text-slate-900' : 'text-slate-500'}`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <Badge className="bg-unswap-blue-deep/10 text-unswap-blue-deep text-[9px] font-bold rounded-none border-unswap-blue-deep/20 border uppercase tracking-widest shadow-none">New</Badge>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm font-light leading-relaxed tracking-tight mb-4">{notification.message}</p>
                        <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                          <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            {format(new Date(notification.created_date), 'MMM d, yyyy • h:mm a')}
                          </span>
                          {notification.sender_name && (
                            <span className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                              FROM: {notification.sender_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteNotificationId(notification.id);
                        }}
                        className="flex-shrink-0 h-10 w-10 p-0 rounded-none text-slate-300 hover:text-red-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Single Notification Dialog - High Contrast */}
      <AlertDialog open={!!deleteNotificationId} onOpenChange={() => setDeleteNotificationId(null)}>
        <AlertDialogContent className="rounded-none border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light tracking-tight">Remove Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-light pt-2 leading-relaxed">
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-none font-bold text-[10px] uppercase tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteNotificationMutation.mutate(deleteNotificationId);
                setDeleteNotificationId(null);
              }}
              className="bg-red-500 hover:bg-red-600 rounded-none font-bold text-[10px] uppercase tracking-widest text-white shadow-lg h-12 px-8"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Notifications Dialog - High Contrast */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="rounded-none border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-light tracking-tight">Clear All Notifications</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-light pt-2 leading-relaxed">
              Are you sure you want to delete all {notifications.length} notifications? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogCancel className="rounded-none font-bold text-[10px] uppercase tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllNotificationsMutation.mutate()}
              className="bg-red-600 hover:bg-red-700 rounded-none font-bold text-[10px] uppercase tracking-widest text-white shadow-lg h-12 px-8"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}