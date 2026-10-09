const pool = require("../config/db");

const getNotifications = async (req, res) => {
    try {
        const [notifications] = await pool.execute(
            `
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 30
            `,
            [req.user.id]
        );

        const [counts] = await pool.execute(
            "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount: Number(counts[0].unread_count || 0),
        });
    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load notifications",
        });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        await pool.execute(
            `
            UPDATE notifications
            SET is_read = 1, read_at = COALESCE(read_at, NOW())
            WHERE id = ? AND user_id = ?
            `,
            [req.params.id, req.user.id]
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Mark notification read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notification",
        });
    }
};

const markAllNotificationsRead = async (req, res) => {
    try {
        const [result] = await pool.execute(
            `
            UPDATE notifications
            SET is_read = 1, read_at = COALESCE(read_at, NOW())
            WHERE user_id = ? AND is_read = 0
            `,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            updated: result.affectedRows,
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notifications",
        });
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};
