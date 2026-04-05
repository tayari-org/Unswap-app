const express = require('express');
const { prisma } = require('../db');
const router = express.Router();

// Known social media crawler user-agents
const CRAWLER_AGENTS = /facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|pinterest|bingbot|Googlebot-Image/i;

const SITE_NAME    = 'Unswap';
const SITE_URL     = process.env.WAITLIST_FRONTEND_URL || 'https://www.unswap.net';
const OG_IMAGE_URL = 'https://www.unswap.net/social-preview.png';

// ─── GET /ref/:code ──────────────────────────────────────────────────────────
// - Social crawlers  → receive static HTML with OG tags, then meta-refresh to
//                      the user's Waitlister thank_you_url
// - Real browsers    → 302 redirect to the React app with ?ref=CODE appended
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
    const { code } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    try {
        // Look up the referral code in the local shadow DB
        const entry = await prisma.waitlistEntry.findFirst({
            where: { referral_code: code },
            select: { full_name: true, thank_you_url: true }
        });

        // Fall back gracefully if the code is unknown
        const name        = entry?.full_name  || null;
        const thankYouUrl = entry?.thank_you_url || SITE_URL;
        const referralUrl = `${SITE_URL}?ref=${encodeURIComponent(code)}`;

        // ── Build personalised copy ──────────────────────────────────────────
        const ogTitle = name
            ? `${name.split(' ')[0]} invited you to join Unswap`
            : 'Join the Unswap Waitlist';

        const ogDescription = name
            ? `${name.split(' ')[0]} thinks you should be on this — a closed-loop home exchange network for UN staff and foreign service professionals. Join via their personal invite link.`
            : 'A closed-loop home exchange ecosystem exclusively for verified UN, World Bank, IMF and foreign service professionals.';

        // ── Crawlers: serve static OG HTML ───────────────────────────────────
        if (CRAWLER_AGENTS.test(userAgent)) {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${ogTitle}</title>

  <!-- Open Graph -->
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${referralUrl}" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta property="og:title"       content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image"       content="${OG_IMAGE_URL}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type"   content="image/png" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image"       content="${OG_IMAGE_URL}" />

  <!-- Redirect the (rare) browser that hits this URL directly -->
  <meta http-equiv="refresh" content="0;url=${thankYouUrl}" />
</head>
<body>
  <p>Redirecting you to Unswap…</p>
</body>
</html>`;

            return res
                .status(200)
                .setHeader('Content-Type', 'text/html; charset=utf-8')
                // Let CDNs / proxies cache the HTML briefly (5 min)
                .setHeader('Cache-Control', 'public, max-age=300')
                .send(html);
        }

        // ── Real browsers: straight 302 to React app ─────────────────────────
        return res.redirect(302, referralUrl);

    } catch (err) {
        console.error('[OG Proxy] Error:', err);
        return res.redirect(302, SITE_URL);
    }
});

module.exports = router;
