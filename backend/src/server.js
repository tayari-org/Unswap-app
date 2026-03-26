require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db');
const { connectWaitlistDB } = require('./db-waitlist');

const authRoutes = require('./routes/auth');
const entitiesRouter = require('./routes/entities');
const functionsRouter = require('./routes/functions');
const uploadsRouter = require('./routes/uploads');
const emailRouter = require('./routes/email');
const webhookRouter = require('./routes/webhook');
const referralsRouter = require('./routes/referrals');
const favoritesRouter = require('./routes/favorites');
const waitlistRouter = require('./routes/waitlist');

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: PORT is not defined in .env');
}

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.WAITLIST_FRONTEND_URL || 'http://localhost:5174'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        // or allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

if (!process.env.FRONTEND_URL) {
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: FRONTEND_URL is not defined in .env');
}

// Rate limiting
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// ─── Stripe webhook (raw body BEFORE json parser) ─────────────────────────────
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }), webhookRouter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/upload', uploadsRouter);
app.use('/api/email', emailRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/waitlist', waitlistRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'unswap-backend' });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const errorInfo = {
        timestamp: new Date().toISOString(),
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
    };
    
    console.error('[Global Error]', errorInfo);

    // Also write to a file for easier debugging if console is hard to read
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '..', 'error_log.txt');
        fs.appendFileSync(logPath, JSON.stringify(errorInfo, null, 2) + '\n---\n');
    } catch (e) {
        console.error('Failed to write to error_log.txt', e);
    }

    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
Promise.all([connectDB(), connectWaitlistDB()]).then(() => {
    app.listen(PORT, () => {
        const url = process.env.BACKEND_URL || `http://localhost:${PORT}`;
        console.log(`\n🚀 Unswap backend running on ${url}`);
        console.log(`   Health: ${url}/api/health\n`);
    });
});

module.exports = app;
