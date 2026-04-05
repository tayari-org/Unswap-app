const express = require('express');
const { prisma } = require('../db');
const router = express.Router();

// Known social media crawler user-agents
// X sends: Twitterbot/1.0, also sometimes via: bot, crawl, spider
const CRAWLER_AGENTS = /facebookexternalhit|LinkedInBot|Twitterbot|Twitterbot\/|WhatsApp|Slackbot|TelegramBot|Discordbot|pinterest|bingbot|Googlebot-Image|bot|crawl|spider/i;

const SITE_NAME    = 'Unswap';
const SITE_URL     = process.env.WAITLIST_FRONTEND_URL || 'https://www.unswap.net';
const BACKEND_URL  = process.env.BACKEND_URL || 'https://api.unswap.com';
const OG_IMAGE_URL = 'https://www.unswap.net/social-preview.png';
const TWITTER_IMAGE_URL = 'https://www.unswap.net/twitter-preview.png';

// ─── GET /ref/:code ──────────────────────────────────────────────────────────
// - Social crawlers  → receive static HTML with OG/Twitter card tags
// - Real browsers    → 302 redirect to the React app with ?ref=CODE appended
// NOTE: No meta http-equiv refresh in crawler HTML — Twitterbot follows it
//       before finishing meta tag parsing, causing it to land on the SPA.
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
        const referralUrl    = `${SITE_URL}?ref=${encodeURIComponent(code)}`;
        // The canonical URL for OG/Twitter must be THIS page (the one crawlers hit),
        // NOT the frontend redirect — otherwise X re-crawls an SPA with no meta tags.
        const canonicalUrl   = `${BACKEND_URL}/ref/${code}`;

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

  <!-- Twitter / X Card — must appear FIRST; Twitterbot is order-sensitive -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@unswap" />
  <meta name="twitter:title"       content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image"       content="${TWITTER_IMAGE_URL}" />
  <meta name="twitter:image:src"   content="${TWITTER_IMAGE_URL}" />
  <meta name="twitter:image:alt"   content="Unswap — Home exchange for UN and diplomatic professionals" />

  <!-- Open Graph (Facebook, LinkedIn, WhatsApp, etc.) -->
  <meta property="og:type"             content="website" />
  <meta property="og:url"              content="${canonicalUrl}" />
  <meta property="og:site_name"        content="${SITE_NAME}" />
  <meta property="og:title"            content="${ogTitle}" />
  <meta property="og:description"      content="${ogDescription}" />
  <meta property="og:image"            content="${OG_IMAGE_URL}" />
  <meta property="og:image:secure_url" content="${OG_IMAGE_URL}" />
  <meta property="og:image:width"      content="1200" />
  <meta property="og:image:height"     content="630" />
  <meta property="og:image:type"       content="image/png" />
  <meta property="og:image:alt"        content="Unswap — Home exchange for UN and diplomatic professionals" />
</head>
<body>
  <p>Redirecting you to Unswap…</p>
  <!-- JS redirect for browsers that land here directly (crawlers ignore this) -->
  <script>window.location.replace('${thankYouUrl}');<\/script>
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
