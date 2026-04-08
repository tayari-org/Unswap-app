const express = require('express');
const { prisma } = require('../db');
const router = express.Router();

// Known social media crawler user-agents
const CRAWLER_AGENTS = /facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp|Slackbot|TelegramBot|Discordbot|pinterest|bingbot|Googlebot-Image|bot|crawl|spider/i;
// Specific bots for tailored copy (if needed)
const FACEBOOK_BOT = /facebookexternalhit/i;

const SITE_NAME = 'Unswap';
const SITE_URL = process.env.WAITLIST_FRONTEND_URL || 'https://www.unswap.net';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.unswap.com';
const OG_IMAGE_URL = 'https://www.unswap.net/social-preview.png';

// ─── GET /ref/:code ──────────────────────────────────────────────────────────
router.get('/:code', async (req, res) => {
    const { code } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    let name = null;
    let thankYouUrl = SITE_URL;

    try {
        // Look up the referral code in the local shadow DB
        const entry = await prisma.waitlistEntry.findFirst({
            where: { referral_code: code },
            select: { full_name: true, thank_you_url: true }
        });

        if (entry) {
            name = entry.full_name;
            if (entry.thank_you_url) thankYouUrl = entry.thank_you_url;
        }
    } catch (err) {
        console.error('[OG Proxy] DB Error lookup:', err);
        // We catch here so the crawler logic below still fires with default text!
    }

    const referralUrl = `${SITE_URL}?ref=${encodeURIComponent(code)}`;
    const canonicalUrl = code === 'home' ? SITE_URL : referralUrl;

    // ── Build personalised copy ──────────────────────────────────────────
    const ogTitle = name
        ? `${name.split(' ')[0]} invited you to join Unswap`
        : 'Join the Unswap Waitlist';

    const ogDescription = name
        ? `${name.split(' ')[0]} thinks you should be on this — a closed-loop home exchange network for UN staff and foreign service professionals. Join via their personal invite link.`
        : 'A closed-loop home exchange ecosystem exclusively for verified UN, World Bank, IMF and foreign service professionals.';

    // ── Crawlers: serve static OG HTML ───────────────────────────────────
    if (CRAWLER_AGENTS.test(userAgent)) {
        const isFacebookBot = FACEBOOK_BOT.test(userAgent);

        let finalOgTitle = ogTitle;
        let finalOgDescription = ogDescription;

        if (isFacebookBot) {
            finalOgTitle = "This is the first home exchange system I've seen that was actually built for UN staff and foreign service professionals \u2014 not tourists. If your home sits empty during postings, get on this waitlist before it opens:";
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${finalOgTitle}</title>

  <!-- Twitter / X Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:site"        content="@unswap" />
  <meta name="twitter:title"       content="${finalOgTitle}" />
  <meta name="twitter:description" content="${finalOgDescription}" />
  <meta name="twitter:image"       content="${OG_IMAGE_URL}" />
  <meta name="twitter:image:src"   content="${OG_IMAGE_URL}" />
  <meta name="twitter:image:alt"   content="Unswap. Home exchange for UN and diplomatic professionals" />

  <!-- Open Graph -->
  <meta property="og:type"             content="website" />
  <meta property="og:url"              content="${canonicalUrl}" />
  <meta property="og:site_name"        content="${SITE_NAME}" />
  <meta property="og:title"            content="${finalOgTitle}" />
  <meta property="og:description"      content="${finalOgDescription}" />
  <meta property="og:image"            content="${OG_IMAGE_URL}" />
  <meta property="og:image:secure_url" content="${OG_IMAGE_URL}" />
  <meta property="og:image:width"      content="1200" />
  <meta property="og:image:height"     content="630" />
  <meta property="og:image:type"       content="image/png" />
  <meta property="og:image:alt"        content="Unswap. Home exchange for UN and diplomatic professionals" />
</head>
<body>
  <p>Redirecting you to Unswap…</p>
  <script>window.location.replace('${thankYouUrl}');</script>
</body>
</html>`;

        return res
            .status(200)
            .setHeader('Content-Type', 'text/html; charset=utf-8')
            .setHeader('Cache-Control', 'public, max-age=300')
            .send(html);
    }

    // ── Real browsers: straight 302 to React app ─────────────────────────
    return res.redirect(302, referralUrl);
});

module.exports = router;
