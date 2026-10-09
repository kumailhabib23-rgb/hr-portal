const pool = require("../config/db");
const {
    notifyAdmins,
    notifyEmployee,
} = require("../utils/notificationService");

// ==========================================
// GET ALL LEAVE REQUESTS
// ==========================================
const getLeaves = async (req, res) => {
    try {
        const {
            status,
            department_id,
            employee_id,
            search,
            leave_type,
            start_date,
            end_date,
        } = req.query;

        let sql = `
            SELECT
                l.id,
                l.employee_id,
                l.leave_type,
                l.start_date,
                l.end_date,
                l.reason,
                l.status,
                l.approved_by,
                l.approved_at,
                l.rejection_reason,
                l.created_at,

                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.position,

                d.id AS department_id,
                d.name AS department_name,

                CONCAT(
                    approver.first_name,
                    ' ',
                    approver.last_name
                ) AS approved_by_name

            FROM leaves l

            INNER JOIN employees e
                ON l.employee_id = e.id

            LEFT JOIN departments d
                ON e.department_id = d.id

            LEFT JOIN employees approver
                ON l.approved_by = approver.id

            WHERE 1 = 1
        `;

        const params = [];

        // Status
        if (status) {
            sql += ` AND l.status = ? `;
            params.push(status);
        }

        // Department
        if (department_id) {
            sql += ` AND e.department_id = ? `;
            params.push(department_id);
        }

        // Employee
        if (employee_id) {
            sql += ` AND l.employee_id = ? `;
            params.push(employee_id);
        }

        // Leave type
        if (leave_type) {
            sql += ` AND l.leave_type = ? `;
            params.push(leave_type);
        }

        // Search
        if (search) {
            sql += `
                AND (
                    e.first_name LIKE ?
                    OR e.last_name LIKE ?
                    OR e.employee_code LIKE ?
                    OR e.email LIKE ?
                )
            `;

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        // Date range
        if (start_date) {
            sql += ` AND l.start_date >= ? `;
            params.push(start_date);
        }

        if (end_date) {
            sql += ` AND l.end_date <= ? `;
            params.push(end_date);
        }

        sql += `
            ORDER BY
                CASE
                    WHEN l.status = 'Pending' THEN 1
                    WHEN l.status = 'Approved' THEN 2
                    WHEN l.status = 'Rejected' THEN 3
                    ELSE 4
                END,
                l.created_at DESC
        `;

        const [rows] = await pool.execute(
            sql,
            params
        );

        return res.status(200).json({
            success: true,
            leaves: rows,
        });

    } catch (error) {
        console.error(
            "Get leaves error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get leave requests",
            error: error.message,
        });
    }
};


// ==========================================
// GET SINGLE LEAVE
// ==========================================
const getLeaveById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.execute(
            `
            SELECT
                l.id,
                l.employee_id,
                l.leave_type,
                l.start_date,
                l.end_date,
                l.reason,
                l.status,
                l.approved_by,
                l.approved_at,
                l.rejection_reason,
                l.created_at,

                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.position,

                d.id AS department_id,
                d.name AS department_name

            FROM leaves l

            INNER JOIN employees e
                ON l.employee_id = e.id

            LEFT JOIN departments d
                ON e.department_id = d.id

            WHERE l.id = ?

            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found",
            });
        }

        return res.status(200).json({
            success: true,
            leave: rows[0],
        });

    } catch (error) {
        console.error(
            "Get leave error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get leave request",
            error: error.message,
        });
    }
};


// ==========================================
// CREATE LEAVE REQUEST
// ==========================================
const createLeave = async (req, res) => {
    try {
        const {
            employee_id,
            leave_type,
            start_date,
            end_date,
            reason,
        } = req.body;

        if (
            !employee_id ||
            !leave_type ||
            !start_date ||
            !end_date
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee, leave type, start date and end date are required",
            });
        }

        // Validate employee
        const [employees] =
            await pool.execute(
                `
                SELECT id, status, first_name, last_name
                FROM employees
                WHERE id = ?
                LIMIT 1
                `,
                [employee_id]
            );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        if (
            employees[0].status !==
            "Active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee account is not active",
            });
        }

        // Validate date order
        if (
            new Date(start_date) >
            new Date(end_date)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "End date cannot be before start date",
            });
        }

        // Check overlapping pending/approved leave
        const [existing] =
            await pool.execute(
                `
                SELECT id
                FROM leaves
                WHERE employee_id = ?

                AND status IN
                ('Pending', 'Approved')

                AND start_date <= ?
                AND end_date >= ?

                LIMIT 1
                `,
                [
                    employee_id,
                    end_date,
                    start_date,
                ]
            );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Employee already has an overlapping leave request",
            });
        }

        const [result] =
            await pool.execute(
                `
                INSERT INTO leaves
                (
                    employee_id,
                    leave_type,
                    start_date,
                    end_date,
                    reason,
                    status
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    'Pending'
                )
                `,
                [
                    employee_id,
                    leave_type,
                    start_date,
                    end_date,
                    reason || null,
                ]
            );

        await notifyAdmins({
            title: "Leave request submitted",
            message: `${employees[0].first_name} ${employees[0].last_name} submitted a ${leave_type} leave request.`,
            type: "Warning",
        });

        return res.status(201).json({
            success: true,
            message:
                "Leave request submitted successfully",
            leaveId: result.insertId,
        });

    } catch (error) {
        console.error(
            "Create leave error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create leave request",
            error: error.message,
        });
    }
};


// ==========================================
// APPROVE LEAVE
// ==========================================
const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;

        const [leaves] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_id,
                    status
                FROM leaves
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Leave request not found",
            });
        }

        if (
            leaves[0].status !==
            "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending leave requests can be approved",
            });
        }

        const [result] =
            await pool.execute(
                `
                UPDATE leaves
                SET
                    status = 'Approved',
                    approved_by = ?,
                    approved_at = NOW(),
                    rejection_reason = NULL

                WHERE id = ?
                `,
                [
                    req.user.employee_id ||
                    null,
                    id,
                ]
            );

        await notifyEmployee(leaves[0].employee_id, {
            title: "Leave request approved",
            message: "Your leave request has been approved.",
            type: "Success",
        });

        return res.status(200).json({
            success: true,
            message:
                "Leave request approved successfully",
            affectedRows:
                result.affectedRows,
        });

    } catch (error) {
        console.error(
            "Approve leave error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to approve leave request",
            error: error.message,
        });
    }
};


// ==========================================
// REJECT LEAVE
// ==========================================
const rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            rejection_reason,
        } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required",
            });
        }

        const [leaves] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_id,
                    status
                FROM leaves
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Leave request not found",
            });
        }

        if (
            leaves[0].status !==
            "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending leave requests can be rejected",
            });
        }

        const [result] =
            await pool.execute(
                `
                UPDATE leaves
                SET
                    status = 'Rejected',
                    approved_by = ?,
                    approved_at = NOW(),
                    rejection_reason = ?

                WHERE id = ?
                `,
                [
                    req.user.employee_id ||
                    null,
                    rejection_reason,
                    id,
                ]
            );

        await notifyEmployee(leaves[0].employee_id, {
            title: "Leave request rejected",
            message: `Your leave request was rejected. Reason: ${rejection_reason}`,
            type: "Error",
        });

        return res.status(200).json({
            success: true,
            message:
                "Leave request rejected successfully",
            affectedRows:
                result.affectedRows,
        });

    } catch (error) {
        console.error(
            "Reject leave error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to reject leave request",
            error: error.message,
        });
    }
};


// ==========================================
// DELETE LEAVE
// ==========================================
const deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;

        const [leaves] =
            await pool.execute(
                `
                SELECT id
                FROM leaves
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );

        if (leaves.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Leave request not found",
            });
        }

        await pool.execute(
            `
            DELETE FROM leaves
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Leave request deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete leave error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete leave request",
            error: error.message,
        });
    }
};


module.exports = {
    getLeaves,
    getLeaveById,
    createLeave,
    approveLeave,
    rejectLeave,
    deleteLeave,
};