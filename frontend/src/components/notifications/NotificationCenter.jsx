import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, MessageSquare, ArrowLeftRight, Home, CheckCircle, XCircle,
  RefreshCw, X, Check, Trash2, Shield
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
  system: Shield,
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
    refetchInterval: 15000,
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

    if (minutes < 1) return 'JUST NOW';
    if (minutes < 60) return `${minutes}M AGO`;
    if (hours < 24) return `${hours}H AGO`;
    if (days < 7) return `${days}D AGO`;
    return format(new Date(date), 'MMM d').toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-none h-11 w-11 hover:bg-slate-100/50 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 rounded-none border-slate-200 shadow-2xl overflow-hidden" align="end">
        {/* Header - Institutional Style */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-px bg-unswap-blue-deep/20" />
              <p className="text-unswap-blue-deep/60 font-bold tracking-[0.4em] uppercase text-[8px]">Notifications</p>
            </div>
            <h3 className="text-2xl font-extralight uppercase tracking-tighter text-slate-900 leading-tight">Recent <span className="italic font-serif">Activity.</span></h3>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep hover:text-slate-900 transition-colors"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[250px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No active flags</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell;

                  const content = (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`flex gap-4 p-6 hover:bg-slate-50/50 transition-all cursor-pointer relative group ${!notification.is_read ? 'bg-unswap-blue-deep/[0.02] border-l-4 border-l-unswap-blue-deep' : 'border-l-4 border-l-transparent'
                        }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={`w-12 h-12 rounded-none flex items-center justify-center flex-shrink-0 transition-all duration-700 ${!notification.is_read ? 'bg-unswap-blue-deep/5 text-unswap-blue-deep border border-unswap-blue-deep/10' : 'bg-slate-50 text-slate-300 border border-slate-100'
                        } group-hover:scale-105 shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <p className={`text-[10px] font-bold uppercase tracking-[0.4em] truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-400'}`}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 flex-shrink-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs font-light text-slate-500 line-clamp-2 tracking-tight leading-relaxed mb-3">{notification.message}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em]">{getTimeAgo(notification.created_date)}</p>
                      </div>
                    </motion.div>
                  );

                  if (notification.link) {
                    return (
                      <Link key={notification.id} to={notification.link} className="block">
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notification.id}>{content}</div>;
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer - Institutional Link */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <Link
            to={createPageUrl('Notifications')}
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep hover:text-slate-900 transition-colors"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}