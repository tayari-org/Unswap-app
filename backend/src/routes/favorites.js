/**
 * POST /api/favorites/toggle
 * Toggles a property in the current user's saved_properties list
 * and keeps favorites_count on the Property in sync.
 */
const express = require('express');
const { prisma } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/toggle', requireAuth, async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'property_id is required' });

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Parse saved_properties (stored as JSON string)
        let saved = [];
        try { saved = JSON.parse(user.saved_properties || '[]'); } catch { saved = []; }

        const isSaved = saved.includes(property_id);
        const newSaved = isSaved
            ? saved.filter(id => id !== property_id)
            : [...saved, property_id];

        // Update user's saved list
        await prisma.user.update({
            where: { id: req.user.id },
            data: { saved_properties: JSON.stringify(newSaved) },
        });

        // Increment or decrement favorites_count on the property atomically
        await prisma.property.update({
            where: { id: property_id },
            data: { favorites_count: { increment: isSaved ? -1 : 1 } },
        }).catch(() => {/* property may not exist, non-fatal */});

        res.json({ isFavorite: !isSaved, saved_properties: newSaved });
    } catch (err) {
        console.error('Favorites toggle error:', err);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

module.exports = router;
