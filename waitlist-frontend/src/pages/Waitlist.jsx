import React, { useState, useEffect, useRef } from 'react';
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
    const [shareRefNote, setShareRefNote] = useState(false);
    const shareContainerRef = useRef(null);

    const [personalShareUrl, setPersonalShareUrl] = useState('https://www.unswap.net');
    const [copiedIndex, setCopiedIndex] = useState(null);

    // ─── After signup, fetch personal referral URL ─────────────────────────
    useEffect(() => {
        if (mode === 'success' && email) {
            updateShareUrl(email);
        }
    }, [mode]);

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
            // updateShareUrl is now handled by the useEffect watching mode
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

    // ─── ShareThis: Dynamic URL ────────────────────────────────────────────────
    // After sign-up, try to retrieve the user's personal Waitlister referral URL.
    // Falls back silently to the base waitlist URL so sharing is never blocked.
    const updateShareUrl = async (userEmail) => {
        let shareUrl = 'https://www.unswap.net';
        try {
            const data = await api.waitlist.getStatus(userEmail);
            if (data.found && data.thank_you_url) {
                shareUrl = data.thank_you_url;
                setPersonalShareUrl(shareUrl);
                setShareRefNote(true);
            }
        } catch (_) {
            // silent fallback
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
        <div className="min-h-screen bg-navy text-ivory font-sans relative">
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
                        {/* FORM */}
                        <div className="w-full flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 min-h-[100dvh] overflow-y-auto">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />

                            <div className="w-full max-w-xl mx-auto relative">
                                {/* Circular logo */}
                                <div className="flex justify-center mb-6">
                                    <img src="/logo.png" alt="UnSwap" className="w-28 h-28 object-contain" />
                                </div>

                                {/* Divider label */}
                                <div className="flex items-center justify-center gap-3 mb-5">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-unswap-border" />
                                    <span className="text-ivory text-[11px] tracking-[0.22em] uppercase font-medium">Exclusive Access</span>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-unswap-border" />
                                </div>

                                {/* Description */}
                                <p className="text-gold font-display text-[26px] leading-snug text-center mb-10 font-light italic">
                                    A closed-loop home exchange ecosystem exclusively for verified staff of the UN, World Bank, IMF and other International Organizations.
                                </p>

                                {/* Form */}
                                <form onSubmit={handleInitiateJoin} className="space-y-4">
                                    <div>
                                        <label className="text-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Full Name <span className="text-gold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            className="w-full bg-[rgba(10,14,26,0.5)] border border-unswap-border px-[20px] py-[16px] text-ivory placeholder-muted focus:outline-none focus:border-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px] font-sans"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Email Address <span className="text-gold">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            required
                                            className="w-full bg-[rgba(10,14,26,0.5)] border border-unswap-border px-[20px] py-[16px] text-ivory placeholder-muted focus:outline-none focus:border-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 text-[15px] font-sans"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-ivory-dim text-xs tracking-[0.08em] uppercase font-medium mb-2 pl-1 flex items-center gap-1">
                                            Organization / Affiliation <span className="text-gold">*</span>
                                        </label>
                                        <select
                                            value={organization}
                                            onChange={(e) => setOrganization(e.target.value)}
                                            required
                                            className={`w-full bg-[rgba(10,14,26,0.5)] border border-unswap-border px-[20px] py-[16px] focus:outline-none focus:border-gold focus:shadow-[0_0_0_1px_var(--border)] hover:border-gold transition-all duration-300 appearance-none text-[15px] font-sans ${!organization ? 'text-muted' : 'text-ivory'}`}
                                            style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c9a84c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1.5rem 1.5rem` }}
                                        >
                                            <option value="" disabled className="bg-deep text-muted">Select your organization / affiliation</option>
                                            {['United Nations', 'Specialized Agencies (WHO, ILO, UNESCO, etc.)', 'World Bank Group', 'International Monetary Fund (IMF)', 'Diplomatic Mission / Foreign Service', 'Other Intergovernmental Organization', 'I am a friend/family of an international employee whom I want to invite'].map(org => (
                                                <option key={org} value={org} className="bg-navy text-ivory">{org}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {errorMessage && <p className="text-[#ff6b6b] text-[14.5px]">{errorMessage}</p>}

                                    {/* Main CTA */}
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="btn-gold w-full flex items-center justify-center mt-2 group shadow-[0_4px_24px_var(--gold-dim)]"
                                    >
                                        {status === 'loading' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                                Processing...
                                            </span>
                                        ) : 'Request Access →'}
                                    </button>

                                    {/* Social proof */}
                                    <div className="pt-6 mt-4 border-t border-unswap-border flex flex-col items-center gap-3">
                                        {waitlistCount === 0 ? (
                                            <p className="text-[13px] text-ivory-dim">Be the first to join!</p>
                                        ) : waitlistCount !== null && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {recentJoiners.slice(0, 3).map((j, i) => (
                                                        <div key={i} className="w-8 h-8 rounded-full bg-[rgba(201,168,76,0.15)] border border-unswap-border flex items-center justify-center text-[10px] font-medium text-gold shadow-sm z-10">
                                                            {j.initials}
                                                        </div>
                                                    ))}
                                                    {waitlistCount > 3 && (
                                                        <div className="w-8 h-8 z-0 rounded-full bg-[rgba(10,14,26,0.5)] border border-unswap-border flex items-center justify-center text-[10px] font-medium text-ivory-dim">
                                                            +{waitlistCount - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[13px] text-ivory-dim"><span className="text-ivory font-medium">{waitlistCount}</span> members already on the list</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setMode('status'); setErrorMessage(''); }}
                                            className="text-muted hover:text-gold text-[11px] font-medium tracking-[0.18em] uppercase transition-colors"
                                        >
                                            Check Status →
                                        </button>
                                    </div>
                                </form>

                            </div>
                        </div>




                    </motion.div>
                )}

                {/* ========================================= SUCCESS ========================================= */}
                {mode === 'success' && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full relative min-h-screen py-10 px-6">
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); }}
                            className="absolute top-8 left-4 sm:left-8 text-ivory-dim hover:text-ivory transition-colors flex items-center gap-2 text-[14.5px]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back
                        </button>
                        <div className="w-16 h-16 rounded-full bg-[rgba(201,168,76,0.05)] border border-unswap-border flex items-center justify-center mb-6 mt-2 shadow-[0_4px_24px_var(--gold-dim)]">
                            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        </div>
                        <h2 className="font-display text-[44px] font-light text-gold mb-4 leading-[1.15]">Check your inbox</h2>
                        <p className="text-ivory-dim text-[16px] mb-1">We sent a confirmation link to</p>
                        <p className="text-ivory font-medium text-[16px] mb-3">{email}</p>
                        <p className="text-muted text-[14.5px] max-w-xs mx-auto leading-relaxed">Click the link to confirm your email and be redirected to your waitlist status dashboard.</p>

                        {/* Share nudge */}
                        <div className="mt-10 w-full border-t border-[rgba(201,168,76,0.25)] pt-8">
                            <p className="text-[rgba(245,240,232,0.65)] text-xs tracking-[0.18em] uppercase font-medium mb-1">Skip the queue</p>
                            <p className="font-['Cormorant_Garamond'] text-[#c9a84c] text-[20px] font-light italic mb-5">Share &amp; move up the waitlist</p>

                            {/* Native Share Buttons */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {[{ id: 'whatsapp', label: 'WhatsApp', color: '#25D366', href: `https://wa.me/?text=${encodeURIComponent('I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering. Join here: ')}${encodeURIComponent(personalShareUrl)}` },
                                  { id: 'twitter',  label: 'X / Twitter', color: '#000', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent('I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering. ')}&url=${encodeURIComponent(personalShareUrl)}` },
                                  { id: 'linkedin', label: 'LinkedIn',  color: '#0A66C2', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(personalShareUrl)}` },
                                  { id: 'instagram', label: 'Instagram', color: '#E1306C', href: 'https://instagram.com' },
                                ].map(btn => (
                                    <a
                                        key={btn.id}
                                        href={btn.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-3 py-3 text-[12px] font-medium tracking-wide rounded border transition-all hover:-translate-y-0.5"
                                        style={{ background: 'rgba(10,14,26,0.5)', borderColor: 'rgba(201,168,76,0.15)', color: 'var(--ivory)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.color = btn.color; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; e.currentTarget.style.color = 'var(--ivory)'; }}
                                    >
                                        {btn.label}
                                    </a>
                                ))}
                            </div>

                            {/* Copy link */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(personalShareUrl);
                                    setCopiedIndex('link');
                                    setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[12px] font-medium tracking-wide border rounded transition-all mb-3"
                                style={{ background: 'rgba(10,14,26,0.4)', borderColor: copiedIndex === 'link' ? 'var(--gold)' : 'rgba(201,168,76,0.2)', color: copiedIndex === 'link' ? 'var(--gold)' : 'rgba(245,240,232,0.6)' }}
                            >
                                {copiedIndex === 'link' ? '✓ Link Copied!' : '⎘ Copy Referral Link'}
                            </button>

                            {/* Full share page link */}
                            <a
                                href={`/share?email=${encodeURIComponent(email)}`}
                                className="block text-center text-[11px] tracking-[0.18em] uppercase font-medium transition-colors mt-2"
                                style={{ color: 'rgba(245,240,232,0.35)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.35)'}
                            >
                                Open full Share Page →
                            </a>

                            {shareRefNote && (
                                <p className="text-[rgba(245,240,232,0.4)] text-[11px] mt-3 tracking-wide text-center">Your personal referral link is automatically included.</p>
                            )}
                        </div>

                        {/* Templates Nudge */}
                        <div className="mt-8 w-full text-left">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.3)]" />
                                <span className="text-gold text-[11px] tracking-[0.2em] uppercase font-medium">Inspiration</span>
                                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.3)]" />
                            </div>

                            <div className="mb-6 p-4 bg-[rgba(10,14,26,0.4)] border border-[rgba(201,168,76,0.2)] rounded-md text-center">
                                <p className="text-[13px] text-ivory-dim leading-relaxed">
                                    <strong className="text-gold font-medium">💡 Pro-Tip:</strong> When sharing to LinkedIn, these standard "Hook" styles perform best when paired with an image of a global landmark or a prestigious interior.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: 1, title: "Option 1: The Calculation", subtitle: "Best for: LinkedIn or professional networks focused on financial strategy.", content: "I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering — and she built the solution specifically for people with security clearances.\n\nJoin the waitlist here: [INSERT_LINK]" },
                                    { id: 2, title: "Option 2: The 'Finally'", subtitle: "Best for: UN or Foreign Service WhatsApp / FB groups.", content: "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals — not tourists. If your home sits empty during postings, get on this waitlist before it opens: [INSERT_LINK]" },
                                    { id: 3, title: "Option 3: The Specific Pain", subtitle: "Best for: Personal storytelling or 1-on-1 outreach.", content: "You know the 3am feeling when you're posted abroad and you wonder if everything's okay at home? Jacqueline Tsuma built the answer to that.\n\nSecure your spot on the waitlist: [INSERT_LINK]" },
                                    { id: 4, title: "Option 4: The Contrast", subtitle: "Best for: High-impact \"Hard Truth\" posts.", content: "Diplomat A: $60K on serviced apartments, home unprotected for 18 months.\nDiplomat B: $0 on accommodation, home with a vetted UN peer, three future exchanges lined up.\n\nSame posting. One decision. Join the waitlist for that decision: [INSERT_LINK]" },
                                    { id: 5, title: "Option 5: The Credibility Pass", subtitle: "Best for: Establishing authority and trust.", content: "A former UN advisor built a vetted home exchange network specifically for diplomatic professionals — verified by institutional credentials, not star ratings. If you own a home that sits empty during postings, this is for you: [INSERT_LINK]" }
                                ].map((t) => {
                                    const hydrated = t.content.replace('[INSERT_LINK]', personalShareUrl);
                                    return (
                                        <div
                                            key={t.id}
                                            className="bg-deep border border-unswap-border rounded-lg p-5 transition-all hover:border-gold hover:shadow-[0_4px_20px_var(--gold-dim)] group cursor-pointer relative overflow-hidden"
                                            onClick={() => {
                                                navigator.clipboard.writeText(hydrated);
                                                setCopiedIndex(t.id);
                                                setTimeout(() => setCopiedIndex(null), 2000);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="text-ivory font-medium text-[15px]">{t.title}</h4>
                                                    <p className="text-muted text-[12px] tracking-wide mt-1">{t.subtitle}</p>
                                                </div>
                                                <button className="text-gold bg-[rgba(201,168,76,0.1)] px-3 py-1.5 rounded text-[11px] font-medium tracking-wide uppercase transition-all group-hover:bg-gold group-hover:text-navy flex items-center gap-1.5 shrink-0 ml-3">
                                                    {copiedIndex === t.id ? (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            Copy
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-[14px] text-ivory-dim leading-[1.6] font-['Cormorant_Garamond'] whitespace-pre-wrap border-l-2 border-[rgba(201,168,76,0.3)] pl-4 italic">
                                                "{hydrated}"
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ========================================= ERROR ========================================= */}
                {mode === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center max-w-md mx-auto w-full relative min-h-screen p-6">
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                            className="absolute top-8 left-4 sm:left-8 text-ivory-dim hover:text-ivory transition-colors flex items-center gap-2 text-[14.5px]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back
                        </button>
                        <div className="w-16 h-16 rounded-full bg-[rgba(255,0,0,0.03)] border border-[rgba(255,0,0,0.15)] flex items-center justify-center mb-6 mt-2">
                            <svg className="w-8 h-8 text-[#ff6b6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="font-display text-[44px] font-light text-gold mb-4 leading-[1.15]">Unable to connect</h2>
                        <p className="text-ivory-dim text-[16px] mb-8 leading-relaxed max-w-xs mx-auto">
                            {errorMessage || 'Network error or the service is temporarily unavailable. Please try again later.'}
                        </p>
                        <button
                            onClick={() => { setMode('join'); setEmail(''); setName(''); setOrganization(''); setErrorMessage(''); }}
                            className="btn-gold w-full flex items-center justify-center shadow-[0_4px_24px_var(--gold-dim)]"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

                {/* ========================================= STATUS CHECKER ========================================= */}
                {mode === 'status' && (
                    <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto min-h-screen p-6 relative z-10">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--gold-dim)_0%,_transparent_60%)] pointer-events-none" />
                        <div className="flex justify-center mb-6">
                            <img src="/logo.png" alt="Unswap Logo" className="w-28 h-28 object-contain" />
                        </div>
                        <h1 className="font-display text-[36px] sm:text-[48px] font-light text-ivory mb-8 tracking-tight leading-[1.1]">
                            Check your <em className="text-gold-light italic">waitlist status</em>
                        </h1>

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
                                className="w-full bg-[rgba(10,14,26,0.5)] border border-unswap-border px-[20px] py-[16px] text-ivory placeholder-muted focus:outline-none focus:border-gold focus:shadow-[0_0_0_1px_var(--border)] transition-all duration-300 font-sans text-[15px]"
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn-gold w-full flex items-center justify-center mt-2 group shadow-[0_4px_24px_var(--gold-dim)]"
                            >
                                {status === 'loading' ? 'Loading...' : 'Check Status'}
                            </button>
                        </form>

                        {errorMessage && (
                            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[#ff6b6b] text-[14.5px] mt-6 mb-2">
                                {errorMessage}
                            </motion.p>
                        )}

                        <button
                            onClick={() => { setMode('join'); setErrorMessage(''); }}
                            className="mt-8 text-muted hover:text-gold text-[11px] font-medium tracking-[0.18em] uppercase transition-colors"
                        >
                            ← Back to waitlist
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>

        </div>
    );
}
