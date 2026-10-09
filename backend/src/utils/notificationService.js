const pool = require("../config/db");

const createNotifications = async (userIds, notification) => {
    const uniqueUserIds = [
        ...new Set(
            userIds
                .map(Number)
                .filter((id) => Number.isInteger(id) && id > 0)
        ),
    ];

    if (uniqueUserIds.length === 0) {
        return;
    }

    const { title, message, type = "Info" } = notification;
    const placeholders = uniqueUserIds.map(() => "(?, ?, ?, ?)").join(", ");
    const values = uniqueUserIds.flatMap((userId) => [
        userId,
        title,
        message,
        type,
    ]);

    try {
        await pool.execute(
            `INSERT INTO notifications (user_id, title, message, type) VALUES ${placeholders}`,
            values
        );
    } catch (error) {
        console.error("Create notification error:", error.message);
    }
};

const notifyAdmins = async (notification) => {
    try {
        const [users] = await pool.execute(
            "SELECT id FROM users WHERE role = 'Admin' AND status = 'Active'"
        );

        await createNotifications(
            users.map((user) => user.id),
            notification
        );
    } catch (error) {
        console.error("Find notification recipients error:", error.message);
    }
};

const notifyEmployee = async (employeeId, notification) => {
    try {
        const [users] = await pool.execute(
            "SELECT id FROM users WHERE employee_id = ? AND status = 'Active'",
            [employeeId]
        );

        await createNotifications(
            users.map((user) => user.id),
            notification
        );
    } catch (error) {
        console.error("Find notification recipient error:", error.message);
    }
};

module.exports = {
    notifyAdmins,
    notifyEmployee,
};
