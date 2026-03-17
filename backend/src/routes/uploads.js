/**
 * File upload route
 * Replaces: base44.integrations.Core.UploadFile({ file })
 * Returns: { file_url: string }
 *
 * POST /api/upload
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/webp', 
        'image/gif', 
        'image/svg+xml', 
        'image/avif', 
        'image/heic', 
        'image/heif', 
        'application/pdf'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed (${file.mimetype}). Accepted: JPEG, PNG, WebP, GIF, SVG, AVIF, PDF`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { 
        fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024 
    },
});

const logErrorToFile = (errInfo) => {
    try {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            ...errInfo
        };
        const logPath = path.join(__dirname, '..', '..', 'error_log.txt');
        fs.appendFileSync(logPath, JSON.stringify(errorInfo, null, 2) + '\n---\n');
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
};

// POST /api/upload
router.post('/', requireAuth, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[Upload] Multer Error:', err);
            logErrorToFile({ type: 'MulterError', message: err.message, stack: err.stack });
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('[Upload] Custom Filter Error:', err);
            logErrorToFile({ type: 'FilterError', message: err.message, stack: err.stack });
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (req, res) => {
    try {
        if (!req.file) {
            console.error('[Upload] No file provided in request after processing');
            return res.status(400).json({ error: 'No file provided' });
        }

        console.log(`[Upload] Received file: ${req.file.filename}, Size: ${req.file.size} bytes`);

        const baseUrl = process.env.BACKEND_URL;
        if (!baseUrl) throw new Error('BACKEND_URL is not defined in backend .env');
        // Ensure no double slashes if baseUrl has trailing slash
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const file_url = `${cleanBaseUrl}/uploads/${req.file.filename}`;

        res.json({ file_url, filename: req.file.filename, size: req.file.size });
    } catch (error) {
        console.error('[Upload] Endpoint Internal Error:', error);
        res.status(500).json({ error: 'Internal server error during upload completion' });
    }
});

module.exports = router;
