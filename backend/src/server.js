require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const entitiesRouter = require('./routes/entities');
const functionsRouter = require('./routes/functions');
const uploadsRouter = require('./routes/uploads');
const emailRouter = require('./routes/email');
const webhookRouter = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
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
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Unswap backend running on http://localhost:${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
});

module.exports = app;
