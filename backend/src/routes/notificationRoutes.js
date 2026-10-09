const express = require("express");

const {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

module.exports = router;
