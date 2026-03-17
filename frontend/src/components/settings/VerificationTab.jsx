import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Shield, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmailOtpVerification from '../verification/EmailOtpVerification';
import DocumentUploadVerification from '../verification/DocumentUploadVerification';

export default function VerificationTab({ user }) {
    const queryClient = useQueryClient();
    const [emailJustVerified, setEmailJustVerified] = useState(false);

    const { data: verification } = useQuery({
        queryKey: ['my-verification', user?.email],
        queryFn: () => api.entities.Verification.filter({ user_email: user?.email }, '-created_date', 1),
        enabled: !!user?.email,
    });

    const verificationStatusColors = {
        unverified: 'bg-slate-100 text-slate-700',
        pending: 'bg-amber-100 text-amber-700',
        verified: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">
            {/* Current Status */}
            <Card className="border-0 shadow-sm">
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
                <EmailOtpVerification
                    user={user}
                    onVerified={() => {
                        setEmailJustVerified(true);
                        queryClient.invalidateQueries(['current-user']);
                    }}
                />
                <DocumentUploadVerification
                    user={user}
                    emailVerified={user?.institutional_email_verified || emailJustVerified}
                    existingVerification={verification?.[0]}
                />
            </div>

            {/* Benefits */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Why Verify?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Build Trust', desc: 'Verified badges increase swap acceptance rates by 80%' },
                            { title: 'Full Access', desc: 'Unlock all platform features and priority support' },
                            { title: 'Community Safety', desc: 'Help maintain our trusted diplomatic network' },
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
    );
}
