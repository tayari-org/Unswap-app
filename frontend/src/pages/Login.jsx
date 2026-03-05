import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Globe, ArrowRight, Loader2 } from 'lucide-react';

// Google Client ID — set VITE_GOOGLE_CLIENT_ID in frontend/.env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Divider between Google and email/password
function OrDivider() {
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-700" />
        </div>
    );
}

// Renders the official Google sign-in button via the GSI SDK
function GoogleButton({ onCredential, disabled }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;
        if (!window.google?.accounts?.id) return;
        if (!containerRef.current) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
                if (response.credential) onCredential(response.credential);
            },
        });

        // Clear & render the button each time the component mounts
        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
        });
    }, [onCredential]);

    if (!GOOGLE_CLIENT_ID) {
        return (
            <div className="w-full py-2 px-3 rounded-md bg-slate-800 border border-slate-600 text-slate-500 text-xs text-center">
                Google Sign-In not configured — add VITE_GOOGLE_CLIENT_ID to frontend/.env
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full flex justify-center transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        />
    );
}

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('from') || '/Dashboard';

    const [tab, setTab] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form state
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regName, setRegName] = useState('');
    const [regInstitution, setRegInstitution] = useState('');
    const [regReferral, setRegReferral] = useState('');

    // Forgot password state
    const [forgotStep, setForgotStep] = useState('email');
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.auth.login(loginEmail, loginPassword);
            navigate(returnUrl);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setError('');
        if (regPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        try {
            await api.auth.register({
                email: regEmail,
                password: regPassword,
                full_name: regName,
                institution: regInstitution || undefined,
                referred_by: regReferral || undefined,
            });
            navigate(returnUrl);
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleForgotPassword(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.auth.forgotPassword(resetEmail);
            setMessage(res.message || 'If an account exists for this email, a reset link has been sent.');
            setForgotStep('success');
        } catch (err) {
            setError(err.message || 'Failed to send reset code.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleCredential(credential) {
        setError('');
        setLoading(true);
        try {
            await api.auth.googleLogin(credential);
            navigate(returnUrl);
        } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">UNswap</span>
                    </div>
                    <p className="text-slate-400 text-sm">The Diplomatic Home Exchange Platform</p>
                </div>

                <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Secure Access</span>
                        </div>
                        <CardTitle className="text-white text-xl">
                            {tab === 'login' ? 'Welcome back' : tab === 'forgot' ? 'Reset Password' : 'Request Access'}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {tab === 'login'
                                ? 'Sign in with your Unswap credentials'
                                : tab === 'forgot'
                                    ? 'Follow the steps to reset your password'
                                    : 'Create your account — exclusive to international civil servants'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {message && (
                            <Alert className="bg-emerald-950/50 border-emerald-800 text-emerald-300 mb-4">
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(''); setMessage(''); }}>
                            <TabsList className="w-full bg-slate-800 border border-slate-700 mb-6">
                                <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">
                                    Register
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Login ── */}
                            <TabsContent value="login">
                                {/* Google button at the top */}
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Institutional Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={loginEmail}
                                            onChange={e => setLoginEmail(e.target.value)}
                                            required
                                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-slate-300">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => setTab('forgot')}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={loginPassword}
                                            onChange={e => setLoginPassword(e.target.value)}
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
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                        {loading ? 'Signing in…' : 'Sign In'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Register ── */}
                            <TabsContent value="register">
                                {/* Google button at the top */}
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Full Name</Label>
                                        <Input
                                            placeholder="Ambassador Jean Dupont"
                                            value={regName}
                                            onChange={e => setRegName(e.target.value)}
                                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Institutional Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={regEmail}
                                            onChange={e => setRegEmail(e.target.value)}
                                            required
                                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Institution</Label>
                                        <Input
                                            placeholder="United Nations, IMF, World Bank…"
                                            value={regInstitution}
                                            onChange={e => setRegInstitution(e.target.value)}
                                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Password</Label>
                                        <Input
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={regPassword}
                                            onChange={e => setRegPassword(e.target.value)}
                                            required
                                            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Referral Code <span className="text-slate-500 font-normal">(optional)</span></Label>
                                        <Input
                                            placeholder="UNSWAP-XXXXXX"
                                            value={regReferral}
                                            onChange={e => setRegReferral(e.target.value)}
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
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                        {loading ? 'Creating account…' : 'Create Account'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Forgot Password ── */}
                            <TabsContent value="forgot">
                                {forgotStep === 'success' ? (
                                    <div className="text-center py-4 space-y-4">
                                        <div className="flex justify-center">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Shield className="w-6 h-6 text-emerald-500" />
                                            </div>
                                        </div>
                                        <p className="text-slate-300 text-sm">
                                            A secure reset link has been sent to <strong>{resetEmail}</strong>. Please check your inbox and follow the instructions.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setTab('login')}
                                            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                                        >
                                            Back to Sign In
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Account Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="name@un.org"
                                                value={resetEmail}
                                                onChange={e => setResetEmail(e.target.value)}
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
                                            disabled={loading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                            Send Reset Link
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setTab('login')}
                                            className="w-full text-xs text-slate-400 hover:text-slate-300 transition-colors py-2"
                                        >
                                            Back to Sign In
                                        </button>
                                    </form>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="pt-0">
                        <p className="text-xs text-slate-500 text-center w-full">
                            Access is restricted to verified international civil servants.
                            Platform data is processed in compliance with GDPR.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
