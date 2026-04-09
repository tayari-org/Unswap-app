import React, { useState, useEffect } from 'react';

// ─── Meta Pixel injection ────────────────────────────────────────────────────
function useMetaPixel() {
  useEffect(() => {
    if (window.fbq) return; // already loaded
    const script = document.createElement('script');
    script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1309675737735561');fbq('track','PageView');`;
    document.head.appendChild(script);
  }, []);
}
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api } from '../api/apiClient.js';

// ─── Share message templates ────────────────────────────────────────────────
// WhatsApp → Option 2 "The Finally" (peer-to-peer, conversational)
const MSG_WHATSAPP =
  "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals \u2014 not tourists. If your home sits empty during postings, get on this waitlist before it opens:";

// LinkedIn → Option 1 "The Calculation" (professional, curiosity-gap)
const MSG_LINKEDIN =
  "I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering \u2014 and she built the solution specifically for people with security clearances.\n\nJoin the waitlist here:";

// X / Twitter → Option 4 "The Contrast" (scannable A vs B, punchy)
const MSG_TWITTER =
  "Diplomat A: $60K on serviced apartments, home unprotected for 18 months.\nDiplomat B: $0 on accommodation, home with a vetted UN peer, three future exchanges lined up.\n\nSame posting. One decision. Join the waitlist:";

// Facebook → Option 3 "The Specific Pain" (emotional, personal storytelling)
const MSG_FACEBOOK =
  "You know the 3am feeling when you're posted abroad and you wonder if everything's okay at home? Jacqueline Tsuma built the answer to that.\n\nSecure your spot on the waitlist:";

// ─── Platform icon SVGs (inline, no external deps) ─────────────────────────
const Icons = {
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L.057 23.5l5.797-1.521A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.903a9.874 9.874 0 01-5.036-1.378l-.36-.214-3.742.981.999-3.648-.235-.374A9.86 9.86 0 012.097 12C2.097 6.527 6.527 2.097 12 2.097 17.473 2.097 21.903 6.527 21.903 12S17.473 21.903 12 21.903z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  native: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
};

// ─── Message templates (same 5 as Waitlist.jsx) ────────────────────────────
const TEMPLATES = [
  {
    id: 1,
    title: "The Calculation",
    subtitle: "Best for: LinkedIn or professional networks",
    content: "I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering — and she built the solution specifically for people with security clearances.\n\nJoin the waitlist here: [LINK]",
  },
  {
    id: 2,
    title: "The 'Finally'",
    subtitle: "Best for: UN / Foreign Service WhatsApp groups",
    content: "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals — not tourists. If your home sits empty during postings, get on this waitlist before it opens: [LINK]",
  },
  {
    id: 3,
    title: "The Specific Pain",
    subtitle: "Best for: Personal storytelling or 1-on-1 outreach",
    content: "You know the 3am feeling when you're posted abroad and you wonder if everything's okay at home? Jacqueline Tsuma built the answer to that.\n\nSecure your spot on the waitlist: [LINK]",
  },
  {
    id: 4,
    title: "The Contrast",
    subtitle: "Best for: High-impact 'Hard Truth' posts",
    content: "Diplomat A: $60K on serviced apartments, home unprotected for 18 months.\nDiplomat B: $0 on accommodation, home with a vetted UN peer, three future exchanges lined up.\n\nSame posting. One decision. Join the waitlist for that decision: [LINK]",
  },
  {
    id: 5,
    title: "The Credibility Pass",
    subtitle: "Best for: Establishing authority and trust",
    content: "A former UN advisor built a vetted home exchange network specifically for diplomatic professionals — verified by institutional credentials, not star ratings. If you own a home that sits empty during postings, this is for you: [LINK]",
  },
];

// ─── Native share button ────────────────────────────────────────────────────
function NativeShareButton({ shareUrl }) {
  const [used, setUsed] = useState(false);
  const canNativeShare = !!navigator.share;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Join Unswap — Exclusive Waitlist',
        text: `${WHATSAPP_MESSAGE} `,
        url: shareUrl,
      });
      setUsed(true);
    } catch (_) {
      // user cancelled or not supported
    }
  };

  if (!canNativeShare) return null;

  return (
    <button
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-3 bg-gold text-navy font-sans text-[13px] font-medium tracking-[0.1em] uppercase px-5 py-4 transition-all hover:bg-gold-light hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(201,168,76,0.25)]"
      style={{ background: 'var(--gold)', color: 'var(--navy)' }}
    >
      {Icons.native}
      {used ? 'Shared!' : 'Share via…'}
    </button>
  );
}

// ─── Platform buttons config ────────────────────────────────────────────────
function buildPlatformButtons(shareUrl) {
  const enc   = encodeURIComponent(shareUrl);
  const encWa = encodeURIComponent(`${MSG_WHATSAPP} `);
  const encLi = encodeURIComponent(`${MSG_LINKEDIN} `);
  const encTw = encodeURIComponent(`${MSG_TWITTER} `);
  const encFb = encodeURIComponent(`${MSG_FACEBOOK} `);

  // Extract referral code from URL safely
  let code = null;
  try { code = new URL(shareUrl).searchParams.get('ref'); } catch (_) {}

  // Use the frontend /ref/ endpoint (which proxies to the backend OG proxy)
  // so social crawlers (Twitter, Facebook, LinkedIn) pick up custom OG tags
  const ogProxyUrl = code
      ? `https://www.unswap.net/ref/${code}`
      : `https://www.unswap.net/ref/home`;
  const encProxyUrl = encodeURIComponent(ogProxyUrl);

  return [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Icons.linkedin,
      color: '#0A66C2',
      preview: 'The number is staggering \u2014 solution built for people with security clearances.',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encProxyUrl}&summary=${encLi}`,
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      icon: Icons.twitter,
      color: '#1D9BF0',
      preview: 'Diplomat A: $60K\u2026 Diplomat B: $0. Same posting. One decision.',
      href: `https://twitter.com/intent/tweet?text=${encTw}&url=${encProxyUrl}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Icons.facebook,
      color: '#1877F2',
      preview: "You know the 3am feeling when you're posted abroad and wonder about home?",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encProxyUrl}&quote=${encFb}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Icons.whatsapp,
      color: '#25D366',
      preview: 'The first home exchange system built for UN staff — not tourists.',
      href: `https://wa.me/?text=${encWa}${enc}`,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Icons.email,
      color: '#c9a84c',
      preview: 'The first home exchange system built for UN staff — not tourists.',
      href: `mailto:?subject=${encodeURIComponent('Join the UnSwap waitlist')}&body=${encWa}${enc}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: Icons.telegram,
      color: '#24A1DE',
      preview: 'The first home exchange system built for UN staff \u2014 not tourists.',
      href: `https://t.me/share/url?url=${enc}&text=${encodeURIComponent(MSG_WHATSAPP)}`,
    },
  ];
}

// ─── Main SharePage component ───────────────────────────────────────────────
export default function SharePage() {
  useMetaPixel();
  const [shareUrl, setShareUrl] = useState('https://www.unswap.net');
  const [isPersonal, setIsPersonal] = useState(false);
  const [copiedId, setCopiedId] = useState(null); // 'link' | template id
  const [loadingRef, setLoadingRef] = useState(true);
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({ position: '-', points: '-', referrals: '-' });

  // Confetti on page load — always fires regardless of email param
  useEffect(() => {
    const timer = setTimeout(() => confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.65 },
      colors: ['#C9A84C', '#F5F0E8', '#0A0E1A'],
    }), 400);
    return () => clearTimeout(timer);
  }, []);

  // Read email from URL query param ?email=... then fetch personal referral url
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (!emailParam) { setLoadingRef(false); return; }
    setEmail(emailParam);

    api.waitlist.getStatus(emailParam)
      .then(data => {
        if (data.found) {
          if (data.referral_code) {
            setShareUrl(`https://www.unswap.net/?ref=${data.referral_code}`);
            // Save the raw code for Twitter's backend proxy URL
            setReferralCode(data.referral_code);
          } else if (data.thank_you_url) {
            setShareUrl(data.thank_you_url);
          }
          setIsPersonal(true);

          if (data.subscriber) {
             setStats({
                position: data.subscriber.position || '-',
                points: data.subscriber.points || '0',
                referrals: data.subscriber.total_referrals || '0'
             });
             // Secondary burst once stats are loaded
             setTimeout(() => confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.55 },
                colors: ['#C9A84C', '#F5F0E8', '#0A0E1A']
             }), 300);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);

  const platformButtons = buildPlatformButtons(shareUrl);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId('link');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyTemplate = async (id, content) => {
    const text = content.replace('[LINK]', shareUrl);
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className="min-h-screen text-ivory font-sans relative overflow-x-hidden"
      style={{ background: 'var(--navy)' }}
    >
      {/* Meta Pixel noscript fallback */}
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1309675737735561&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at 70% 10%, rgba(201,168,76,0.10) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-12 sm:py-16 pb-28">

        {/* ── Logo ── */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="UnSwap" className="w-20 h-20 object-contain" />
        </div>

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <h1
            className="text-[38px] sm:text-[48px] font-light leading-[1.1] mb-2"
            style={{ fontFamily: 'var(--serif)', color: 'var(--gold)' }}
          >
            You're on the waitlist!
          </h1>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border mb-9" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.2)' }}>
              <span className="text-[15px] font-medium" style={{ color: 'var(--ivory)' }}>Unswap</span>
              <span className="text-[16px]" style={{ lineHeight: 1 }}>🤝</span>
              <span className="text-[15px]" style={{ color: 'rgba(245,240,232,0.8)' }}>{email}</span>
          </div>

          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-[20px] font-medium tracking-wide mb-2" style={{ color: 'var(--gold)' }}>Refer friends +30</h3>
            <p className="text-[14px] leading-relaxed mb-4" style={{ color: 'rgba(245,240,232,0.7)' }}>
                Share your referral link and earn points for each friend who joins! The link below has some resources you can use for sharing, think of it as inspiration for your post content, just copy, edit and share it to along with your link.
            </p>
            <p className="text-[14px] leading-relaxed italic" style={{ color: 'rgba(201,168,76,0.8)' }}>
                Perks include 5% discount for every person that you refer and others coming soon.
            </p>
          </div>
        </div>


        {/* ── Your referral link ── */}
        <div
          className="rounded-lg p-5 mb-8 border"
          style={{
            background: 'rgba(10,14,26,0.6)',
            borderColor: isPersonal ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.15)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] tracking-[0.18em] uppercase font-medium" style={{ color: 'rgba(245,240,232,0.5)' }}>
              {isPersonal ? '✦ Your Personal Referral Link' : 'Share Link'}
            </p>
            {loadingRef && (
              <svg className="animate-spin w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent font-mono text-[13px] truncate border-none outline-none"
              style={{ color: isPersonal ? 'var(--gold-light)' : 'var(--ivory)' }}
            />
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium tracking-wide uppercase transition-all rounded"
              style={{
                background: copiedId === 'link' ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.1)',
                color: 'var(--gold)',
                border: '1px solid rgba(201,168,76,0.25)',
              }}
            >
              {copiedId === 'link' ? Icons.check : Icons.copy}
              {copiedId === 'link' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* ── Platform buttons ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {platformButtons.map((btn) => (
            <a
              key={btn.id}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              title={btn.preview}
              className="flex items-center gap-2.5 px-4 py-3.5 rounded border transition-all hover:-translate-y-0.5 hover:shadow-lg text-[13px] font-medium"
              style={{
                background: 'rgba(10,14,26,0.5)',
                borderColor: 'rgba(201,168,76,0.15)',
                color: 'var(--ivory)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = btn.color;
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.background = `${btn.color}28`;
                const icon = e.currentTarget.querySelector('span');
                if (icon) icon.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)';
                e.currentTarget.style.color = 'var(--ivory)';
                e.currentTarget.style.background = 'rgba(10,14,26,0.5)';
                const icon = e.currentTarget.querySelector('span');
                if (icon) icon.style.color = btn.color;
              }}
            >
              <span style={{ color: btn.color }}>{btn.icon}</span>
              {btn.label}
            </a>
          ))}
        </div>

        {/* ── Native share (mobile) moved below ── */}
        <NativeShareButton shareUrl={shareUrl} />

        {/* ── Waitlist Stats (Single Line) ── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-8" style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}>
           <div className="flex items-center gap-3">
               <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(245,240,232,0.5)' }}>Position</span>
               <span className="text-[18px] sm:text-[20px] font-light leading-none" style={{ fontFamily: 'var(--serif)', color: 'var(--gold)' }}>#{stats.position}</span>
           </div>
           <div className="hidden sm:block w-px h-5" style={{ background: 'rgba(201,168,76,0.2)' }} />
           <div className="flex items-center gap-3">
               <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(245,240,232,0.5)' }}>Points</span>
               <span className="text-[18px] sm:text-[20px] font-light leading-none" style={{ fontFamily: 'var(--serif)', color: 'var(--ivory)' }}>{stats.points}</span>
           </div>
           <div className="hidden sm:block w-px h-5" style={{ background: 'rgba(201,168,76,0.2)' }} />
           <div className="flex items-center gap-3">
               <span className="text-[11px] uppercase tracking-wider" style={{ color: 'rgba(245,240,232,0.5)' }}>Referrals</span>
               <span className="text-[18px] sm:text-[20px] font-light leading-none" style={{ fontFamily: 'var(--serif)', color: 'var(--ivory)' }}>{stats.referrals}</span>
           </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-16 text-center">
          <a
            href="/"
            className="text-[11px] tracking-[0.18em] uppercase font-medium transition-colors"
            style={{ color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}
          >
            ← Back to Waitlist
          </a>
        </div>
      </div>

      {/* ── Fixed Bottom Banner ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        padding: '14px 20px',
        background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(15,20,35,0.97) 100%)',
        borderTop: '1px solid rgba(201,168,76,0.28)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
      }}>
        <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.65)', letterSpacing: '0.02em' }}>
          Want to skip the queue?
        </span>
        <a
          href="https://unswap-sales.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#c9a84c', color: '#0a0e1a',
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none', padding: '9px 20px', borderRadius: '4px',
            transition: 'background .2s, transform .15s',
            boxShadow: '0 2px 16px rgba(201,168,76,0.3)',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#e4c97a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Get Early Access
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
