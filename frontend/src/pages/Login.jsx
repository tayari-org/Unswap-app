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
        <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-200" />
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
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
        });
    }, [onCredential]);

    if (!GOOGLE_CLIENT_ID) {
        return (
            <div className="w-full py-3 px-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest text-center">
                Configuration Required: missing Client ID
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full flex justify-center transition-opacity py-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
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

    // Forgot password state
    const [forgotStep, setForgotStep] = useState('email');
    const [resetEmail, setResetEmail] = useState('');
    const [message, setMessage] = useState('');

    const [refCode, setRefCode] = useState(searchParams.get('ref') || '');

    useEffect(() => {
        const ref = searchParams.get('ref');
        if (ref) setRefCode(ref);
    }, [searchParams]);

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
                referred_by: refCode || undefined,
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
            await api.auth.googleLogin(credential, refCode);
            navigate(returnUrl);
        } catch (err) {
            setError(err.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            {/* Background design elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-50/50 rounded-full blur-[100px] -ml-48 -mb-48" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-10 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 flex items-center justify-center">
                            <Globe className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tighter">UNswap</span>
                    </div>
                </div>

                <Card className="bg-white border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">Secure Access</span>
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                            {tab === 'login' ? 'Welcome back' : tab === 'forgot' ? 'Reset Password' : 'Request Access'}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">
                            {tab === 'login'
                                ? 'Sign in with your Unswap credentials'
                                : tab === 'forgot'
                                    ? 'Follow the steps to reset your password'
                                    : 'Create your account — exclusive to international civil servants'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-4">
                        {message && (
                            <Alert className="bg-emerald-50 border-emerald-100 text-emerald-700 mb-6 rounded-2xl">
                                <AlertDescription className="font-medium text-sm">{message}</AlertDescription>
                            </Alert>
                        )}

                        <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(''); setMessage(''); }}>
                            <TabsList className="w-full bg-slate-50 border border-slate-100 mb-8 p-1.5 rounded-2xl h-14">
                                <TabsTrigger value="login" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-slate-400">
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger value="register" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 text-slate-400">
                                    Register
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Login ── */}
                            <TabsContent value="login" className="space-y-6 focus-visible:outline-none">
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institutional Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={loginEmail}
                                            onChange={e => setLoginEmail(e.target.value)}
                                            required
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => setTab('forgot')}
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
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
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl border">
                                            <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                        {loading ? 'Signing in…' : 'Sign In'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Register ── */}
                            <TabsContent value="register" className="space-y-6 focus-visible:outline-none">
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                                        <Input
                                            placeholder="Ambassador Jean Dupont"
                                            value={regName}
                                            onChange={e => setRegName(e.target.value)}
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-11 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institutional Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={regEmail}
                                            onChange={e => setRegEmail(e.target.value)}
                                            required
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-11 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institution</Label>
                                        <Input
                                            placeholder="UN, IMF, World Bank…"
                                            value={regInstitution}
                                            onChange={e => setRegInstitution(e.target.value)}
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-11 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                                        <Input
                                            type="password"
                                            placeholder="Min. 8 characters"
                                            value={regPassword}
                                            onChange={e => setRegPassword(e.target.value)}
                                            required
                                            className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-11 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Referral Code <span className="text-slate-300 font-normal italic">(optional)</span></Label>
                                        <Input
                                            placeholder="UNSWAP-XXXXXX"
                                            value={refCode}
                                            onChange={e => setRefCode(e.target.value)}
                                            className={`bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-11 px-4 rounded-xl font-mono text-xs ${refCode && searchParams.get('ref') ? 'opacity-60 grayscale' : ''}`}
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl border">
                                            <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 mt-2"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                        {loading ? 'Creating account…' : 'Create Account'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Forgot Password ── */}
                            <TabsContent value="forgot" className="focus-visible:outline-none">
                                {forgotStep === 'success' ? (
                                    <div className="text-center py-6 space-y-6">
                                        <div className="flex justify-center">
                                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                                <Shield className="w-8 h-8 text-emerald-500" />
                                            </div>
                                        </div>
                                        <p className="text-slate-500 font-medium text-sm">
                                            If an account exists for this email, a secure reset link has been sent to <br /><strong className="text-slate-900">{resetEmail}</strong>.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setTab('login')}
                                            className="w-full border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl h-14 font-black text-xs uppercase tracking-widest"
                                        >
                                            Back to Sign In
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="name@un.org"
                                                value={resetEmail}
                                                onChange={e => setResetEmail(e.target.value)}
                                                required
                                                className="bg-slate-50/50 border-slate-100 text-slate-900 placeholder:text-slate-300 h-12 px-4 rounded-xl focus:ring-2 focus:ring-indigo-100 border-indigo-50 transition-all font-medium"
                                            />
                                        </div>
                                        {error && (
                                            <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-2xl border">
                                                <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                                            </Alert>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                            Send Reset Link
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setTab('login')}
                                            className="w-full text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors py-2 uppercase tracking-widest"
                                        >
                                            Back to Sign In
                                        </button>
                                    </form>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="p-8 pt-0 flex flex-col gap-6">
                        <div className="w-full h-px bg-slate-50" />
                        <div className="flex flex-col gap-2 items-center text-center">
                            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] leading-relaxed max-w-[240px]">
                                Restricted Access • UN System • IMF • World Bank • Diplomatic Corps
                            </p>
                            <p className="text-[8px] text-slate-200 uppercase tracking-widest font-medium">
                                GDPR Secured • ISO 27001 Compliant
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

