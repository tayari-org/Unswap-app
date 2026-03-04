import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, MessageSquare, ArrowLeftRight, Home, CheckCircle, XCircle,
  RefreshCw, X, Check, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const notificationIcons = {
  message: MessageSquare,
  swap_pending: ArrowLeftRight,
  swap_approved: CheckCircle,
  swap_rejected: XCircle,
  swap_counter: RefreshCw,
  property_match: Home,
  video_call: Bell,
  system: Bell,
};

const notificationColors = {
  message: 'bg-blue-100 text-blue-600',
  swap_pending: 'bg-amber-100 text-amber-600',
  swap_approved: 'bg-emerald-100 text-emerald-600',
  swap_rejected: 'bg-red-100 text-red-600',
  swap_counter: 'bg-indigo-100 text-indigo-600',
  property_match: 'bg-purple-100 text-purple-600',
  video_call: 'bg-purple-100 text-purple-600',
  system: 'bg-slate-100 text-slate-600',
};

export default function NotificationCenter({ user }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => api.entities.Notification.filter(
      { user_email: user?.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        api.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setOpen(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return format(new Date(date), 'MMM d');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mb-3 text-slate-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const colorClass = notificationColors[notification.type] || notificationColors.system;

                const content = (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-slate-900 truncate`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{getTimeAgo(notification.created_date)}</p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                );

                if (notification.link) {
                  return (
                    <Link key={notification.id} to={notification.link} className="block group">
                      {content}
                    </Link>
                  );
                }

                return <div key={notification.id} className="group cursor-pointer">{content}</div>;
              })}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-slate-200 text-center">
            <Link 
              to={createPageUrl('Notifications')} 
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}