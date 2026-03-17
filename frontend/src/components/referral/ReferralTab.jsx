import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Copy, Gift, Crown, Medal, Star, Check, Trophy, Coins, Infinity, Zap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const TIERS = [
    { count: 1, label: '1,000 GuestPoints', desc: 'Awarded per verified referral', icon: Coins, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    { count: 3, label: '500 Bonus Points', desc: 'Bonus for 3 verified referrals', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { count: 5, label: 'Lifetime Fee Waiver', desc: 'Never pay subscription fees again', icon: Infinity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { count: 10, label: 'VIP Status', desc: 'Priority support + exclusive perks', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
];

const rankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
    return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
};

export default function ReferralTab({ user }) {
    const [copied, setCopied] = useState(false);

    const { data: referralStats } = useQuery({
        queryKey: ['referral-stats', user?.email],
        queryFn: () => api.referrals.getStats(),
        enabled: !!user?.email,
    });

    const referralCode = referralStats?.referral_code || user?.referral_code || ('UNSWAP' + (user?.id?.slice(0, 6) || '').toUpperCase());
    const referralLink = referralStats?.referral_link || `${window.location.origin}/login?ref=${referralCode}`;
    const verifiedCount = referralStats?.verified_referrals_count ?? user?.referred_users_verified_count ?? 0;
    const totalPoints = user?.referral_earnings || 0;
    const hasLifetimeWaiver = user?.subscription_status === 'lifetime_waiver' || referralStats?.is_lifetime_waiver;
    const isVIP = user?.is_founders_circle || false;

    const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
        queryKey: ['referral-leaderboard'],
        queryFn: () => api.referrals.getLeaderboard(),
        enabled: !!user,
    });

    const { data: myReferrals = [] } = useQuery({
        queryKey: ['my-referrals', user?.email],
        queryFn: () => api.referrals.getColleagues(),
        enabled: !!user?.email,
    });

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success('Referral link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const top5 = leaderboardData?.top5 || [];
    const myRank = leaderboardData?.currentUser;
    const nextTier = TIERS.find(t => verifiedCount < t.count);
    const nextTierProgress = nextTier ? Math.min((verifiedCount / nextTier.count) * 100, 100) : 100;

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            {(hasLifetimeWaiver || isVIP) && (
                <div className={`rounded-xl p-4 flex items-center gap-4 ${isVIP ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'}`}>
                    <Crown className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">{isVIP ? '🎉 VIP Member' : '🎉 Lifetime Waiver Active'}</p>
                        <p className="text-sm opacity-90">{isVIP ? 'You have VIP status with priority support and exclusive perks' : 'You have lifetime access — no subscription fees ever!'}</p>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 text-center border border-slate-200">
                    <p className="text-3xl font-bold text-slate-900">{verifiedCount}</p>
                    <p className="text-xs text-slate-500 mt-1">Verified Referrals</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 text-center border border-amber-200">
                    <p className="text-3xl font-bold text-amber-600">{totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Points Earned</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 text-center border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">#{myRank?.rank || '—'}</p>
                    <p className="text-xs text-slate-500 mt-1">Your Rank</p>
                </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <nextTier.icon className={`w-4 h-4 ${nextTier.color}`} />
                                <span className="font-medium text-sm text-slate-900">Next Reward: {nextTier.label}</span>
                            </div>
                            <span className="text-sm text-slate-500">{verifiedCount}/{nextTier.count}</span>
                        </div>
                        <Progress value={nextTierProgress} className="h-2 bg-slate-100" />
                        <p className="text-xs text-slate-400 mt-1">
                            {nextTier.count - verifiedCount} more verified referral{nextTier.count - verifiedCount !== 1 ? 's' : ''} to unlock
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Referral Link */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Your Referral Link</CardTitle>
                    <CardDescription>Share this link with colleagues to earn rewards</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input readOnly value={referralLink} className="font-mono text-sm bg-slate-50" />
                        <Button onClick={copyLink} variant="outline" className="flex-shrink-0">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Code: <span className="font-mono font-bold text-slate-600">{referralCode}</span></p>
                </CardContent>
            </Card>

            {/* Reward Tiers */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-500" /> Reward Tiers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {TIERS.map((tier) => {
                            const unlocked = verifiedCount >= tier.count;
                            return (
                                <div key={tier.count} className={`flex items-center gap-4 p-3 rounded-xl border ${unlocked ? `${tier.bg} ${tier.border}` : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unlocked ? tier.bg : 'bg-slate-100'}`}>
                                        <tier.icon className={`w-5 h-5 ${unlocked ? tier.color : 'text-slate-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold text-sm ${unlocked ? 'text-slate-900' : 'text-slate-500'}`}>{tier.label}</p>
                                            {unlocked && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0">Unlocked</Badge>}
                                        </div>
                                        <p className="text-xs text-slate-400">{tier.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-bold ${unlocked ? tier.color : 'text-slate-400'}`}>
                                            {tier.count} ref{tier.count !== 1 ? 's' : ''}
                                        </span>
                                        {unlocked && <Check className="w-4 h-4 text-emerald-500 ml-auto mt-1" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
                    </CardTitle>
                    <CardDescription>Top referrers across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                    {leaderboardLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : top5.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-6">No referrals yet — be the first!</p>
                    ) : (
                        <div className="space-y-2">
                            {top5.map((entry) => {
                                const isMe = entry.email === user?.email;
                                return (
                                    <div key={entry.email} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                                        <div className="w-7 flex justify-center">{rankIcon(entry.rank)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium text-sm truncate ${isMe ? 'text-amber-700' : 'text-slate-800'}`}>
                                                {isMe ? 'You' : entry.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-amber-600">{entry.verified}</p>
                                            <p className="text-[10px] text-slate-400">verified</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Show current user's rank if not in top 5 */}
                            {myRank && !top5.find(e => e.email === user?.email) && myRank.rank > 5 && (
                                <>
                                    <div className="flex items-center justify-center py-1">
                                        <div className="h-px bg-dashed border-t border-dashed border-slate-300 flex-1" />
                                        <span className="text-xs text-slate-400 px-2">···</span>
                                        <div className="h-px bg-dashed border-t border-dashed border-slate-300 flex-1" />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                        <div className="w-7 flex justify-center">
                                            <span className="text-amber-600 font-bold text-sm">#{myRank.rank}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-amber-700">You</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-amber-600">{myRank.verified}</p>
                                            <p className="text-[10px] text-slate-400">verified</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* My Referrals History */}
            {myReferrals.length > 0 && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">My Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {myReferrals.slice(0, 10).map(r => (
                                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-sm">{r.email_masked}</p>
                                        <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <Badge className={
                                        r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                                            r.status === 'registered' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                    }>
                                        {r.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
