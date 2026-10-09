const express = require("express");

const {
    register,
    login,
    employeeLogin,
    getMe,
    logout,
    changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/employee-login", employeeLogin);

router.put(
    "/password",
    authMiddleware,
    changePassword
);

router.get(
    "/me",
    authMiddleware,
    getMe
);

router.post(
    "/logout",
    authMiddleware,
    logout
);

module.exports = router;