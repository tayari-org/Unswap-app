import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Bell, Mail, MessageSquare, ArrowLeftRight, Home, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function NotificationPreferences({ user }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    email_new_message: true,
    in_app_new_message: true,
    email_swap_request: true,
    in_app_swap_request: true,
    email_property_update: true,
    in_app_property_update: true,
    email_verification_status: true,
    in_app_verification_status: true,
  });

  useEffect(() => {
    if (user?.notification_preferences) {
      try {
        const prefs = typeof user.notification_preferences === 'string' 
          ? JSON.parse(user.notification_preferences) 
          : user.notification_preferences;
        
        // Merge with defaults to ensure all keys exist
        setSettings(prev => ({ ...prev, ...prefs }));
      } catch (e) {
        console.warn('Failed to parse notification preferences', e);
      }
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings) => api.auth.updateMe({ notification_preferences: newSettings }),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Notification preferences updated');
    },
  });

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const notificationTypes = [
    {
      title: 'Messages',
      description: 'Notifications about new direct messages',
      icon: MessageSquare,
      emailKey: 'email_new_message',
      inAppKey: 'in_app_new_message'
    },
    {
      title: 'Swap Requests',
      description: 'Notifications about swap requests and updates',
      icon: ArrowLeftRight,
      emailKey: 'email_swap_request',
      inAppKey: 'in_app_swap_request'
    },
    {
      title: 'Property Updates',
      description: 'Notifications about your listed properties',
      icon: Home,
      emailKey: 'email_property_update',
      inAppKey: 'in_app_property_update'
    },
    {
      title: 'Verification Status',
      description: 'Updates about your account verification',
      icon: Shield,
      emailKey: 'email_verification_status',
      inAppKey: 'in_app_verification_status'
    }
  ];

  return (
    <Card className="rounded-none border-stone-200 shadow-xl overflow-hidden group bg-white">
      <CardHeader className="p-8 border-b border-stone-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-px bg-unswap-blue-deep/20" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep">Notification Preferences</span>
        </CardTitle>
        <CardDescription className="text-[10px] uppercase tracking-widest text-stone-400 mt-2 ml-11">
          Manage how you receive updates and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map((type, index) => (
          <div key={index}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-start gap-6 mb-6">
              <div className="w-12 h-12 bg-stone-50 border border-stone-100 rounded-none flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-unswap-blue-deep group-hover:text-white group-hover:border-unswap-blue-deep group-hover:shadow-lg">
                <type.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-light text-slate-900 tracking-tight mb-1 uppercase">{type.title}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{type.description}</p>
              </div>
            </div>

            <div className="ml-18 space-y-4">
              <div className="flex items-center justify-between p-4 bg-stone-50/50 border border-transparent hover:border-stone-100 hover:bg-white transition-all">
                <div className="flex items-center gap-3">
                  <Mail className="w-3.5 h-3.5 text-stone-300" />
                  <Label htmlFor={`${type.emailKey}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer">Email notifications</Label>
                </div>
                <Switch
                  id={`${type.emailKey}`}
                  checked={settings[type.emailKey]}
                  onCheckedChange={() => handleToggle(type.emailKey)}
                  className="data-[state=checked]:bg-unswap-blue-deep"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50/50 border border-transparent hover:border-stone-100 hover:bg-white transition-all">
                <div className="flex items-center gap-3">
                  <Bell className="w-3.5 h-3.5 text-stone-300" />
                  <Label htmlFor={`${type.inAppKey}`} className="text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer">In-app notifications</Label>
                </div>
                <Switch
                  id={`${type.inAppKey}`}
                  checked={settings[type.inAppKey]}
                  onCheckedChange={() => handleToggle(type.inAppKey)}
                  className="data-[state=checked]:bg-unswap-blue-deep"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}