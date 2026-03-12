import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
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
  
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return api.functions.invoke('deleteUserAndData', { user_email: user?.email });
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      api.auth.logout();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete account');
    }
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
    { id: 'security', label: 'Account Security', icon: Shield, desc: 'Password & Privacy' },
  ];

  const statusColors = {
    unverified: 'bg-slate-100 text-slate-600 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    verified: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">

      {/* FULL-HEIGHT SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-unswap-blue-deep sticky top-0 h-screen overflow-y-auto">

        {/* Sidebar Header / Brand */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Settings</h1>
          <Badge variant="outline" className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 w-fit rounded-full text-[9px] border-white/20 bg-white/10 text-white/80`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user?.verification_status === 'verified' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {user?.verification_status?.toUpperCase() || 'UNVERIFIED'}
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {/* Category Header */}
          <div className="px-3 pt-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Account</span>
          </div>

          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 transition-all text-left rounded-sm border-l-[3px] ${activeTab === item.id
                  ? 'border-unswap-silver-light bg-white/10 text-white'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${activeTab === item.id ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
                <span className={`text-[13px] tracking-wide ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Sign Out at bottom */}
        <div className="px-3 pb-6 mt-auto border-t border-white/10 pt-4">
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="w-full justify-start text-white/50 hover:text-red-300 hover:bg-white/5 transition-all font-semibold text-[11px] tracking-wide gap-2 h-9 rounded-sm">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER (shown only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-unswap-blue-deep font-display">Settings</h1>
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest">
            <LogOut className="w-3 h-3 mr-1.5" />
            Sign Out
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-sm transition-all ${activeTab === item.id
                ? 'bg-unswap-blue-deep text-white'
                : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto md:pt-0 pt-28">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
          <Tabs value={activeTab} className="mt-0">

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="m-0 focus-visible:outline-none">
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Public Profile</h2>
                </div>

                <Card className="overflow-hidden border-stone-200 rounded-none shadow-2xl bg-white">
                  <div className="h-32 bg-gradient-to-r from-unswap-blue-deep to-unswap-blue-prussian relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent)]" />
                  </div>

                  <CardContent className="relative pb-8 px-6">
                    <div className="relative -top-12 mb-[-32px] flex flex-col sm:flex-row items-end gap-4">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl border-4 border-white overflow-hidden bg-stone-100 shadow-md">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
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
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400">
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

                      <div className="p-8 bg-stone-50 border border-stone-100 rounded-none space-y-6">
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
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end">
                    {updateUserMutation.isSuccess && (
                      <div className="mr-6 text-emerald-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" />
                        Changes Saved
                      </div>
                    )}
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

                <Card className="bg-white border-stone-200 rounded-none shadow-xl overflow-hidden group">
                  <CardContent className="p-8 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Shield className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-8 relative z-10">
                      <div className={`w-20 h-20 rounded-none flex items-center justify-center border transition-all duration-700 group-hover:scale-110 shadow-lg ${user?.verification_status === 'verified' ? 'bg-emerald-50 border-emerald-100' :
                        user?.verification_status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-stone-50 border-stone-100'
                        }`}>
                        {user?.verification_status === 'verified' ? <Check className="w-8 h-8 text-emerald-600" /> :
                          user?.verification_status === 'pending' ? <Loader2 className="w-8 h-8 text-amber-600 animate-spin" /> :
                            <Shield className="w-8 h-8 text-stone-300" />}
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

            {/* SECURITY TAB */}
            <TabsContent value="security" className="m-0">
              <div className="space-y-6">
                 <div>
                   <h2 className="text-4xl font-extralight tracking-tighter text-slate-900 mb-2">Account Security</h2>
                   <p className="text-slate-500 text-sm">Manage your password and account privacy.</p>
                 </div>

                 <Card className="bg-white border-stone-200 rounded-none shadow-xl">
                   <CardHeader>
                     <CardTitle className="text-lg font-light">Password</CardTitle>
                     <CardDescription>Update your account password regularly to stay secure.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Password management is currently handled via your institutional SSO or forgot password flow.</p>
                     <Button variant="outline" className="border-slate-200 rounded-none h-11 text-[9px] font-bold uppercase tracking-widest" onClick={() => api.auth.forgotPassword(user?.email)}>
                       Request Password Reset Link
                     </Button>
                   </CardContent>
                 </Card>

                 <Card className="border-red-100 bg-red-50/30 rounded-none shadow-sm">
                   <CardHeader>
                     <CardTitle className="text-lg font-light text-red-900">Danger Zone</CardTitle>
                     <CardDescription className="text-red-700/70">Permanently delete your account and all associated data.</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="p-4 bg-red-50 border border-red-100 rounded-none mb-6">
                       <p className="text-[11px] font-medium text-red-800 leading-relaxed">
                         Deleting your account is irreversible. All your listings, swaps, ratings, and GuestPoints will be permanently removed from our servers.
                       </p>
                     </div>
                     <Button 
                       variant="destructive" 
                       className="rounded-none h-12 px-8 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-red-200"
                       onClick={() => setDeleteDialogOpen(true)}
                     >
                       Delete Account
                     </Button>
                   </CardContent>
                 </Card>
              </div>

              {/* Delete Confirmation Dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white rounded-none border-stone-200 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-light tracking-tight text-red-900">Are you absolutely sure?</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm mt-4">
                      This action cannot be undone. This will permanently delete your account
                      and remove your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type your email to confirm: <span className="text-slate-900">{user?.email}</span></Label>
                       <Input 
                         value={deleteConfirmation} 
                         onChange={(e) => setDeleteConfirmation(e.target.value)}
                         placeholder={user?.email}
                         className="rounded-none border-slate-200 focus:ring-red-500"
                       />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" className="rounded-none uppercase text-[10px] font-bold tracking-widest" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="rounded-none uppercase text-[10px] font-bold tracking-widest px-8"
                      disabled={deleteConfirmation !== user?.email || deleteAccountMutation.isPending}
                      onClick={() => deleteAccountMutation.mutate()}
                    >
                      {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>


          </Tabs>
        </div>
      </main>
    </div>
  );
}