import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { api } from '../api/apiClient.js';

// ─── Meta Pixel ──────────────────────────────────────────────────────────────
function useMetaPixel() {
  useEffect(() => {
    if (window.fbq) return;
    const s = document.createElement('script');
    s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1309675737735561');fbq('track','PageView');`;
    document.head.appendChild(s);
  }, []);
}

// ─── Animated counter ────────────────────────────────────────────────────────
function useCounter(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const n = parseInt(target, 10);
    if (isNaN(n)) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * n));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── Share messages ──────────────────────────────────────────────────────────
const MSG_WHATSAPP = "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals \u2014 not tourists. If your home sits empty during postings, get on this waitlist before it opens:";
const MSG_LINKEDIN = "I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering \u2014 and she built the solution specifically for people with security clearances.\n\nJoin the waitlist here:";
const MSG_TWITTER  = "Diplomat A: $60K on serviced apartments, home unprotected for 18 months.\nDiplomat B: $0 on accommodation, home with a vetted UN peer, three future exchanges lined up.\n\nSame posting. One decision. Join the waitlist:";
const MSG_FACEBOOK = "You know the 3am feeling when you're posted abroad and you wonder if everything's okay at home? Jacqueline Tsuma built the answer to that.\n\nSecure your spot on the waitlist:";

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 1, title: "The Calculation",     subtitle: "Best for: LinkedIn or professional networks",          content: "I found someone who calculated what diplomatic professionals actually lose on accommodation across a full career. The number is staggering \u2014 and she built the solution specifically for people with security clearances.\n\nJoin the waitlist here: [LINK]" },
  { id: 2, title: "The 'Finally'",       subtitle: "Best for: UN / Foreign Service WhatsApp groups",       content: "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals \u2014 not tourists. If your home sits empty during postings, get on this waitlist before it opens: [LINK]" },
  { id: 3, title: "The Specific Pain",   subtitle: "Best for: Personal storytelling or 1-on-1 outreach",  content: "You know the 3am feeling when you're posted abroad and you wonder if everything's okay at home? Jacqueline Tsuma built the answer to that.\n\nSecure your spot on the waitlist: [LINK]" },
  { id: 4, title: "The Contrast",        subtitle: "Best for: High-impact posts",                          content: "Diplomat A: $60K on serviced apartments, home unprotected for 18 months.\nDiplomat B: $0 on accommodation, home with a vetted UN peer, three future exchanges lined up.\n\nSame posting. One decision. Join the waitlist: [LINK]" },
  { id: 5, title: "The Credibility Pass", subtitle: "Best for: Establishing authority and trust",          content: "A former UN advisor built a vetted home exchange network specifically for diplomatic professionals \u2014 verified by institutional credentials, not star ratings. If you own a home that sits empty during postings, this is for you: [LINK]" },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.118 1.528 5.845L.057 23.5l5.797-1.521A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.903a9.874 9.874 0 01-5.036-1.378l-.36-.214-3.742.981.999-3.648-.235-.374A9.86 9.86 0 012.097 12C2.097 6.527 6.527 2.097 12 2.097 17.473 2.097 21.903 6.527 21.903 12S17.473 21.903 12 21.903z"/></svg>,
  twitter:  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  telegram: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
  email:    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  copy:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width="16" height="16" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>,
  native:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width="20" height="20" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>,
  chevron:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width="16" height="16" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>,
  arrow:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} width="14" height="14" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>,
};

// ─── Platform button config ───────────────────────────────────────────────────
function buildPlatformButtons(shareUrl) {
  const enc        = encodeURIComponent(shareUrl);
  const encWa      = encodeURIComponent(`${MSG_WHATSAPP} `);
  const encLi      = encodeURIComponent(`${MSG_LINKEDIN} `);
  const encTw      = encodeURIComponent(`${MSG_TWITTER} `);
  const encFb      = encodeURIComponent(`${MSG_FACEBOOK} `);
  let code = null;
  try { code = new URL(shareUrl).searchParams.get('ref'); } catch (_) {}
  const ogUrl    = code ? `https://www.unswap.net/ref/${code}` : `https://www.unswap.net/ref/home`;
  const encProxy = encodeURIComponent(ogUrl);
  return [
    { id: 'linkedin',  label: 'LinkedIn',   icon: Icons.linkedin,  color: '#0A66C2', href: `https://www.linkedin.com/shareArticle?mini=true&url=${encProxy}&summary=${encLi}` },
    { id: 'twitter',   label: 'X / Twitter', icon: Icons.twitter,  color: '#1D9BF0', href: `https://twitter.com/intent/tweet?text=${encTw}&url=${encProxy}` },
    { id: 'facebook',  label: 'Facebook',   icon: Icons.facebook,  color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${encProxy}&quote=${encFb}` },
    { id: 'whatsapp',  label: 'WhatsApp',   icon: Icons.whatsapp,  color: '#25D366', href: `https://wa.me/?text=${encWa}${enc}` },
    { id: 'email',     label: 'Email',      icon: Icons.email,     color: '#c9a84c', href: `mailto:?subject=${encodeURIComponent('Join the UnSwap waitlist')}&body=${encWa}${enc}` },
    { id: 'telegram',  label: 'Telegram',   icon: Icons.telegram,  color: '#24A1DE', href: `https://t.me/share/url?url=${enc}&text=${encodeURIComponent(MSG_WHATSAPP)}` },
  ];
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', bottom: '88px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(201,168,76,0.96)', color: '#0a0e1a',
            padding: '10px 22px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em',
            zIndex: 3000, boxShadow: '0 4px 24px rgba(201,168,76,0.4)',
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          ✓ {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Native share button ──────────────────────────────────────────────────────
function NativeShareButton({ shareUrl, onShare }) {
  const [used, setUsed] = useState(false);
  if (!navigator.share) return null;
  const handle = async () => {
    try {
      await navigator.share({ title: 'Join Unswap — Exclusive Waitlist', text: `${MSG_WHATSAPP} `, url: shareUrl });
      setUsed(true);
      onShare?.();
    } catch (_) {}
  };
  return (
    <button
      onClick={handle}
      aria-label="Open native share sheet"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', background: 'var(--gold)', color: 'var(--navy)',
        fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '14px', border: 'none', cursor: 'pointer', borderRadius: '8px',
        boxShadow: '0 4px 24px rgba(201,168,76,0.25)', transition: 'transform 0.15s, background 0.2s',
        marginTop: '4px',
      }}
      onMouseOver={e => { e.currentTarget.style.background = 'var(--gold-light)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e =>  { e.currentTarget.style.background = 'var(--gold)';       e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {Icons.native}
      {used ? 'Shared!' : 'Share via…'}
    </button>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────
function TemplateCard({ template, shareUrl, copiedId, onCopy }) {
  const text     = template.content.replace('[LINK]', shareUrl);
  const isCopied = copiedId === template.id;
  return (
    <div className={`border rounded-[10px] p-4 transition-all duration-200 ${isCopied ? 'border-[rgba(201,168,76,0.5)] bg-[rgba(201,168,76,0.06)]' : 'border-[rgba(201,168,76,0.15)] bg-[rgba(10,14,26,0.5)]'}`}>
      <div className="flex justify-between items-start gap-3 mb-2.5">
        <div>
          <p className="text-[13px] font-semibold text-[var(--gold)] mb-0.5">{template.title}</p>
          <p className="text-[11px] text-[rgba(245,240,232,0.4)] tracking-[0.04em]">{template.subtitle}</p>
        </div>
        <button
          onClick={() => onCopy(template.id, text)}
          aria-label={`Copy ${template.title} message`}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold tracking-[0.08em] uppercase cursor-pointer transition-colors duration-200 border text-[var(--gold)] border-[rgba(201,168,76,0.25)] ${isCopied ? 'bg-[rgba(201,168,76,0.25)]' : 'bg-[rgba(201,168,76,0.1)] hover:bg-[rgba(201,168,76,0.18)]'}`}
        >
          {isCopied ? Icons.check : Icons.copy}
          {isCopied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[13px] leading-relaxed text-[rgba(245,240,232,0.6)] whitespace-pre-line line-clamp-3">
        {text}
      </p>
    </div>
  );
}

// ─── Stat item ────────────────────────────────────────────────────────────────
function StatItem({ label, value, gold }) {
  const n   = parseInt(value, 10);
  const num = useCounter(isNaN(n) ? 0 : n);
  const display = value === '-' ? '—' : (isNaN(n) ? value : (label === 'Position' ? `#${num}` : num));
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontFamily: 'var(--serif)', fontWeight: 400, lineHeight: 1, color: gold ? 'var(--gold)' : 'var(--ivory)', marginBottom: '5px' }}>
        {display}
      </div>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(245,240,232,0.4)' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Images modal ─────────────────────────────────────────────────────────────
const SHARE_IMAGES = [
  { src: '/social-preview.png', name: 'unswap-share.png',     ratio: '16/9', label: 'Wide Banner' },
  { src: '/share-img-1.png',    name: 'unswap-home.png',      ratio: '1/1',  label: 'Home' },
  { src: '/share-img-2.png',    name: 'unswap-travel.png',    ratio: '1/1',  label: 'Travel' },
  { src: '/share-img-3.png',    name: 'unswap-lifestyle.png', ratio: '1/1',  label: 'Lifestyle' },
];

function ImagesModal({ show, onClose, onDownload }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!show) return;
    const el = ref.current;
    const focusable = el?.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog" aria-modal="true" aria-label="Shareable images gallery"
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <motion.div
            ref={ref}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="no-scrollbar"
            style={{
              maxWidth: '560px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
              background: 'var(--navy)', border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '14px', padding: '28px', position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close image gallery"
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'rgba(245,240,232,0.06)', border: '1px solid rgba(245,240,232,0.1)',
                borderRadius: '6px', color: 'rgba(245,240,232,0.5)',
                cursor: 'pointer', padding: '6px', lineHeight: 0,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; }}
              onMouseOut={e =>  { e.currentTarget.style.color = 'rgba(245,240,232,0.5)'; e.currentTarget.style.background = 'rgba(245,240,232,0.06)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h3 style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '6px', fontFamily: 'var(--serif)', fontWeight: 400 }}>
              Shareable Images
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(245,240,232,0.55)', marginBottom: '20px', lineHeight: 1.5 }}>
              Click any image to download it for your post.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHARE_IMAGES.map((img, i) => (
                <div
                  key={i}
                  role="button" tabIndex={0}
                  aria-label={`Download ${img.label} image`}
                  onClick={() => onDownload(img.src, img.name)}
                  onKeyDown={e => e.key === 'Enter' && onDownload(img.src, img.name)}
                  className="relative cursor-pointer rounded-lg overflow-hidden border border-[rgba(201,168,76,0.15)] transition-all duration-200 hover:border-[rgba(201,168,76,0.5)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(201,168,76,0.15)] group"
                >
                  <img src={img.src} alt={img.label} className="w-full block object-cover" style={{ aspectRatio: img.ratio }} />
                  <div className="absolute bottom-0 left-0 right-0 py-1.5 px-2 bg-gradient-to-t from-[rgba(10,14,26,0.85)] to-transparent text-[10px] font-medium tracking-[0.08em] uppercase text-[rgba(245,240,232,0.7)]">
                    {img.label}
                  </div>
                  <div className="absolute inset-0 bg-[rgba(10,14,26,0.65)] flex flex-col items-center justify-center gap-1.5 text-[var(--gold)] text-xs font-semibold tracking-[0.08em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {Icons.download} Download
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SharePage() {
  useMetaPixel();

  const [shareUrl,       setShareUrl]       = useState('https://www.unswap.net');
  const [referralCode,   setReferralCode]   = useState(null);   // FIX: was missing
  const [isPersonal,     setIsPersonal]     = useState(false);
  const [copiedId,       setCopiedId]       = useState(null);
  const [loadingRef,     setLoadingRef]     = useState(true);
  const [email,          setEmail]          = useState('');
  const [stats,          setStats]          = useState({ position: '-', points: '-', referrals: '-' });
  const [showModal,      setShowModal]      = useState(false);
  const [toast,          setToast]          = useState({ visible: false, message: '' });
  const [hasShared,      setHasShared]      = useState(false);
  const [showTemplates,  setShowTemplates]  = useState(false);

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2200);
  }, []);

  const downloadImage = (src, filename) => {
    fetch(src).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  };

  // Confetti on mount
  useEffect(() => {
    const t = setTimeout(() => confetti({ particleCount: 120, spread: 72, origin: { y: 0.65 }, colors: ['#C9A84C', '#F5F0E8', '#0A0E1A'] }), 400);
    return () => clearTimeout(t);
  }, []);

  // Load referral data
  useEffect(() => {
    const params     = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (!emailParam) { setLoadingRef(false); return; }
    setEmail(emailParam);

    api.waitlist.getStatus(emailParam)
      .then(data => {
        if (!data.found) return;
        if (data.referral_code) {
          setShareUrl(`https://www.unswap.net/?ref=${data.referral_code}`);
          setReferralCode(data.referral_code);           // FIX: now declared above
        } else if (data.thank_you_url) {
          setShareUrl(data.thank_you_url);
        }
        setIsPersonal(true);
        if (data.subscriber) {
          setStats({
            position:  data.subscriber.position        || '-',
            points:    data.subscriber.points          || '0',
            referrals: data.subscriber.total_referrals || '0',
          });
          setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.55 }, colors: ['#C9A84C', '#F5F0E8', '#0A0E1A'] }), 300);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);

  const platformButtons = buildPlatformButtons(shareUrl);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId('link');
    showToast('Referral link copied!');
    setHasShared(true);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyTemplate = async (id, text) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Message copied!');
    setHasShared(true);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const refs    = parseInt(stats.referrals, 10) || 0;
  const nextMil = refs < 1 ? 1 : refs < 5 ? 5 : refs < 10 ? 10 : null;

  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden" style={{ background: 'var(--navy)', color: 'var(--ivory)' }}>
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=1309675737735561&ev=PageView&noscript=1" alt="" />
      </noscript>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse at 70% 10%, rgba(201,168,76,0.10) 0%, transparent 60%)', zIndex: 0 }} />

      <Toast message={toast.message} visible={toast.visible} />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-12 sm:py-16" style={{ paddingBottom: '120px' }}>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="UnSwap" style={{ width: 112, height: 112, objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.35))' }} />
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--gold)', fontSize: 'clamp(34px,6vw,52px)', fontWeight: 300, lineHeight: 1.1, marginBottom: '16px' }}>
            You're on the waitlist!
          </h1>

          {/* Email badge — conditional */}
          {email && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '8px 18px', borderRadius: '99px', marginBottom: '24px',
              background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--ivory)' }}>Unswap</span>
              <span style={{ fontSize: '16px' }}>🤝</span>
              <span style={{ fontSize: '14px', color: 'rgba(245,240,232,0.75)' }}>{email}</span>
            </div>
          )}

          <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(245,240,232,0.65)', maxWidth: '440px', margin: '0 auto 8px' }}>
            Share your referral link and earn <strong style={{ color: 'var(--gold)' }}>+30 points</strong> per friend who joins. Use a ready-made caption below to make it effortless.
          </p>
          {isPersonal && (
            <p style={{ fontSize: '13px', color: 'rgba(201,168,76,0.7)', fontStyle: 'italic' }}>
              Perk: 5% discount on your plan for every referral.
            </p>
          )}
        </div>

        {/* Referral link box */}
        <div style={{
          borderRadius: '12px', padding: '18px 20px', marginBottom: '20px',
          background: 'rgba(10,14,26,0.6)',
          border: `1px solid ${isPersonal ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.15)'}`,
          boxShadow: isPersonal ? '0 0 32px rgba(201,168,76,0.05)' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(245,240,232,0.45)' }}>
              {isPersonal ? '✦ Your Personal Referral Link' : 'Share Link'}
            </p>
            {loadingRef && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--gold)' }}>
                <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              readOnly value={shareUrl} aria-label="Your referral link"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'monospace', fontSize: '13px',
                color: isPersonal ? 'var(--gold-light)' : 'var(--ivory)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={copyLink} aria-label="Copy referral link"
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'background 0.2s',
                background: copiedId === 'link' ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.1)',
                color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)',
              }}
            >
              {copiedId === 'link' ? Icons.check : Icons.copy}
              {copiedId === 'link' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Platform buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
          {platformButtons.map(btn => (
            <a
              key={btn.id} href={btn.href} target="_blank" rel="noopener noreferrer"
              aria-label={`Share on ${btn.label}`}
              onClick={() => setHasShared(true)}
              className="platform-btn flex items-center gap-2.5 p-3 sm:py-3 sm:px-4 rounded-[10px] border border-[rgba(201,168,76,0.15)] bg-[rgba(10,14,26,0.5)] text-[var(--ivory)] text-[13px] font-medium no-underline"
              style={{
                '--btn-color': btn.color,
                '--btn-bg': `${btn.color}20`,
                '--btn-glow': `0 6px 20px ${btn.color}22`
              }}
            >
              <span style={{ color: btn.color, flexShrink: 0 }}>{btn.icon}</span>
              {btn.label}
            </a>
          ))}
        </div>

        {/* Native share (mobile only) */}
        <NativeShareButton shareUrl={shareUrl} onShare={() => setHasShared(true)} />

        {/* Ready-made captions — collapsible */}
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setShowTemplates(v => !v)}
            aria-expanded={showTemplates}
            aria-controls="template-list"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '10px', padding: '14px 18px', cursor: 'pointer',
              color: 'var(--gold)', fontSize: '13px', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
            onMouseOut={e =>  e.currentTarget.style.background = 'rgba(201,168,76,0.06)'}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Ready-made captions ({TEMPLATES.length})
            </span>
            <motion.span animate={{ rotate: showTemplates ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
              {Icons.chevron}
            </motion.span>
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                id="template-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {TEMPLATES.map(t => (
                    <TemplateCard key={t.id} template={t} shareUrl={shareUrl} copiedId={copiedId} onCopy={copyTemplate} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Download lifestyle images */}
        <button
          onClick={() => setShowModal(true)}
          aria-label="Open shareable images gallery"
          style={{
            width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '10px', padding: '13px 18px', cursor: 'pointer',
            color: 'rgba(245,240,232,0.6)', fontSize: '13px',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.05)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'var(--gold)'; }}
          onMouseOut={e =>  { e.currentTarget.style.background = 'none';                   e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; e.currentTarget.style.color = 'rgba(245,240,232,0.6)'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Download lifestyle images for your post
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Stats */}
        <div className="mt-10 pt-7 border-t border-[rgba(201,168,76,0.15)]">
          <div className="flex justify-center items-center divide-x divide-[rgba(201,168,76,0.15)]">
            <div className="px-4 sm:px-9"><StatItem label="Position"  value={stats.position}  gold /></div>
            <div className="px-4 sm:px-9"><StatItem label="Points"    value={stats.points} /></div>
            <div className="px-4 sm:px-9"><StatItem label="Referrals" value={stats.referrals} /></div>
          </div>
          {/* Motivational nudge */}
          {isPersonal && nextMil && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: 'rgba(201,168,76,0.65)', letterSpacing: '0.03em' }}
            >
              Refer {nextMil - refs} more friend{nextMil - refs !== 1 ? 's' : ''} to reach {nextMil} referral{nextMil !== 1 ? 's' : ''} 🏆
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <a
            href="/"
            style={{ fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(245,240,232,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}
          >
            ← Back to Waitlist
          </a>
        </div>
      </div>

      {/* Images modal */}
      <ImagesModal show={showModal} onClose={() => setShowModal(false)} onDownload={downloadImage} />

      {/* Bottom banner — only appears after first share action */}
      <AnimatePresence>
        {hasShared && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
              padding: '14px 20px',
              background: 'linear-gradient(135deg, rgba(10,14,26,0.97) 0%, rgba(15,20,35,0.97) 100%)',
              borderTop: '1px solid rgba(201,168,76,0.25)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '16px', flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '13px', color: 'rgba(245,240,232,0.65)' }}>Want to skip the queue?</span>
            <a
              href="https://unswap-sales.vercel.app/" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#c9a84c', color: '#0a0e1a',
                fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                textDecoration: 'none', padding: '9px 20px', borderRadius: '4px',
                transition: 'background .2s, transform .15s',
                boxShadow: '0 2px 16px rgba(201,168,76,0.3)',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#e4c97a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e =>  { e.currentTarget.style.background = '#c9a84c'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Get Early Access {Icons.arrow}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
