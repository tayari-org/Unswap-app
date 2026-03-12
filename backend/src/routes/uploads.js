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
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Accepted: JPEG, PNG, WebP, GIF, PDF'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

// POST /api/upload
router.post('/', requireAuth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            console.error('[Upload] No file provided in request');
            return res.status(400).json({ error: 'No file provided' });
        }

        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const file_url = `${baseUrl}/uploads/${req.file.filename}`;

        res.json({ file_url, filename: req.file.filename, size: req.file.size });
    } catch (error) {
        console.error('[Upload] Internal Error:', error);
        res.status(500).json({ error: 'Internal server error during upload' });
    }
});

module.exports = router;
