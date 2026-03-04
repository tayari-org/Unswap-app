import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Globe, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleReset(e) {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Missing reset token. Please check your email link.');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.auth.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. The link may be expired.');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-white">
                <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-sm max-w-md w-full">
                    <CardContent className="pt-10 pb-10 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Password Reset Successful</h2>
                        <p className="text-slate-400 mb-6">Your password has been updated. Redirecting you to login...</p>
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 hover:bg-indigo-500"
                        >
                            Log In Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">UNswap</span>
                    </div>
                </div>

                <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Security</span>
                        </div>
                        <CardTitle className="text-white text-xl">Create New Password</CardTitle>
                        <CardDescription className="text-slate-400">
                            Please enter and confirm your new password below.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">New Password</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Confirm New Password</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                />
                            </div>

                            {error && (
                                <Alert className="bg-red-950/50 border-red-800 text-red-300">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                {loading ? 'Updating…' : 'Update Password'}
                            </Button>

                            {!token && (
                                <p className="text-xs text-red-400 text-center">
                                    Invalid reset link. Please request a new one from the login page.
                                </p>
                            )}
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Back to Login
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
