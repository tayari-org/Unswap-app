import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logo from '@/assets/logo.png';
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
// Google Client ID loaded from env

// Divider between Google and email/password
function OrDivider() {
    return (
        <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-unswap-blue-deep/10" />
            <span className="text-[10px] text-unswap-blue-deep/40 font-bold uppercase tracking-[0.4em]">or</span>
            <div className="flex-1 h-px bg-unswap-blue-deep/10" />
        </div>
    );
}

// Renders the official Google sign-in button via the GSI SDK
function GoogleButton({ onCredential, disabled }) {
    const containerRef = useRef(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        // Function to initialize and render the button
        const initGoogleButton = () => {
            if (!window.google?.accounts?.id || !containerRef.current) return;

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
        };

        // If SDK already exists, immediately init
        if (window.google?.accounts?.id) {
            initGoogleButton();
            setScriptLoaded(true);
            return;
        }

        // Otherwise dynamically load the SDK
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            setScriptLoaded(true);
            initGoogleButton();
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
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
        <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background design elements - Architectural & Institutional */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-1/3 bg-slate-50 border-b border-slate-100" />
                <div className="absolute top-1/3 left-[10%] w-px h-2/3 bg-unswap-blue-deep/5" />
                <div className="absolute top-1/2 right-[15%] w-px h-1/2 bg-unswap-blue-deep/5" />
                <div className="absolute bottom-[20%] left-0 w-full h-px bg-unswap-blue-deep/5" />

                {/* Subtle Radial Polishing */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-unswap-blue-deep/[0.02] rounded-full blur-[120px] -mr-96 -mt-96" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4">
                        <img src={logo} alt="Unswap" className="w-10 h-10 object-contain" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-4xl font-extralight text-slate-900 tracking-[-0.05em]">UN<span className="italic font-serif">swap</span></span>
                            <div className="w-8 h-px bg-unswap-blue-deep/20 mt-1" />
                        </div>
                    </div>
                </div>

                <Card className="bg-white border-slate-200 shadow-2xl rounded-none overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-unswap-blue-deep" />
                    <CardHeader className="p-10 pb-6 text-center">
                        <CardTitle className="text-3xl font-extralight text-slate-900 tracking-tight">
                            {tab === 'login' ? 'Welcome back' : tab === 'forgot' ? 'Reset Password' : 'Register'}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">
                            {tab === 'login'
                                ? 'Sign in with your Unswap credentials'
                                : tab === 'forgot'
                                    ? 'Follow the steps to reset your password'
                                    : 'Create your account'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8 pt-4">
                        {message && (
                            <Alert className="bg-emerald-50 border-emerald-100 text-emerald-700 mb-6 rounded-2xl">
                                <AlertDescription className="font-medium text-sm">{message}</AlertDescription>
                            </Alert>
                        )}

                        <Tabs value={tab} onValueChange={(v) => { setTab(v); setError(''); setMessage(''); }}>
                            <TabsList className="w-full bg-white border-b border-slate-100 mb-10 p-0 rounded-none h-14 flex items-end">
                                <TabsTrigger value="login" className="flex-1 h-full rounded-none font-bold text-[10px] uppercase tracking-[0.3em] bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-unswap-blue-deep data-[state=active]:text-unswap-blue-deep text-slate-400 border-b border-transparent transition-all">
                                    Sign In
                                </TabsTrigger>
                                <TabsTrigger value="register" className="flex-1 h-full rounded-none font-bold text-[10px] uppercase tracking-[0.3em] bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-unswap-blue-deep data-[state=active]:text-unswap-blue-deep text-slate-400 border-b border-transparent transition-all">
                                    Register
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Login ── */}
                            <TabsContent value="login" className="space-y-6 focus-visible:outline-none">
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={loginEmail}
                                            onChange={e => setLoginEmail(e.target.value)}
                                            required
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-14 rounded-none focus-visible:ring-unswap-blue-deep transition-all font-mono text-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Password</Label>
                                            <button
                                                type="button"
                                                onClick={() => setTab('forgot')}
                                                className="text-[9px] font-bold text-unswap-blue-deep hover:text-slate-900 transition-colors uppercase tracking-[0.2em]"
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
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-14 rounded-none focus-visible:ring-unswap-blue-deep transition-all font-mono text-sm"
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
                                        className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white h-16 rounded-none font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-2xl border-none outline-none group mt-4"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-3.5 h-3.5 mr-2 transition-transform group-hover:scale-110" />}
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── Register ── */}
                            <TabsContent value="register" className="space-y-6 focus-visible:outline-none">
                                <GoogleButton onCredential={handleGoogleCredential} disabled={loading} />
                                <OrDivider />

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Full Name</Label>
                                        <Input
                                            placeholder="John Doe"
                                            value={regName}
                                            onChange={e => setRegName(e.target.value)}
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-12 rounded-none focus-visible:ring-unswap-blue-deep font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="name@un.org"
                                            value={regEmail}
                                            onChange={e => setRegEmail(e.target.value)}
                                            required
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-12 rounded-none focus-visible:ring-unswap-blue-deep font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Institution</Label>
                                        <Input
                                            placeholder="Institution (UN, IMF, etc.)"
                                            value={regInstitution}
                                            onChange={e => setRegInstitution(e.target.value)}
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-12 rounded-none focus-visible:ring-unswap-blue-deep"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Password</Label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={regPassword}
                                            onChange={e => setRegPassword(e.target.value)}
                                            required
                                            className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-12 rounded-none focus-visible:ring-unswap-blue-deep font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Referral Code <span className="text-slate-300 font-normal italic lowercase">(optional)</span></Label>
                                        <Input
                                            placeholder="UNSWAP-XXXXXX"
                                            value={refCode}
                                            onChange={e => setRefCode(e.target.value)}
                                            className={`bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-12 rounded-none focus-visible:ring-unswap-blue-deep font-mono text-[10px] uppercase tracking-wider ${refCode && searchParams.get('ref') ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-none animate-in fade-in slide-in-from-top-1">
                                            <AlertDescription className="text-[10px] font-bold uppercase tracking-widest">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white h-16 rounded-none font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-2xl border-none outline-none group mt-6"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-3.5 h-3.5 mr-2 transition-transform group-hover:rotate-180 duration-1000" />}
                                        {loading ? 'Creating account...' : 'Create Account'}
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

                    <CardFooter className="p-10 pt-0 flex flex-col gap-8">
                        <div className="w-full h-px bg-slate-50" />
                        <div className="space-y-4 text-center">
                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.4em] leading-relaxed">
                                Restricted Access • UN System • IMF • World Bank • Diplomatic Corps
                            </p>
                            <div className="flex items-center justify-center gap-4 text-[7px] text-slate-200 font-bold uppercase tracking-[0.3em]">
                                <span>GDPR Secured</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span>ISO 27001 Compliant</span>
                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                <span>TLS 1.3 Active</span>
                            </div>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

