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
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'swap_pending':
      case 'swap_approved':
      case 'swap_rejected':
      case 'swap_counter':
        return <ArrowLeftRight className="w-5 h-5 text-purple-500" />;
      case 'property_match':
        return <Home className="w-5 h-5 text-emerald-500" />;
      case 'system':
        return <Shield className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Please Log In</h1>
          <p className="text-slate-600 mb-4">You need to be logged in to view notifications.</p>
          <Button onClick={() => api.auth.redirectToLogin()}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-slate-600 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-600">You'll see notifications here when you get new activity</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.is_read ? 'bg-white' : 'bg-slate-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                          {!notification.is_read && (
                            <Badge className="bg-blue-500 text-white text-xs px-2">New</Badge>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{format(new Date(notification.created_date), 'MMM d, yyyy • h:mm a')}</span>
                          {notification.sender_name && (
                            <span>From: {notification.sender_name}</span>
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
                        className="flex-shrink-0 text-slate-400 hover:text-red-600"
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

      {/* Delete Single Notification Dialog */}
      <AlertDialog open={!!deleteNotificationId} onOpenChange={() => setDeleteNotificationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteNotificationMutation.mutate(deleteNotificationId);
                setDeleteNotificationId(null);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Notifications Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllNotificationsMutation.mutate()}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}