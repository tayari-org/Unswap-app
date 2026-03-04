const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token required' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            req.user = user;
        } catch (_) {
            // Token invalid — continue without user
        }
        next();
    } catch (err) {
        next();
    }
};

module.exports = { requireAuth, requireAdmin, optionalAuth };
