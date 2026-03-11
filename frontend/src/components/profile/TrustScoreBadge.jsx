import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Shield, Star, ArrowLeftRight, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function TrustScoreBadge({ user }) {
    const { data: swaps = [] } = useQuery({
        queryKey: ['trust-swaps', user?.email],
        queryFn: () => api.entities.SwapRequest.filter({
            $or: [{ requester_email: user?.email }, { host_email: user?.email }]
        }),
        enabled: !!user?.email,
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['trust-reviews', user?.email],
        queryFn: () => api.entities.Review.filter({ target_email: user?.email, status: 'approved' }),
        enabled: !!user?.email,
    });

    const verificationScore = user?.verification_status === 'verified' ? 40 : 0;
    const completedSwaps = swaps.filter(s => s.status === 'completed').length;
    const swapScore = Math.min(completedSwaps * 3, 30);
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    const reviewScore = Math.round(avgRating * 4);
    const responseScore = swaps.length > 0 ? 10 : 0;

    const totalScore = verificationScore + swapScore + reviewScore + responseScore;

    const getScoreLabel = (score) => {
        if (score >= 80) return { label: 'Elite', color: 'text-emerald-600', bg: 'bg-emerald-50' };
        if (score >= 60) return { label: 'Trusted', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (score >= 40) return { label: 'Active', color: 'text-amber-600', bg: 'bg-amber-50' };
        return { label: 'Beginner', color: 'text-slate-600', bg: 'bg-slate-50' };
    };

    const { label, color, bg } = getScoreLabel(totalScore);

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader>
                <CardTitle>Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`flex items-center gap-6 p-6 rounded-xl ${bg} mb-6`}>
                    <div className="text-center">
                        <div className={`text-5xl font-bold ${color}`}>{totalScore}</div>
                        <div className={`text-sm font-semibold ${color} mt-1`}>{label}</div>
                    </div>
                    <div className="flex-1">
                        <Progress value={totalScore} className="h-3 mb-2" />
                        <p className="text-sm text-slate-500">Out of 100 possible points</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Verification', score: verificationScore, max: 40, icon: Shield, color: 'text-emerald-600' },
                        { label: 'Completed Swaps', score: swapScore, max: 30, icon: ArrowLeftRight, color: 'text-blue-600' },
                        { label: 'Guest Reviews', score: reviewScore, max: 20, icon: Star, color: 'text-amber-600' },
                        { label: 'Response Rate', score: responseScore, max: 10, icon: MessageSquare, color: 'text-purple-600' },
                    ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-xl font-bold ${item.color}`}>{item.score}</span>
                                <span className="text-xs text-slate-400">/ {item.max}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
