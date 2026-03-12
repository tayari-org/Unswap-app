const { prisma } = require('../db');

/**
 * Notifies all admins about a significant event.
 * @param {Object} params
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.link - Link to the relevant admin page
 * @param {string} [params.type] - Notification type (default: 'admin_alert')
 */
async function notifyAdmins({ title, message, link, type = 'admin_alert' }) {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { email: true }
        });

        if (admins.length === 0) return;

        const notifications = admins.map(admin => ({
            user_email: admin.email,
            type,
            title,
            message,
            link,
        }));

        await prisma.notification.createMany({
            data: notifications
        });

        console.log(`[AdminNotificationService] Sent "${title}" to ${admins.length} admins.`);
    } catch (err) {
        console.error('[AdminNotificationService] Error notifying admins:', err);
    }
}

module.exports = { notifyAdmins };
