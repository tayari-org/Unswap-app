import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, CreditCard, Users, Link as LinkIcon,
  Upload, Check, AlertCircle, Loader2, Camera, Copy, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [verificationFile, setVerificationFile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
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

  const createVerificationMutation = useMutation({
    mutationFn: (data) => api.entities.Verification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-verification']);
      toast.success('Verification submitted for review');
    },
  });

  const [profileData, setProfileData] = useState({
    username: '',
    phone: '',
    bio: '',
    organization: '',
    staff_grade: '',
    duty_station: '',
  });

  React.useEffect(() => {
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

  const saveProfile = () => {
    updateUserMutation.mutate(profileData);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    await updateUserMutation.mutateAsync({ avatar_url: file_url });
    setUploading(false);
  };

  const handleVerificationSubmit = async (type) => {
    if (type === 'document' && !verificationFile) {
      toast.error('Please upload a document');
      return;
    }

    let documentUrl = null;
    if (verificationFile) {
      const { file_url } = await api.integrations.Core.UploadFile({ file: verificationFile });
      documentUrl = file_url;
    }

    await createVerificationMutation.mutateAsync({
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.full_name,
      verification_type: type === 'domain' ? 'domain_auto' : 'document_manual',
      document_url: documentUrl,
      organization: profileData.organization,
      staff_grade: profileData.staff_grade,
      duty_station: profileData.duty_station,
      status: 'pending',
    });

    await updateUserMutation.mutateAsync({ verification_status: 'pending' });
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${user?.referral_code || user?.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  const verificationStatusColors = {
    unverified: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-slate-200 p-1 mb-8">
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="verification" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="referrals" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Avatar Section */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-amber-600 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {user?.username || user?.full_name}
                  </h3>
                  <p className="text-slate-500 text-sm">{user?.email}</p>
                  <Badge className={`mt-3 ${verificationStatusColors[user?.verification_status || 'unverified']}`}>
                    {user?.verification_status === 'verified' ? 'verified' :
                      user?.verification_status === 'pending' ? 'pending approval' :
                        user?.verification_status || 'unverified'}
                  </Badge>
                </CardContent>
              </Card>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={profileData.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                        placeholder="Your display name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        placeholder="Tell colleagues about yourself..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Organization</Label>
                        <Select value={profileData.organization} onValueChange={(v) => handleProfileChange('organization', v)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORGANIZATIONS.map(org => (
                              <SelectItem key={org} value={org}>{org}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Staff Grade</Label>
                        <Input
                          value={profileData.staff_grade}
                          onChange={(e) => handleProfileChange('staff_grade', e.target.value)}
                          placeholder="e.g., P-4, G-7"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Current Duty Station</Label>
                      <Select value={profileData.duty_station} onValueChange={(v) => handleProfileChange('duty_station', v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select duty station" />
                        </SelectTrigger>
                        <SelectContent>
                          {DUTY_STATIONS.map(station => (
                            <SelectItem key={station} value={station}>{station}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={saveProfile} className="bg-amber-500 hover:bg-amber-600" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <div className="space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user?.verification_status === 'verified' ? 'bg-emerald-100' :
                      user?.verification_status === 'pending' ? 'bg-amber-100' : 'bg-slate-100'
                      }`}>
                      {user?.verification_status === 'verified' ? (
                        <Check className="w-6 h-6 text-emerald-600" />
                      ) : user?.verification_status === 'pending' ? (
                        <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                      ) : (
                        <Shield className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {user?.verification_status === 'verified' ? 'Verified Member' :
                          user?.verification_status === 'pending' ? 'Verification Pending' : 'Not Yet Verified'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {user?.verification_status === 'verified'
                          ? 'Your identity has been confirmed'
                          : user?.verification_status === 'pending'
                            ? 'Your documents are being reviewed'
                            : 'Complete the steps below to verify your identity'}
                      </p>
                    </div>
                    <Badge className={verificationStatusColors[user?.verification_status || 'unverified']}>
                      {user?.verification_status || 'unverified'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Steps */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Step 1: Email OTP */}
                <EmailOtpVerification
                  user={user}
                  onVerified={() => queryClient.invalidateQueries(['current-user'])}
                />

                {/* Step 2: Document Upload */}
                <DocumentUploadVerification
                  user={user}
                  emailVerified={user?.institutional_email_verified}
                  existingVerification={verification?.[0]}
                />
              </div>

              {/* Verification Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Verify?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { title: 'Build Trust', desc: 'Verified badges increase swap acceptance rates by 80%' },
                      { title: 'Full Access', desc: 'Unlock all platform features and priority support' },
                      { title: 'Community Safety', desc: 'Help maintain our trusted diplomatic network' }
                    ].map((benefit, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900 mb-1">{benefit.title}</h4>
                        <p className="text-sm text-slate-600">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationPreferences user={user} />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Program</CardTitle>
                  <CardDescription>Invite colleagues and earn rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      {user?.referral_count || 0} Referrals
                    </h3>
                    <p className="text-slate-600">
                      Invite 5 colleagues for a lifetime fee waiver!
                    </p>
                  </div>

                  <div>
                    <Label>Your Referral Link</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        readOnly
                        value={`${window.location.origin}?ref=${user?.referral_code || user?.id}`}
                        className="bg-slate-50"
                      />
                      <Button onClick={copyReferralLink} variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { referrals: 1, reward: '100 bonus GuestPoints' },
                      { referrals: 3, reward: '500 bonus GuestPoints' },
                      { referrals: 5, reward: 'Lifetime fee waiver' },
                      { referrals: 10, reward: 'VIP status + 1000 points' },
                    ].map((tier, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-xl ${(user?.referral_count || 0) >= tier.referrals
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {(user?.referral_count || 0) >= tier.referrals ? (
                            <Check className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                          <span className="font-medium">{tier.referrals} referrals</span>
                        </div>
                        <span className="text-sm text-slate-600">{tier.reward}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Logout */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => api.auth.logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}