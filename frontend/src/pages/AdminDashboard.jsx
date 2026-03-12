import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users, Home, ArrowLeftRight, Shield, TrendingUp, Eye, CheckCircle,
  XCircle, Clock, Search, Filter, MoreVertical, UserCheck, AlertTriangle, Star, Flag, FileText, Trash2, Rocket,
  LayoutDashboard, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ReviewList from '../components/reviews/ReviewList';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [deleteUserDialog, setDeleteUserDialog] = useState(null);

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => api.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.entities.User.list('-created_date', 100),
    enabled: currentUser?.role === 'admin',
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['all-properties'],
    queryFn: () => api.entities.Property.list('-created_date', 100),
    enabled: currentUser?.role === 'admin',
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ['all-verifications'],
    queryFn: () => api.entities.Verification.list('-created_date', 100),
    enabled: currentUser?.role === 'admin',
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['all-swaps'],
    queryFn: () => api.entities.SwapRequest.list('-created_date', 100),
    enabled: currentUser?.role === 'admin',
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => api.entities.Review.list('-created_date', 100),
    enabled: currentUser?.role === 'admin',
  });

  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => api.entities.PlatformSettings.list(),
    enabled: currentUser?.role === 'admin',
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User updated');
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Verification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-verifications']);
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-properties']);
      toast.success('Property updated');
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Review.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-reviews']);
      toast.success('Review updated');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userEmail) => {
      const response = await api.functions.invoke('deleteUserAndData', { user_email: userEmail });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      queryClient.invalidateQueries(['all-properties']);
      queryClient.invalidateQueries(['all-swaps']);
      toast.success('User and all associated data deleted');
      setDeleteUserDialog(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const launchPlatformMutation = useMutation({
    mutationFn: async () => {
      const settings = platformSettings[0];
      if (settings) {
        return api.entities.PlatformSettings.update(settings.id, {
          platform_status: 'launched',
          last_updated: new Date().toISOString(),
          updated_by: currentUser?.email
        });
      } else {
        return api.entities.PlatformSettings.create({
          platform_status: 'launched',
          last_updated: new Date().toISOString(),
          updated_by: currentUser?.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platform-settings']);
      toast.success('🚀 Platform launched successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to launch platform');
    },
  });

  // Stats
  const stats = {
    totalUsers: users.length,
    verifiedUsers: users.filter(u => u.verification_status === 'verified').length,
    totalProperties: properties.length,
    activeProperties: properties.filter(p => p.status === 'active').length,
    totalSwaps: swapRequests.length,
    completedSwaps: swapRequests.filter(s => s.status === 'completed').length,
    pendingVerifications: verifications.filter(v => v.status === 'pending').length,
    totalReviews: reviews.length,
    flaggedReviews: reviews.filter(r => r.status === 'flagged').length,
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesVerification = verificationFilter === 'all' || user.verification_status === verificationFilter;
    return matchesSearch && matchesRole && matchesVerification;
  });

  const pendingVerifications = verifications.filter(v => v.status === 'pending');

  const handleVerificationReview = async (status) => {
    if (!selectedVerification) return;

    await updateVerificationMutation.mutateAsync({
      id: selectedVerification.id,
      data: {
        status,
        reviewer_notes: reviewNotes,
        reviewed_by: currentUser?.email,
        reviewed_at: new Date().toISOString(),
      }
    });

    // Update user verification status
    const userToUpdate = users.find(u => u.email === selectedVerification.user_email);
    if (userToUpdate) {
      await updateUserMutation.mutateAsync({
        id: userToUpdate.id,
        data: { verification_status: status === 'approved' ? 'verified' : 'rejected' }
      });
    }

    // Send notification email to user
    const emailSubject = status === 'approved'
      ? 'UNswap - Verification Approved! 🎉'
      : 'UNswap - Verification Update';

    const emailBody = status === 'approved'
      ? `
        <h2>Congratulations! Your verification has been approved</h2>
        <p>Hello ${selectedVerification.user_name},</p>
        <p>Your UNswap account has been successfully verified. You now have full access to all platform features.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;"><strong>What's next?</strong></p>
          <ul style="margin: 8px 0 0 0; color: #065f46;">
            <li>Your profile now displays a verified badge</li>
            <li>You can send and receive swap requests</li>
            <li>You have access to the full property catalog</li>
          </ul>
        </div>
        <p><a href="${window.location.origin}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Swapping</a></p>
        <p>Welcome to the UNswap community!</p>
        <br/>
        <p>Best regards,<br/>The UNswap Team</p>
      `
      : `
        <h2>Verification Update</h2>
        <p>Hello ${selectedVerification.user_name},</p>
        <p>We've reviewed your verification submission. Unfortunately, we need additional information or documentation.</p>
        ${reviewNotes ? `
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reviewer Notes:</strong></p>
            <p style="margin: 8px 0 0 0; color: #991b1b;">${reviewNotes}</p>
          </div>
        ` : ''}
        <p>Please log in to your account and submit updated documents.</p>
        <p><a href="${window.location.origin}/Settings" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Verification</a></p>
        <br/>
        <p>Best regards,<br/>The UNswap Team</p>
      `;

    await api.integrations.Core.SendEmail({
      to: selectedVerification.user_email,
      subject: emailSubject,
      body: status === 'approved' ? 'Your verification has been approved.' : 'Your verification needs attention.',
      html: emailBody
    });

    // Create in-app notification
    await api.entities.Notification.create({
      user_email: selectedVerification.user_email,
      type: 'system',
      title: status === 'approved' ? 'Verification Approved!' : 'Verification Update',
      message: status === 'approved'
        ? 'Your account has been verified. You now have full access to all features.'
        : 'Your verification needs additional information. Please check your email.',
      link: '/Settings',
      is_read: false
    });

    setSelectedVerification(null);
    setReviewNotes('');
    toast.success(`Verification ${status} - User notified`);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'users', label: 'Users', icon: Users,
      count: users.length,
    },
    {
      id: 'verifications', label: 'Verifications', icon: Shield,
      count: stats.pendingVerifications > 0 ? stats.pendingVerifications : 0,
      countColor: 'bg-amber-500',
    },
    { id: 'properties', label: 'Properties', icon: Home },
    {
      id: 'reviews', label: 'Reviews', icon: Star,
      count: stats.flaggedReviews > 0 ? stats.flaggedReviews : 0,
      countColor: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#FDF8F4]">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden lg:flex w-60 flex-col bg-unswap-blue-deep border-r border-[#001733] shadow-2xl z-20">
        {/* Sidebar Header / Brand */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Admin Panel</h1>
          <Badge variant="outline" className={`mt-2 flex items-center gap-1.5 px-2.5 py-0.5 w-fit rounded-full text-[9px] border-amber-500/50 bg-amber-500/20 text-amber-500`}>
             <span className={`w-1.5 h-1.5 rounded-full bg-amber-500`} />
             ADMINISTRATOR
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          <div className="px-3 pt-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Menu</span>
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
                <span className={`flex-1 text-[13px] tracking-wide ${activeTab === item.id ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                {item.count > 0 && (
                  <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${activeTab === item.id ? 'bg-white text-unswap-blue-deep' : 'bg-white/10 text-white'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Sign Out at bottom */}
        <div className="px-3 pb-6 mt-auto border-t border-white/10 pt-4 space-y-2">
            <div className="px-3 flex items-center gap-3 mb-4">
              {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                    {(currentUser?.full_name || currentUser?.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-white truncate">
                    {currentUser?.full_name || currentUser?.email?.split('@')[0] || '—'}
                  </p>
                  <p className="text-[10px] font-medium text-white/40 truncate">
                    {currentUser?.email || '—'}
                  </p>
                </div>
            </div>

          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="w-full justify-start text-white/50 hover:text-red-300 hover:bg-white/5 transition-all font-semibold text-[11px] tracking-wide gap-2 h-9 rounded-sm">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER (shown only on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-stone-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-unswap-blue-deep font-display">Admin Panel</h1>
          <Button variant="ghost" size="sm" onClick={() => api.auth.logout()} className="text-stone-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest">
            <LogOut className="w-3 h-3 mr-1.5" />
            Sign Out
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap rounded-sm transition-all ${activeTab === item.id
                ? 'bg-unswap-blue-deep text-white'
                : 'text-stone-500 hover:bg-stone-100'
                }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              {item.count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === item.id ? 'bg-white/20' : 'bg-stone-200'}`}>{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

       {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto lg:pt-0 pt-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-light text-slate-900 tracking-tight">
                Admin <span className="font-medium">Dashboard</span>
              </h2>
              <p className="text-stone-500 text-sm mt-1">Manage users, properties, and verifications</p>
            </div>
            <div className="flex items-center gap-3">
              {platformSettings[0]?.platform_status === 'pre_launch' && (
                <Button
                  onClick={() => launchPlatformMutation.mutate()}
                  disabled={launchPlatformMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  {launchPlatformMutation.isPending ? 'Launching...' : 'Launch Now'}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, sub: `${stats.verifiedUsers} verified`, icon: Users, color: 'bg-blue-500' },
              { label: 'Properties', value: stats.totalProperties, sub: `${stats.activeProperties} active`, icon: Home, color: 'bg-emerald-500' },
              { label: 'Swaps', value: stats.totalSwaps, sub: `${stats.completedSwaps} completed`, icon: ArrowLeftRight, color: 'bg-purple-500' },
              { label: 'Pending Reviews', value: stats.pendingVerifications, sub: 'verifications', icon: Shield, color: 'bg-amber-500' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-stone-500">{stat.label}</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        <p className="text-sm text-stone-500">{stat.sub}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-8">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Users */}
                <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.slice(0, 5).map(user => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <Users className="w-5 h-5 text-stone-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{user.full_name}</p>
                              <p className="text-sm text-stone-500">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Verifications */}
                <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingVerifications.length === 0 ? (
                      <p className="text-stone-500 text-center py-8">No pending verifications</p>
                    ) : (
                      <div className="space-y-4">
                        {pendingVerifications.slice(0, 5).map(verification => (
                          <div key={verification.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900">{verification.user_name}</p>
                              <p className="text-sm text-stone-500">{verification.verification_type}</p>
                            </div>
                            <Button size="sm" onClick={() => setSelectedVerification(verification)}>
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <CardTitle>User Management</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                          placeholder="Search users..."
                          className="pl-9 w-64"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Verification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="unverified">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users className="w-4 h-4 text-stone-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-stone-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.organization || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              user.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                user.verification_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                  'bg-stone-100 text-slate-700'
                            }>
                              {user.verification_status || 'unverified'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.guest_points || 500}</TableCell>
                          <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: user.id,
                                    data: { role: user.role === 'admin' ? 'user' : 'admin' }
                                  })}
                                >
                                  {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: user.id,
                                    data: { verification_status: 'verified' }
                                  })}
                                >
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Verify User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteUserDialog(user)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle>Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verifications.map(verification => (
                        <TableRow key={verification.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{verification.user_name}</p>
                              <p className="text-sm text-stone-500">{verification.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{verification.verification_type}</TableCell>
                          <TableCell>{verification.organization || '-'}</TableCell>
                          <TableCell>
                            <Badge className={
                              verification.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                verification.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                            }>
                              {verification.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(verification.created_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {verification.status === 'pending' && (
                              <Button size="sm" onClick={() => setSelectedVerification(verification)}>
                                Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader>
                  <CardTitle>Property Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map(property => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-200">
                                {property.images?.[0] && (
                                  <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{property.title}</p>
                                <p className="text-sm text-stone-500">{property.property_type}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{property.owner_email}</TableCell>
                          <TableCell>{property.location}</TableCell>
                          <TableCell>
                            <Badge className={
                              property.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                property.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                                  'bg-stone-100 text-slate-700'
                            }>
                              {property.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{property.nightly_points || 200}</TableCell>
                          <TableCell>{property.views_count || 0}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => updatePropertyMutation.mutate({
                                    id: property.id,
                                    data: { is_verified: !property.is_verified }
                                  })}
                                >
                                  {property.is_verified ? 'Remove Verification' : 'Verify Property'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updatePropertyMutation.mutate({
                                    id: property.id,
                                    data: { is_featured: !property.is_featured }
                                  })}
                                >
                                  {property.is_featured ? 'Remove Featured' : 'Make Featured'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <Card className="bg-white border border-stone-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Review Moderation</CardTitle>
                    <div className="flex gap-2 text-sm">
                      <Badge variant="outline">
                        Total: {stats.totalReviews}
                      </Badge>
                      {stats.flaggedReviews > 0 && (
                        <Badge className="bg-red-100 text-red-700">
                          <Flag className="w-3 h-3 mr-1" />
                          Flagged: {stats.flaggedReviews}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReviewList showModeration={true} />
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </main>

      {/* Verification Review Dialog */}
      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
            <DialogDescription>Review the submitted documentation and approve or reject verification.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 min-h-0">
            {selectedVerification && (
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-stone-500">User</Label>
                    <p className="font-medium">{selectedVerification.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500">Email</Label>
                    <p className="font-medium">{selectedVerification.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500">Type</Label>
                    <p className="font-medium">{selectedVerification.verification_type}</p>
                  </div>
                  <div>
                    <Label className="text-stone-500">Organization</Label>
                    <p className="font-medium">{selectedVerification.organization || '-'}</p>
                  </div>
                </div>

                {selectedVerification.document_url && (
                  <div>
                    <Label className="text-stone-500 block mb-2">Uploaded Document</Label>
                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                      {selectedVerification.document_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={selectedVerification.document_url}
                          alt="Verification document"
                          className="w-full h-auto max-h-96 object-contain bg-stone-50"
                        />
                      ) : (
                        <div className="p-8 text-center bg-stone-50">
                          <FileText className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 mb-3">PDF Document</p>
                        </div>
                      )}
                    </div>
                    <a
                      href={selectedVerification.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Open in new tab →
                    </a>
                  </div>
                )}

                <div>
                  <Label>Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes for this verification..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedVerification(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-600"
              onClick={() => handleVerificationReview('rejected')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={() => handleVerificationReview('approved')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUserDialog} onOpenChange={() => setDeleteUserDialog(null)}>
        <DialogContent className="flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Delete User and All Data</DialogTitle>
            <DialogDescription>Permanently remove this user and all their associated records from the system.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 py-4 px-1">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action is irreversible!</p>
              <p className="text-sm text-red-700">
                This will permanently delete the user and ALL associated data including:
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>User account and profile</li>
                <li>All properties and listings</li>
                <li>All swap requests and history</li>
                <li>All messages and conversations</li>
                <li>All reviews and ratings</li>
                <li>All notifications and settings</li>
              </ul>
            </div>
            {deleteUserDialog && (
              <div className="p-3 bg-stone-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900">{deleteUserDialog.full_name}</p>
                <p className="text-sm text-stone-500">{deleteUserDialog.email}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialog(null)}>Cancel</Button>
            <Button
              onClick={() => deleteUserDialog && deleteUserMutation.mutate(deleteUserDialog.email)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User & All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}