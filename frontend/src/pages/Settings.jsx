import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Shield, Bell, Users, Camera, LogOut,
  Check, AlertCircle, Loader2, ChevronRight, Mail, Globe, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import EmailOtpVerification from '../components/verification/EmailOtpVerification';
import DocumentUploadVerification from '../components/verification/DocumentUploadVerification';
import NotificationPreferences from '../components/notifications/NotificationPreferences';

const ORGANIZATIONS = [
  'United Nations Secretariat', 'UNDP', 'UNICEF', 'WHO', 'WFP', 'UNHCR',
  'FAO', 'UNESCO', 'ILO', 'World Bank', 'IMF', 'IAEA', 'WIPO', 'Other'
];

const DUTY_STATIONS = [
  "UNHQ New York", "UNOG Geneva", "UNON Nairobi", "UNOV Vienna",
  "ESCAP Bangkok", "ECA Addis Ababa", "ECLAC Santiago", "ESCWA Beirut",
  "World Bank DC", "IMF DC", "WHO Geneva", "UNICEF New York", "Other"
];

const STAFF_GRADES = [
  "G-1", "G-2", "G-3", "G-4", "G-5", "G-6", "G-7",
  "P-1", "P-2", "P-3", "P-4", "P-5",
  "D-1", "D-2", "ASG", "USG"
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    phone: '',
    bio: '',
    organization: '',
    staff_grade: '',
    duty_station: '',
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const isAuth = await api.auth.isAuthenticated();
      if (!isAuth) return null;
      return api.auth.me();
    },
  });

  const { data: verification } = useQuery({
    queryKey: ['my-verification', user?.email],
    queryFn: () => api.entities.Verification.filter({ user_email: user?.email }, '-created_date', 1),
    enabled: !!user?.email,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => api.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Profile updated successfully');
    },
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user?.username || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        organization: user?.organization || '',
        staff_grade: user?.staff_grade || '',
        duty_station: user?.duty_station || '',
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => updateUserMutation.mutate(profileData);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      await updateUserMutation.mutateAsync({ avatar_url: file_url });
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${user?.referral_code || user?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Referral link copied!');
  };

  const navItems = [
    { id: 'profile', label: 'Public Profile', icon: User, desc: 'Personal info & bio' },
    { id: 'verification', label: 'Verification', icon: Shield, desc: 'Identity & documents' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & emails' },
  ];

  const statusColors = {
    unverified: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    verified: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">Settings</h1>
            <Badge variant="outline" className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${statusColors[user?.verification_status || 'unverified']}`}>
              <span className={`w-1.5 h-1.5 rounded-full fill-current ${user?.verification_status === 'verified' ? 'bg-blue-500' : 'bg-amber-500'}`} />
              {user?.verification_status?.toUpperCase() || 'UNVERIFIED'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="text-slate-500 hover:text-unswap-blue-deep transition-all font-bold uppercase tracking-widest text-[10px]">
            <LogOut className="w-3 h-3 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">

          {/* SIDEBAR NAVIGATION - Updated active state to Blue */}
          <aside className="w-full md:w-52 flex-shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex items-start gap-4 p-4 transition-all text-left border-l-2 ${activeTab === item.id
                    ? 'bg-slate-50 border-unswap-blue-deep text-unswap-blue-deep shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                    }`}
                >
                  <div className={`p-2 rounded-none transition-all ${activeTab === item.id ? 'bg-unswap-blue-deep text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                    <span className="text-[9px] font-medium opacity-50 uppercase tracking-widest">{item.desc}</span>
                  </div>
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 min-w-0">
            <Tabs value={activeTab} className="mt-0">

              {/* PROFILE TAB */}
              <TabsContent value="profile" className="m-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Public Profile</h2>
                  </div>

                  <Card className="overflow-hidden border-slate-200 rounded-none shadow-2xl">
                    <div className="h-32 bg-gradient-to-r from-unswap-blue-deep to-unswap-blue-prussian relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent)]" />
                    </div>

                    <CardContent className="relative pb-8 px-6">
                      <div className="relative -top-12 mb-[-32px] flex flex-col sm:flex-row items-end gap-4">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden bg-slate-100 shadow-md">
                            {user?.avatar_url ? (
                              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <User className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-blue-900/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                          </label>
                        </div>
                        <div className="pb-2">
                          <h3 className="text-2xl font-light text-slate-900 tracking-tight leading-tight">{user?.full_name}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            <Mail className="w-3 h-3 text-unswap-blue-deep/40" /> {user?.email}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 mt-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" className="focus-visible:ring-blue-500" value={profileData.username} onChange={(e) => handleProfileChange('username', e.target.value)} placeholder="@username" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" className="focus-visible:ring-blue-500" value={profileData.phone} onChange={(e) => handleProfileChange('phone', e.target.value)} placeholder="+1..." />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea id="bio" className="focus-visible:ring-blue-500" value={profileData.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} placeholder="Short professional summary..." rows={4} />
                        </div>

                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-none space-y-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-unswap-blue-deep">Organization Details</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Organization</Label>
                              <Select value={profileData.organization} onValueChange={(v) => handleProfileChange('organization', v)}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                  {ORGANIZATIONS.map(org => <SelectItem key={org} value={org}>{org}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Duty Station</Label>
                              <Select value={profileData.duty_station} onValueChange={(v) => handleProfileChange('duty_station', v)}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                  {DUTY_STATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Staff Grade</Label>
                            <Select value={profileData.staff_grade} onValueChange={(v) => handleProfileChange('staff_grade', v)}>
                              <SelectTrigger className="bg-white"><SelectValue placeholder="Select grade..." /></SelectTrigger>
                              <SelectContent>
                                {STAFF_GRADES.map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Primary Blue CTA */}
                    <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end">
                      <Button onClick={saveProfile} disabled={updateUserMutation.isPending} className="bg-unswap-blue-deep text-white rounded-none h-14 px-10 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-xl">
                        {updateUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* VERIFICATION TAB */}
              <TabsContent value="verification" className="m-0 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Verification Status</h2>
                  </div>

                  <Card className="bg-white border-slate-200 rounded-none shadow-xl overflow-hidden group">
                    <CardContent className="p-8 relative">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Shield className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-8 relative z-10">
                        <div className={`w-20 h-20 rounded-none flex items-center justify-center border transition-all duration-700 group-hover:scale-110 shadow-lg ${user?.verification_status === 'verified' ? 'bg-emerald-50 border-emerald-100' :
                          user?.verification_status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                          }`}>
                          {user?.verification_status === 'verified' ? <Check className="w-8 h-8 text-emerald-600" /> :
                            user?.verification_status === 'pending' ? <Loader2 className="w-8 h-8 text-amber-600 animate-spin" /> :
                              <Shield className="w-8 h-8 text-slate-300" />}
                        </div>
                        <div>
                          <h4 className="text-2xl font-light text-slate-900 tracking-tight mb-2">
                            {user?.verification_status === 'verified' ? 'Verified' :
                              user?.verification_status === 'pending' ? 'Pending' : 'Unverified'}
                          </h4>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6">
                    <EmailOtpVerification user={user} onVerified={() => queryClient.invalidateQueries(['current-user'])} />
                    <DocumentUploadVerification user={user} emailVerified={user?.institutional_email_verified} existingVerification={verification?.[0]} />
                  </div>
                </div>
              </TabsContent>

              {/* NOTIFICATIONS TAB */}
              <TabsContent value="notifications" className="m-0">
                <NotificationPreferences user={user} />
              </TabsContent>


            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}