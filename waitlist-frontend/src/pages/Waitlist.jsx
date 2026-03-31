import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/apiClient.js';

export default function Waitlist() {
    const [mode, setMode] = useState('join'); // 'join', 'status', 'success', 'error'

    // Join Form fields
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [organization, setOrganization] = useState('');

    // Status Check fields
    const [checkEmail, setCheckEmail] = useState('');

    const [status, setStatus] = useState('idle'); // idle, loading, error
    const [errorMessage, setErrorMessage] = useState('');

    const [waitlistCount, setWaitlistCount] = useState(null);
    const [recentJoiners, setRecentJoiners] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        const errParam = params.get('error');

        if (ref) sessionStorage.setItem('unswap_referral_code', ref);
        if (errParam) {
            setErrorMessage(decodeURIComponent(errParam).replace(/\+/g, ' '));
            setMode('error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        api.waitlist.getCount().then(data => {
            if (typeof data.count === 'number') setWaitlistCount(data.count);
            if (Array.isArray(data.recentJoiners)) setRecentJoiners(data.recentJoiners);
        }).catch(() => setWaitlistCount(0));
    }, []);

    const handleInitiateJoin = async (e) => {
        e.preventDefault();
        if (!email || !name) return;
        setStatus('loading'); setErrorMessage('');
        const ref = sessionStorage.getItem('unswap_referral_code');

        try {
            await api.waitlist.initiateJoin({ email, name, organization, ref });

            fetch('https://events.evidence.io/hook/vQrlDk0zuDnpKoqD', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, organization }),
            }).catch((e) => console.error('Webhook failed:', e));

            setMode('success');
            setStatus('idle');
        } catch (err) {
            if (err.status === 409) {
                setMode('status');
                setCheckEmail(email);
                setErrorMessage('');
            } else {
                setErrorMessage(err.message || 'Failed to initiate signup');
                setMode('error');
            }
            setStatus('error');
        }
    };

    const handleCheckStatus = async (e) => {
        e.preventDefault();
        if (!checkEmail) return;
        setStatus('loading'); setErrorMessage('');

        try {
            const data = await api.waitlist.getStatus(checkEmail);
            if (data.found === false) {
                setErrorMessage("We couldn't find an account matching that email.");
                setStatus('error');
                return;
            }

            if (data.thank_you_url) {
                window.location.href = data.thank_you_url;
            } else {
                setErrorMessage('Dashboard link not found');
                setStatus('error');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Something went wrong.');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#0B101E] font-display relative">
            <AnimatePresence mode="wait">

                {/* ========================================= JOIN ========================================= */}
                {mode === 'join' && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col lg:flex-row w-full min-h-screen relative"
                    >
                        {/* FORM — overlaid on mobile, right on desktop */}
                        <div className="w-full lg:w-[65%] order-1 lg:order-2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh] overflow-y-auto">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.05)_0%,_transparent_60%)] pointer-events-none" />

                            <div className="w-full max-w-xl mx-auto relative">
                                {/* Circular logo */}
                                <div className="flex justify-center mb-6">
                                    <img src="/logo.png" alt="UnSwap" className="w-20 h-20 object-contain" />
                                </div>

                                {/* Divider label */}
                                <div className="flex items-center justify-center gap-3 mb-5">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
                                    <span className="text-white text-xs tracking-[0.35em] uppercase font-medium">Exclusive Access</span>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
                                </div>

                                {/* Description */}
                                <p className="text-[#D4AF37] text-2xl leading-relaxed text-center mb-8 font-light">
                                    A closed-loop home exchange ecosystem exclusively for verified staff of the UN, World Bank, IMF and other International Organizations.
                                </p>

                                {/* Form */}
                                <form onSubmit={handleInitiateJoin} className="space-y-4">
                                    <div>
                                        <label className="text-[#899BB1] text-xs tracking-widest uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Full Name <span className="text-[#D4AF37]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className="w-full bg-white/[0.03] border border-[#2D3A53] px-5 py-4 text-white placeholder-[#3A4A62] focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_0_1px_rgba(212,175,55,0.25)] transition-all duration-300 text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#899BB1] text-xs tracking-widest uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Email Address <span className="text-[#D4AF37]">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-white/[0.03] border border-[#2D3A53] px-5 py-4 text-white placeholder-[#3A4A62] focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_0_1px_rgba(212,175,55,0.25)] transition-all duration-300 text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[#899BB1] text-xs tracking-widest uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Organization / Affiliation <span className="text-[#D4AF37]">*</span>
                                        </label>
                                        <select
                                            value={organization}
                                            onChange={(e) => setOrganization(e.target.value)}
                                            required
                                            className={`w-full bg-white/[0.03] border border-[#2D3A53] px-5 py-3.5 focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_0_1px_rgba(212,175,55,0.25)] hover:border-[#D4AF37] transition-all duration-300 appearance-none text-sm ${!organization ? 'text-[#3A4A62]' : 'text-white'}`}
                                            style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4AF37' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1.5rem 1.5rem, rgba(255,255,255,0.03)` }}
                                        >
                                            <option value="" disabled className="bg-[#0B101E] text-[#5A6D88]">Select your organization / affiliation</option>
                                            {['United Nations', 'Specialized Agencies (WHO, ILO, UNESCO, etc.)', 'World Bank Group', 'International Monetary Fund (IMF)', 'Diplomatic Mission / Foreign Service', 'Other Intergovernmental Organization', 'I am a friend/family of an international employee whom I want to invite'].map(org => (
                                                <option key={org} value={org} className="bg-[#0B101E] text-white">{org}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {errorMessage && <p className="text-red-400 text-sm">{errorMessage}</p>}

                                    {/* Main CTA */}
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full bg-[#D4AF37] hover:bg-[#C9A227] text-black font-bold tracking-[0.15em] uppercase text-lg py-5 transition-all duration-300 shadow-[0_4px_24px_rgba(212,175,55,0.25)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.45)]"
                                    >
                                        {status === 'loading' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                Processing...
                                            </span>
                                        ) : 'Request Access →'}
                                    </button>

                                    {/* Social proof */}
                                    <div className="pt-4 border-t border-white/5 flex flex-col items-center gap-3">
                                        {waitlistCount === 0 ? (
                                            <p className="text-sm text-[#899BB1]">Be the first to join!</p>
                                        ) : waitlistCount !== null && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {recentJoiners.slice(0, 3).map((j, i) => (
                                                        <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37]/80 to-[#8B6914] border-2 border-[#0B101E] flex items-center justify-center text-[9px] font-bold text-black shadow-sm z-10">
                                                            {j.initials}
                                                        </div>
                                                    ))}
                                                    {waitlistCount > 3 && (
                                                        <div className="w-7 h-7 z-0 rounded-full bg-[#1E293B] border-2 border-[#0B101E] flex items-center justify-center text-[9px] font-bold text-gray-300">
                                                            +{waitlistCount - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-[#899BB1]"><span className="text-white font-medium">{waitlistCount}</span> members already on the list</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setMode('status'); setErrorMessage(''); }}
                                            className="text-[#899BB1] hover:text-[#D4AF37] text-xs tracking-widest uppercase transition-colors"
                                        >
                                            Check Status →
                                        </button>
                                    </div>
                                </form>

                            </div>
                        </div>


                        {/* IMAGE — background on mobile, left on desktop */}
                        <div className="absolute inset-0 lg:static lg:w-[35%] order-2 lg:order-1 lg:sticky lg:top-0 lg:h-[100dvh] overflow-hidden z-0 bg-[#0B101E]">
                            <img src="/hero.webp" alt="Luxury Interior" className="absolute inset-0 w-full h-full object-cover object-center" />
                            <div className="absolute inset-0 bg-[#0B101E]/95 lg:hidden" />
                            <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-8 lg:p-10">

                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-px bg-[#D4AF37]" />
                                    <p className="text-white/40 text-xs tracking-widest uppercase">By invitation only</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ========================================= SUCCESS ========================================= */}
                {mode === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-md mx-auto w-full relative min-h-screen p-6">
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); }}
                            className="absolute top-8 left-4 sm:left-8 text-[#899BB1] hover:text-white transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-[#1A2540] flex items-center justify-center mb-6 mt-2">
                            <svg className="w-7 h-7 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Check your inbox</h2>
                        <p className="text-[#899BB1] mb-1">We sent a confirmation link to</p>
                        <p className="text-white font-semibold mb-2">{email}</p>
                        <p className="text-[#899BB1] text-sm mb-8">Click the link to confirm your email and be redirected to your waitlist status dashboard.</p>
                    </motion.div>
                )}

                {/* ========================================= ERROR ========================================= */}
                {mode === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-md mx-auto w-full relative min-h-screen p-6">
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                            className="absolute top-8 left-4 sm:left-8 text-[#899BB1] hover:text-white transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-[#3F1626] flex items-center justify-center mb-6 mt-2">
                            <svg className="w-7 h-7 text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">Unable to connect</h2>
                        <p className="text-[#899BB1] mb-8 leading-relaxed">
                            {errorMessage || 'Network error or the service is temporarily unavailable. Please try again later.'}
                        </p>
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                            className="w-full bg-[#D4AF37] hover:bg-[#C9A227] text-black font-bold py-3.5 transition-all tracking-widest uppercase text-sm"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

                {/* ========================================= STATUS CHECKER ========================================= */}
                {mode === 'status' && (
                    <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto min-h-screen p-6">
                        <div className="flex justify-center mb-6">
                            <img src="/logo.png" alt="Unswap Logo" className="w-20 h-20 object-contain" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-[#D4AF37] mb-8 tracking-tight">Check your waitlist status</h1>

                        <form onSubmit={handleCheckStatus} className="w-full flex flex-col items-center gap-4">
                            <input
                                type="email"
                                value={checkEmail}
                                onChange={(e) => {
                                    setCheckEmail(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                placeholder="email@example.com"
                                required
                                className="w-full bg-white/[0.03] border border-[#2D3A53] px-5 py-4 text-white placeholder-[#3A4A62] focus:outline-none focus:border-[#D4AF37] focus:shadow-[0_0_0_1px_rgba(212,175,55,0.25)] transition-all duration-300 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-[#D4AF37] hover:bg-[#C9A227] text-black font-semibold tracking-[0.15em] uppercase text-xs py-4 transition-all duration-300 shadow-[0_4px_24px_rgba(212,175,55,0.25)] hover:shadow-[0_6px_32px_rgba(212,175,55,0.45)]"
                            >
                                {status === 'loading' ? 'Loading...' : 'Check Status'}
                            </button>
                        </form>

                        {errorMessage && (
                            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-6 mb-2">
                                {errorMessage}
                            </motion.p>
                        )}

                        <button
                            onClick={() => { setMode('join'); setErrorMessage(''); }}
                            className="mt-6 text-[#D4AF37]/60 hover:text-[#D4AF37] text-xs tracking-widest uppercase transition-colors"
                        >
                            ← Back to waitlist
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
