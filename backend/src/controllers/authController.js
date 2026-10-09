const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,

            // Internal database employee ID
            employee_id: user.employee_id,

            // Employee code such as EMP-1001
            employee_code: user.employee_code || null,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

/**
 * POST /api/auth/register
 *
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const {
            employee_id,
            email,
            password,
            role = "Employee",
        } = req.body;

        // Required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long",
            });
        }

        // Check existing email
        const [existingUser] =
            await pool.execute(
                `
                SELECT id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }

        // If employee_id is provided,
        // verify employee exists
        if (employee_id) {
            const [employee] =
                await pool.execute(
                    `
                    SELECT id
                    FROM employees
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [employee_id]
                );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Employee not found",
                });
            }
        }

        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Create user
        const [result] =
            await pool.execute(
                `
                INSERT INTO users
                (
                    employee_id,
                    email,
                    password,
                    role,
                    status
                )
                VALUES (?, ?, ?, ?, 'Active')
                `,
                [
                    employee_id || null,
                    email,
                    hashedPassword,
                    role,
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "User registered successfully",
            userId: result.insertId,
        });

    } catch (error) {
        console.error(
            "Register error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during registration",
            error: error.message,
        });
    }
};


/**
 * POST /api/auth/login
 *
 * Admin / HR Login
 *
 * Uses:
 * Email + Password
 */
const login = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        // Required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required",
            });
        }

        // Find user
        const [users] =
            await pool.execute(
                `
                SELECT
                    u.id,
                    u.employee_id,
                    u.email,
                    u.password,
                    u.role,
                    u.status,

                    e.first_name,
                    e.last_name,
                    e.employee_code,
                    e.department_id,
                    e.position,
                    e.profile_photo

                FROM users u

                LEFT JOIN employees e
                    ON u.employee_id = e.id

                WHERE u.email = ?

                LIMIT 1
                `,
                [email]
            );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        const user = users[0];

        // Check account status
        if (user.status !== "Active") {
            return res.status(403).json({
                success: false,
                message:
                    `Your account is ${user.status.toLowerCase()}`,
            });
        }

        // Compare password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password",
            });
        }

        // Generate token
        const token =
            generateToken(user);

        // Remove password
        delete user.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user,
        });

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during login",
            error: error.message,
        });
    }
};


/**
 * POST /api/auth/employee-login
 *
 * Employee Mobile App Login
 *
 * Uses:
 * Employee Code + Password
 *
 * Example:
 *
 * {
 *   "employee_code": "EMP-1001",
 *   "password": "Ahmed@123"
 * }
 */
const employeeLogin = async (req, res) => {
    try {
        const {
            employee_code,
            password,
        } = req.body;

        // Required fields
        if (!employee_code || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee code and password are required",
            });
        }

        // Find employee login account
        const [users] =
            await pool.execute(
                `
                SELECT

                    u.id AS user_id,
                    u.employee_id,
                    u.email,
                    u.password,
                    u.role,
                    u.status,

                    e.id AS employee_database_id,
                    e.employee_code,
                    e.first_name,
                    e.last_name,
                    e.email AS employee_email,
                    e.phone,
                    e.position,
                    e.department_id,
                    e.profile_photo,
                    e.status AS employee_status,

                    d.name AS department_name

                FROM users u

                INNER JOIN employees e
                    ON u.employee_id = e.id

                LEFT JOIN departments d
                    ON e.department_id = d.id

                WHERE e.employee_code = ?

                AND u.role = 'Employee'

                LIMIT 1
                `,
                [employee_code]
            );

        // Employee account not found
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid Employee Code or password",
            });
        }

        const user = users[0];

        // Check user account status
        if (user.status !== "Active") {
            return res.status(403).json({
                success: false,
                message:
                    `Your account is ${user.status.toLowerCase()}`,
            });
        }

        // Check employee status
        if (user.employee_status !== "Active") {
            return res.status(403).json({
                success: false,
                message:
                    "Your employee account is not active",
            });
        }

        // Compare password
        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid Employee Code or password",
            });
        }

        // Generate Employee JWT
        const token = jwt.sign(
            {
                // users.id
                id: user.user_id,

                // Employee role
                role: "Employee",

                // employees.id
                employee_id:
                    user.employee_database_id,

                // employees.employee_code
                employee_code:
                    user.employee_code,
            },
            process.env.JWT_SECRET,
            {
                expiresIn:
                    process.env.JWT_EXPIRES_IN ||
                    "7d",
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Employee login successful",

            token,

            employee: {
                user_id:
                    user.user_id,

                employee_id:
                    user.employee_database_id,

                employee_code:
                    user.employee_code,

                first_name:
                    user.first_name,

                last_name:
                    user.last_name,

                email:
                    user.employee_email ||
                    user.email,

                phone:
                    user.phone,

                position:
                    user.position,

                department_id:
                    user.department_id,

                department_name:
                    user.department_name,

                profile_photo:
                    user.profile_photo,

                role:
                    user.role,

                status:
                    user.employee_status,
            },
        });

    } catch (error) {
        console.error(
            "Employee login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during employee login",
            error: error.message,
        });
    }
};


/**
 * GET /api/auth/me
 *
 * Get currently authenticated user
 */
const getMe = async (req, res) => {
    try {
        const [users] =
            await pool.execute(
                `
                SELECT
                    u.id,
                    u.employee_id,
                    u.email,
                    u.role,
                    u.status,

                    e.first_name,
                    e.last_name,
                    e.employee_code,
                    e.department_id,
                    e.position,
                    e.profile_photo

                FROM users u

                LEFT JOIN employees e
                    ON u.employee_id = e.id

                WHERE u.id = ?

                LIMIT 1
                `,
                [req.user.id]
            );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user: users[0],
        });

    } catch (error) {
        console.error(
            "Get user error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


/**
 * POST /api/auth/logout
 *
 * JWT is stateless.
 * Frontend/mobile app removes token.
 */
const logout = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};


/**
 * PUT /api/auth/password
 * Change the password for the authenticated account.
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            current_password,
            new_password,
            confirm_password,
        } = req.body || {};

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required",
            });
        }

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({
                success: false,
                message: "Current password, new password and confirmation are required",
            });
        }

        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters long",
            });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: "New password and confirmation do not match",
            });
        }

        const [users] = await pool.execute(
            "SELECT id, password, status FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User account not found",
            });
        }

        if (users[0].status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active",
            });
        }

        const currentPasswordMatches = await bcrypt.compare(
            current_password,
            users[0].password
        );

        if (!currentPasswordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        if (await bcrypt.compare(new_password, users[0].password)) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.execute(
            "UPDATE users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to change password",
            error: error.message,
        });
    }
};


/**
 * Export controllers
 */
module.exports = {
    register,
    login,
    employeeLogin,
    getMe,
    logout,
    changePassword,
};