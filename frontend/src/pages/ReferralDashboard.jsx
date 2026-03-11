import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Users, Copy, Check, Share2, Award, Shield,
    ChevronRight, Star, Camera, PartyPopper
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralDashboard() {
    const [copied, setCopied] = useState(false);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['referral-stats'],
        queryFn: () => api.referrals.getStats(),
    });

    const { data: colleagues = [] } = useQuery({
        queryKey: ['referral-colleagues'],
        queryFn: () => api.referrals.getColleagues(),
    });

    const copyToClipboard = () => {
        if (!stats?.referral_link) return;
        navigator.clipboard.writeText(stats.referral_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const milestones = [
        {
            id: 'observer',
            name: 'The Observer',
            requirement: 1,
            reward: 'Unlock Sneak Peek Directory',
            icon: Shield,
            isUnlocked: stats?.verified_referrals_count >= 1
        },
        {
            id: 'delegate',
            name: 'The Delegate',
            requirement: 5,
            reward: 'Founders\' Lifetime Waiver ($500/yr saved)',
            icon: Award,
            isUnlocked: stats?.verified_referrals_count >= 5
        },
        {
            id: 'ambassador',
            name: 'The Ambassador',
            requirement: 10,
            reward: 'Professional Property Photography',
            icon: Camera,
            isUnlocked: stats?.verified_referrals_count >= 10
        },
        {
            id: 'founder',
            name: 'Founder\'s Circle',
            requirement: 20,
            reward: 'Private Dinner & Priority Booking',
            icon: Star,
            isUnlocked: stats?.verified_referrals_count >= 20
        },
    ];

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* 1. HERO SECTION */}
            <div className="bg-[#1E293B] pt-16 pb-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <Badge className="bg-unswap-blue-deep/20 text-blue-300 border-unswap-blue-deep/30 mb-6 uppercase tracking-[0.3em] px-4 py-1 rounded-none">
                        Referral Program
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-extralight text-white tracking-tighter mb-6">
                        The Founders' <span className="text-blue-300 italic font-serif">Lifetime Waiver</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                        Invite 5 verified colleagues to the Unswap waitlist and permanently waive your annual membership fees for life.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-12 space-y-8">
                {/* 2. REFERRAL LINK CARD */}
                <Card className="border-unswap-border shadow-2xl rounded-none overflow-hidden bg-white">
                    <CardContent className="p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-unswap-blue-deep mb-2">Your Referral Link</h3>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tight">Share Unswap with Colleagues</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            readOnly
                                            value={stats?.referral_link}
                                            className="bg-slate-50 border-unswap-border h-14 pl-4 pr-12 font-mono text-sm text-slate-600 rounded-none"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-unswap-blue-deep transition-colors"
                                        >
                                            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <Button size="icon" className="h-14 w-14 rounded-none bg-unswap-blue-deep hover:bg-slate-800 shrink-0">
                                        <Share2 className="w-5 h-5" />
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    Verified referrals from UN, IMF, World Bank, and Diplomatic Corps only.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-none p-8 border border-unswap-border flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-white rounded-none shadow-sm border border-unswap-border flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-unswap-blue-deep" />
                                </div>
                                <span className="text-5xl font-extralight tracking-tighter text-slate-900 italic font-serif">
                                    {stats?.verified_referrals_count}
                                </span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Verified Colleagues</p>
                                <div className="w-full mt-6 space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Milestone: {milestones.find(m => !m.isUnlocked)?.requirement || stats?.verified_referrals_count}</span>
                                        <span>{Math.round((stats?.verified_referrals_count / (milestones.find(m => !m.isUnlocked)?.requirement || stats?.verified_referrals_count)) * 100)}%</span>
                                    </div>
                                    <Progress value={(stats?.verified_referrals_count / (milestones.find(m => !m.isUnlocked)?.requirement || 20)) * 100} className="h-2 bg-slate-200" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. MILESTONE Tiers */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {milestones.map((m) => (
                        <Card key={m.id} className={`border-unswap-border rounded-none overflow-hidden transition-all duration-500 ${m.isUnlocked ? 'bg-unswap-blue-deep text-white border-unswap-blue-deep shadow-2xl' : 'bg-white hover:border-slate-300 shadow-sm'}`}>
                            <CardContent className="p-6 space-y-4">
                                <div className={`w-12 h-12 rounded-none flex items-center justify-center ${m.isUnlocked ? 'bg-white/20' : 'bg-slate-50 text-slate-400 border border-unswap-border'}`}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <Badge variant="outline" className={`mb-2 font-black text-[8px] uppercase tracking-widest rounded-none ${m.isUnlocked ? 'border-white/30 text-white' : 'text-slate-400 border-unswap-border'}`}>
                                        {m.requirement} {m.requirement === 1 ? 'Referral' : 'Referrals'}
                                    </Badge>
                                    <h4 className="font-bold text-lg leading-tight">{m.name}</h4>
                                    <p className={`text-xs mt-2 font-medium leading-relaxed ${m.isUnlocked ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {m.reward}
                                    </p>
                                </div>
                                {m.isUnlocked && (
                                    <div className="flex items-center gap-2 pt-2 text-[9px] font-black uppercase tracking-widest text-white/80">
                                        <PartyPopper className="w-3 h-3" /> Activated
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 4. REFERRED COLLEAGUES TABLE */}
                <Card className="border-unswap-border shadow-sm rounded-none overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 px-8 py-6">
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Referred Colleagues</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {colleagues.length === 0 ? (
                            <div className="text-center py-16 text-slate-300">
                                <p className="font-bold text-[10px] uppercase tracking-widest">No colleagues referred yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {colleagues.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between px-8 py-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-none flex items-center justify-center ${c.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-unswap-border'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="font-mono text-sm text-slate-600 uppercase italic font-medium">{c.email_masked}</span>
                                        </div>
                                        <Badge variant="outline" className={`capitalize font-black text-[9px] tracking-widest rounded-none ${c.status === 'verified' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                            c.status === 'registered' ? 'text-unswap-blue-deep border-blue-100 bg-blue-50' :
                                                'text-slate-400'
                                            }`}>
                                            {c.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
