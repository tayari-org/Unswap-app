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
import { Shield, Globe, ArrowRight, Loader2, Linkedin, Mail, RotateCcw, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// ── LinkedIn icon (lucide doesn’t have X/Twitter, so we use inline SVG)
function XIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}


function GoogleIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

/** Social sign-in buttons: Google, LinkedIn & X, rendered with their brand colors */
function SocialButtons({ disabled, onGoogle, onLinkedIn, onX }) {
    return (
        <div className="flex flex-col gap-3 w-full">
            {/* Google */}
            <button
                type="button"
                disabled={disabled}
                onClick={onGoogle}
                className="w-full flex items-center gap-3 h-12 px-4 rounded-none border border-slate-200 bg-white hover:bg-slate-50 transition-all group disabled:opacity-50 disabled:pointer-events-none"
            >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 group-hover:text-slate-900">
                    Continue with Google
                </span>
            </button>

            {/* LinkedIn */}
            <button
                type="button"
                disabled={disabled}
                onClick={onLinkedIn}
                className="w-full flex items-center gap-3 h-12 px-4 rounded-none border border-transparent bg-[#0A66C2] hover:bg-[#004182] transition-all group disabled:opacity-50 disabled:pointer-events-none"
            >
                <Linkedin className="w-5 h-5 text-white shrink-0 fill-current" />
                <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                    Continue with LinkedIn
                </span>
            </button>

            {/* X (Twitter) */}
            <button
                type="button"
                disabled={disabled}
                onClick={onX}
                className="w-full flex items-center gap-3 h-12 px-4 rounded-none border border-transparent bg-black hover:bg-slate-900 transition-all group disabled:opacity-50 disabled:pointer-events-none"
            >
                <XIcon className="w-4 h-4 text-white shrink-0" />
                <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white">
                    Continue with X
                </span>
            </button>
        </div>
    );
}



export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { checkAppState } = useAuth();
    const returnUrl = searchParams.get('from') || '/Dashboard';

    const [tab, setTab] = useState(searchParams.get('tab') || 'login');
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

    // OTP verification state
    const [regStep, setRegStep] = useState('form'); // 'form' | 'verify'
    const [regOtp, setRegOtp] = useState('');
    const otpInputRef = useRef(null);

    // Forgot password state
    const [forgotStep, setForgotStep] = useState('email');
    const [resetEmail, setResetEmail] = useState('');
    const [message, setMessage] = useState('');

    const [refCode, setRefCode] = useState(searchParams.get('ref') || '');

    // OAuth error returned from provider redirect
    const oauthError = searchParams.get('oauthError') || '';

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
            await checkAppState(); // sync AuthContext before routing
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
            await api.auth.registerInitiate({
                email: regEmail,
                password: regPassword,
                full_name: regName,
                institution: regInstitution || undefined,
                referred_by: refCode || undefined,
            });
            setRegStep('verify');
            setRegOtp('');
            setTimeout(() => otpInputRef.current?.focus(), 100);
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.auth.registerVerify({ email: regEmail, otp: regOtp });
            await checkAppState();
            navigate(returnUrl);
        } catch (err) {
            setError(err.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    }

    async function handleResendOtp() {
        setError('');
        setLoading(true);
        try {
            await api.auth.registerInitiate({
                email: regEmail,
                password: regPassword,
                full_name: regName,
                institution: regInstitution || undefined,
                referred_by: refCode || undefined,
            });
            setRegOtp('');
            setMessage('A new code has been sent to your email.');
            setTimeout(() => { setMessage(''); otpInputRef.current?.focus(); }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to resend code.');
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


    function handleGoogleLogin() {
        api.auth.googleLogin({ returnUrl, refCode });
    }

    function handleLinkedInLogin() {
        api.auth.linkedinLogin({ returnUrl, refCode });
    }

    function handleXLogin() {
        api.auth.xLogin({ returnUrl, refCode });
    }

    // Divider between social and email/password
    function OrDivider() {
        return (
            <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-unswap-blue-deep/10" />
                <span className="text-[10px] text-unswap-blue-deep/40 font-bold uppercase tracking-[0.4em]">or</span>
                <div className="flex-1 h-px bg-unswap-blue-deep/10" />
            </div>
        );
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
                <div className="text-center mb-12 flex justify-center">
                    <img src={logo} alt="Unswap" className="h-14 w-auto object-contain" />
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

                        {(error || oauthError) && (
                            <Alert className="bg-rose-50 border-rose-100 text-rose-600 mb-6 rounded-2xl">
                                <AlertDescription className="font-medium text-sm">{error || oauthError}</AlertDescription>
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
                                <SocialButtons disabled={loading} onGoogle={handleGoogleLogin} onLinkedIn={handleLinkedInLogin} onX={handleXLogin} />
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
                                {regStep === 'form' ? (
                                    <>
                                        <SocialButtons disabled={loading} onGoogle={handleGoogleLogin} onLinkedIn={handleLinkedInLogin} onX={handleXLogin} />
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
                                                {loading ? 'Sending code...' : 'Continue'}
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    /* ── OTP Verify Step ── */
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex justify-center mb-6">
                                            <div className="w-14 h-14 rounded-none bg-unswap-blue-deep/5 border border-unswap-blue-deep/10 flex items-center justify-center">
                                                <Mail className="w-6 h-6 text-unswap-blue-deep" />
                                            </div>
                                        </div>
                                        <p className="text-center text-slate-500 text-sm font-light mb-1">We sent a 6-digit code to</p>
                                        <p className="text-center font-mono text-sm font-bold text-slate-800 mb-8 tracking-wide">{regEmail}</p>

                                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 ml-1">Verification Code</Label>
                                                <Input
                                                    ref={otpInputRef}
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={6}
                                                    placeholder="000000"
                                                    value={regOtp}
                                                    onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                    required
                                                    className="bg-slate-50/30 border-slate-200 text-slate-900 placeholder:text-slate-200 h-16 rounded-none focus-visible:ring-unswap-blue-deep font-mono text-2xl tracking-[0.5em] text-center"
                                                />
                                            </div>

                                            {message && (
                                                <Alert className="bg-emerald-50 border-emerald-100 text-emerald-700 rounded-none">
                                                    <AlertDescription className="text-[10px] font-bold uppercase tracking-widest">{message}</AlertDescription>
                                                </Alert>
                                            )}
                                            {error && (
                                                <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-600 rounded-none">
                                                    <AlertDescription className="text-[10px] font-bold uppercase tracking-widest">{error}</AlertDescription>
                                                </Alert>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={loading || regOtp.length < 6}
                                                className="w-full bg-unswap-blue-deep hover:bg-slate-900 text-white h-16 rounded-none font-bold text-[10px] uppercase tracking-[0.4em] transition-all shadow-2xl border-none outline-none group mt-2"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-3.5 h-3.5 mr-2" />}
                                                {loading ? 'Verifying...' : 'Verify & Create Account'}
                                            </Button>
                                        </form>

                                        <div className="flex items-center justify-between mt-6">
                                            <button
                                                type="button"
                                                onClick={() => { setRegStep('form'); setError(''); setRegOtp(''); }}
                                                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-700 transition-colors"
                                            >
                                                <ChevronLeft className="w-3 h-3" /> Back
                                            </button>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleResendOtp}
                                                className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-unswap-blue-deep hover:text-slate-900 transition-colors disabled:opacity-40"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Resend code
                                            </button>
                                        </div>
                                    </div>
                                )}
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

