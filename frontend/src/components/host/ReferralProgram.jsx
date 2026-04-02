import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Gift, Copy, Users, TrendingUp, CheckCircle2, Clock,
  Share2, Mail, MessageSquare, ExternalLink, Coins
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReferralProgram({ user }) {
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate referral code if user doesn't have one
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const code = `${user.full_name?.split(' ')[0]?.toUpperCase() || 'HOST'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await api.auth.updateMe({ referral_code: code });
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['current-user']);
      toast.success('Referral code generated!');
    },
  });

  // Fetch referrals made by this user
  const { data: referrals = [] } = useQuery({
    queryKey: ['my-referrals', user.email],
    queryFn: () => api.entities.Referral.filter({ referrer_email: user.email }),
  });

  const referralCode = user.referral_code || null;
  const referralLink = referralCode ? `${window.location.origin}/login?ref=${referralCode}` : '';

  const stats = {
    total: referrals.length,
    completed: referrals.filter(r => r.status === 'completed').length,
    pending: referrals.filter(r => r.status === 'pending' || r.status === 'property_listed').length,
    earnings: user.referral_earnings || 0,
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Join UNswap - Exclusive Home Exchange for International Staff');
    const body = encodeURIComponent(
      `Hi there!\n\nI've been using UNswap for home exchanges and thought you might be interested. It's a secure platform designed specifically for international civil servants.\n\nUse my referral link to get started:\n${referralLink}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const statusConfig = {
    pending: { color: 'bg-slate-100 text-slate-700', icon: Clock, label: 'Pending' },
    property_listed: { color: 'bg-blue-100 text-blue-700', icon: TrendingUp, label: 'Property Listed' },
    verified: { color: 'bg-amber-100 text-amber-700', icon: Users, label: 'Verified' },
    completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completed' },
    expired: { color: 'bg-slate-100 text-slate-500', icon: Clock, label: 'Expired' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Referral Program</h2>
        <p className="text-slate-600">
          Invite fellow international staff and earn rewards for successful referrals
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Points Earned</p>
                <p className="text-2xl font-bold text-amber-600">{stats.earnings}</p>
              </div>
              <Coins className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share your unique link and earn 1,000 GuestPoints for each successful referral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!referralCode ? (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-4">Generate your unique referral code to get started</p>
              <Button onClick={() => generateCodeMutation.mutate()} disabled={generateCodeMutation.isPending}>
                <Gift className="w-4 h-4 mr-2" />
                Generate Referral Code
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Referral Code</label>
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="bg-slate-50 font-mono font-semibold text-lg"
                  />
                  <Button variant="outline" onClick={() => copyToClipboard(referralCode, 'code')}>
                    {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Referral Link</label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="bg-slate-50 font-mono text-sm"
                  />
                  <Button variant="outline" onClick={() => copyToClipboard(referralLink, 'link')}>
                    {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={shareViaEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Share via Email
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(referralLink, 'link')}>
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {copiedLink ? 'Copied Link' : 'Copy Link'}
                </Button>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                <h4 className="font-semibold text-amber-900 mb-2">How it works:</h4>
                <ol className="space-y-1 text-sm text-amber-800">
                  <li>1. Share your referral link with colleagues</li>
                  <li>2. They sign up and list a verified property</li>
                  <li>3. You earn 1,000 GuestPoints per successful referral</li>
                  <li>4. They get a 500 point bonus too!</li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>Track your referrals and their progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map((referral) => {
                  const statusInfo = statusConfig[referral.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-slate-900">{referral.referred_name || referral.referred_email}</p>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          Referred on {format(new Date(referral.created_date), 'MMM d, yyyy')}
                        </p>
                        {referral.reward_paid && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ Earned {referral.reward_amount} GuestPoints
                          </p>
                        )}
                      </div>
                      {referral.status === 'completed' && (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {referralCode && referrals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No referrals yet</h3>
            <p className="text-slate-600 mb-4">
              Start sharing your referral link to earn rewards
            </p>
            <Button onClick={shareViaEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Invite via Email
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}