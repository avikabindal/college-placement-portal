const express = require("express");
const router = express.Router();
const { listNotifications, markAllRead, markRead } = require("../controllers/notification.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.get("/", authMiddleware, listNotifications);
router.put("/mark-read", authMiddleware, markAllRead);
router.put("/:id/read", authMiddleware, markRead);

module.exports = router;
