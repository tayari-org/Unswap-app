import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const POINT_PACKAGES = [
    { amount: 500, price: 50, tag: 'Starter' },
    { amount: 1000, price: 90, tag: 'Most Popular', highlight: true },
    { amount: 2500, price: 200, tag: 'Best Value' },
];

export default function GuestPointsTab({ user }) {
    const [selectedPkg, setSelectedPkg] = useState(null);

    const checkoutMutation = useMutation({
        mutationFn: async (pkg) => {
            const response = await api.functions.invoke('createGuestPointsCheckoutSession', {
                points_amount: pkg.amount,
                price_usd: pkg.price,
            });
            return response.data || response;
        },
        onSuccess: (data) => {
            if (data?.url) window.location.href = data.url;
        },
        onError: (error) => {
            toast.error('Failed to initiate purchase', { description: error.message || 'Please try again later' });
            setSelectedPkg(null);
        },
    });

    const handlePurchase = (pkg) => {
        setSelectedPkg(pkg.amount);
        checkoutMutation.mutate(pkg);
    };

    const currentPoints = user?.guest_points || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-unswap-border pb-6">
                <div>
                    <h2 className="text-3xl font-extralight tracking-tighter text-slate-900 mb-2">Guest Points</h2>
                    <p className="text-slate-500 text-sm">Purchase additional points for your upcoming swaps.</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-extralight italic font-serif text-unswap-blue-deep">{currentPoints.toLocaleString()}</div>
                    <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-1">Current Balance</div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {POINT_PACKAGES.map((pkg) => {
                    const isProcessing = selectedPkg === pkg.amount && checkoutMutation.isPending;
                    return (
                        <Card key={pkg.amount} className={`relative rounded-none border ${pkg.highlight ? 'border-unswap-blue-deep shadow-xl ring-1 ring-unswap-blue-deep' : 'border-unswap-border shadow-sm'} transition-all hover:shadow-lg flex flex-col`}>
                            {pkg.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-unswap-blue-deep text-white text-[10px] font-bold px-4 py-1 rounded-none tracking-[0.2em] uppercase shadow-md whitespace-nowrap">
                                    {pkg.tag}
                                </div>
                            )}
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-3xl font-serif italic font-extralight text-slate-900">{pkg.amount.toLocaleString()}</CardTitle>
                                <CardDescription className="text-[10px] uppercase font-bold tracking-[0.2em]">Guest Points</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-1 pb-6 text-center">
                                <div className="text-2xl font-black text-slate-900 mb-6">
                                    ${pkg.price}
                                </div>
                                <div className="mt-auto">
                                    <Button
                                        disabled={checkoutMutation.isPending}
                                        onClick={() => handlePurchase(pkg)}
                                        className={`w-full h-12 text-[10px] uppercase font-bold tracking-[0.2em] rounded-none transition-all ${pkg.highlight ? 'bg-unswap-blue-deep hover:bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 hover:text-slate-900'}`}
                                    >
                                        {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Purchase'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-slate-50 border border-unswap-border p-6 mt-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Point Purchase Policy
                </h3>
                <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        Purchased points never expire as long as your account remains active.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        Points are automatically refunded according to the host's cancellation policy if a swap falls through.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        Guest Points cannot be converted back to fiat currency after purchase.
                    </li>
                </ul>
            </div>
        </div>
    );
}
