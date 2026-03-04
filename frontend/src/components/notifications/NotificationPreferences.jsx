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

  const { data: existingSettings } = useQuery({
    queryKey: ['notification-settings', user?.email],
    queryFn: () => api.entities.UserNotificationSettings.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (existingSettings && existingSettings.length > 0) {
      setSettings(existingSettings[0]);
    }
  }, [existingSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      if (existingSettings && existingSettings.length > 0) {
        return await api.entities.UserNotificationSettings.update(existingSettings[0].id, newSettings);
      } else {
        return await api.entities.UserNotificationSettings.create({
          user_email: user?.email,
          ...newSettings
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-settings']);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about activity on your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map((type, index) => (
          <div key={index}>
            {index > 0 && <Separator className="mb-6" />}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <type.icon className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1">{type.title}</h4>
                <p className="text-sm text-slate-500">{type.description}</p>
              </div>
            </div>
            
            <div className="ml-14 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <Label htmlFor={`${type.emailKey}`} className="text-sm">Email notifications</Label>
                </div>
                <Switch
                  id={`${type.emailKey}`}
                  checked={settings[type.emailKey]}
                  onCheckedChange={() => handleToggle(type.emailKey)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <Label htmlFor={`${type.inAppKey}`} className="text-sm">In-app notifications</Label>
                </div>
                <Switch
                  id={`${type.inAppKey}`}
                  checked={settings[type.inAppKey]}
                  onCheckedChange={() => handleToggle(type.inAppKey)}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}