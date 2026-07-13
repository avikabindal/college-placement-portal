const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword, getTPOAuditLogs } = require("../controllers/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);
router.get("/tpo-logs", authMiddleware, getTPOAuditLogs);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", authMiddleware, resetPassword);

module.exports = router;