const pool = require("../config/db");

const normalizeStatus = (status) => {
    return status === "Inactive"
        ? "Inactive"
        : "Active";
};

// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

const getDepartments = async (req, res) => {
    try {
        const {
            search = "",
            status = "All",
        } = req.query;

        const params = [];

        let where = "WHERE 1 = 1";

        if (search.trim()) {
            where += `
                AND (
                    d.code LIKE ?
                    OR d.name LIKE ?
                    OR d.description LIKE ?
                    OR CONCAT(
                        COALESCE(h.first_name, ''),
                        ' ',
                        COALESCE(h.last_name, '')
                    ) LIKE ?
                )
            `;

            const value = `%${search.trim()}%`;

            params.push(
                value,
                value,
                value,
                value
            );
        }

        if (
            status === "Active" ||
            status === "Inactive"
        ) {
            where += `
                AND d.status = ?
            `;

            params.push(status);
        }

        const [departments] =
            await pool.execute(
                `
                SELECT
                    d.id,
                    d.code,
                    d.name,
                    d.description,
                    d.manager_id,
                    d.status,
                    d.created_at,
                    d.updated_at,

                    h.first_name AS head_first_name,
                    h.last_name AS head_last_name,

                    COUNT(DISTINCT e.id)
                        AS employee_count,

                    COUNT(DISTINCT e.position)
                        AS position_count

                FROM departments d

                LEFT JOIN employees h
                    ON d.manager_id = h.id

                LEFT JOIN employees e
                    ON e.department_id = d.id

                ${where}

                GROUP BY
                    d.id,
                    d.code,
                    d.name,
                    d.description,
                    d.manager_id,
                    d.status,
                    d.created_at,
                    d.updated_at,
                    h.first_name,
                    h.last_name

                ORDER BY d.id ASC
                `,
                params
            );

        return res.status(200).json({
            success: true,

            departments:
                departments.map((department) => ({
                    id:
                        department.code ||
                        `DEP-${String(
                            department.id
                        ).padStart(3, "0")}`,

                    database_id:
                        department.id,

                    code:
                        department.code,

                    name:
                        department.name,

                    description:
                        department.description ||
                        "",

                    manager_id:
                        department.manager_id,

                    head:
                        `${department.head_first_name || ""} ${
                            department.head_last_name || ""
                        }`.trim() ||
                        "Not Assigned",

                    headInitials:
                        `${department.head_first_name?.[0] || ""}${
                            department.head_last_name?.[0] || ""
                        }`.toUpperCase() ||
                        "NA",

                    employees:
                        Number(
                            department.employee_count || 0
                        ),

                    positions:
                        Number(
                            department.position_count || 0
                        ),

                    status:
                        department.status,

                    created_at:
                        department.created_at,

                    updated_at:
                        department.updated_at,
                })),
        });

    } catch (error) {
        console.error(
            "Get departments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load departments",
            error: error.message,
        });
    }
};


// =====================================================
// FIND DEPARTMENT
// =====================================================

const findDepartment = async (value) => {
    const [rows] =
        await pool.execute(
            `
            SELECT
                id,
                code,
                name,
                description,
                manager_id,
                status

            FROM departments

            WHERE id = ?
               OR code = ?

            LIMIT 1
            `,
            [
                value,
                value,
            ]
        );

    return rows[0] || null;
};


// =====================================================
// GET DEPARTMENT DETAILS
// =====================================================

const getDepartmentById = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        // Department head
        const [headRows] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    email,
                    phone,
                    position,
                    status,
                    profile_photo

                FROM employees

                WHERE id = ?

                LIMIT 1
                `,
                [
                    department.manager_id,
                ]
            );

        // Department employees
        const [employees] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    email,
                    phone,
                    position,
                    status,
                    profile_photo

                FROM employees

                WHERE department_id = ?

                ORDER BY
                    first_name ASC,
                    last_name ASC
                `,
                [
                    department.id,
                ]
            );

        return res.status(200).json({
            success: true,

            department: {
                id:
                    department.code ||
                    `DEP-${String(
                        department.id
                    ).padStart(3, "0")}`,

                database_id:
                    department.id,

                code:
                    department.code,

                name:
                    department.name,

                description:
                    department.description ||
                    "",

                manager_id:
                    department.manager_id,

                status:
                    department.status,

                head:
                    headRows[0] || null,
            },

            employees:
                employees.map((employee) => ({
                    ...employee,

                    name:
                        `${employee.first_name || ""} ${
                            employee.last_name || ""
                        }`.trim(),
                })),
        });

    } catch (error) {
        console.error(
            "Get department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load department",
            error: error.message,
        });
    }
};


// =====================================================
// CREATE DEPARTMENT
// =====================================================

const createDepartment = async (
    req,
    res
) => {
    try {
        const {
            code,
            name,
            description = "",
            manager_id = null,
            status = "Active",
        } = req.body || {};

        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message:
                    "Department code and name are required",
            });
        }

        const cleanCode =
            code.trim();

        const cleanName =
            name.trim();

        // Check duplicate
        const [existing] =
            await pool.execute(
                `
                SELECT id

                FROM departments

                WHERE code = ?
                   OR name = ?

                LIMIT 1
                `,
                [
                    cleanCode,
                    cleanName,
                ]
            );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Department code or name already exists",
            });
        }

        // Validate manager
        if (manager_id) {
            const [manager] =
                await pool.execute(
                    `
                    SELECT id

                    FROM employees

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        manager_id,
                    ]
                );

            if (manager.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Department head employee not found",
                });
            }
        }

        const [result] =
            await pool.execute(
                `
                INSERT INTO departments
                (
                    code,
                    name,
                    description,
                    manager_id,
                    status
                )

                VALUES
                (?, ?, ?, ?, ?)
                `,
                [
                    cleanCode,
                    cleanName,
                    description.trim(),
                    manager_id || null,
                    normalizeStatus(status),
                ]
            );

        return res.status(201).json({
            success: true,

            message:
                "Department created successfully",

            departmentId:
                result.insertId,
        });

    } catch (error) {
        console.error(
            "Create department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create department",
            error: error.message,
        });
    }
};


// =====================================================
// UPDATE DEPARTMENT
// =====================================================

const updateDepartment = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        const {
            code,
            name,
            description,
            manager_id,
            status,
        } = req.body || {};

        const fields = [];
        const values = [];

        if (code !== undefined) {
            fields.push(
                "code = ?"
            );

            values.push(
                code.trim()
            );
        }

        if (name !== undefined) {
            fields.push(
                "name = ?"
            );

            values.push(
                name.trim()
            );
        }

        if (
            description !== undefined
        ) {
            fields.push(
                "description = ?"
            );

            values.push(
                description.trim()
            );
        }

        if (
            manager_id !== undefined
        ) {
            fields.push(
                "manager_id = ?"
            );

            values.push(
                manager_id || null
            );
        }

        if (status !== undefined) {
            fields.push(
                "status = ?"
            );

            values.push(
                normalizeStatus(status)
            );
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No department fields were provided",
            });
        }

        // Validate manager
        if (manager_id) {
            const [manager] =
                await pool.execute(
                    `
                    SELECT id

                    FROM employees

                    WHERE id = ?

                    LIMIT 1
                    `,
                    [
                        manager_id,
                    ]
                );

            if (manager.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Department head employee not found",
                });
            }
        }

        values.push(
            department.id
        );

        await pool.execute(
            `
            UPDATE departments

            SET ${fields.join(", ")}

            WHERE id = ?
            `,
            values
        );

        return res.status(200).json({
            success: true,
            message:
                "Department updated successfully",
        });

    } catch (error) {
        console.error(
            "Update department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update department",
            error: error.message,
        });
    }
};


// =====================================================
// DELETE DEPARTMENT
// =====================================================

const deleteDepartment = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        // Check employees
        const [employees] =
            await pool.execute(
                `
                SELECT COUNT(*) AS total

                FROM employees

                WHERE department_id = ?
                `,
                [
                    department.id,
                ]
            );

        const employeeCount =
            Number(
                employees[0].total
            );

        if (employeeCount > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete a department that has assigned employees",

                employee_count:
                    employeeCount,
            });
        }

        await pool.execute(
            `
            DELETE FROM departments

            WHERE id = ?
            `,
            [
                department.id,
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                "Department deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete department",
            error: error.message,
        });
    }
};


// =====================================================
// ADD EMPLOYEE TO DEPARTMENT
// =====================================================

const addEmployeeToDepartment = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        const {
            employee_id,
            employee_code,
        } = req.body || {};

        if (
            !employee_id &&
            !employee_code
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "employee_id or employee_code is required",
            });
        }

        const [employees] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    department_id

                FROM employees

                WHERE id = ?
                   OR employee_code = ?

                LIMIT 1
                `,
                [
                    employee_id || 0,
                    employee_code || "",
                ]
            );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee not found",
            });
        }

        const employee =
            employees[0];

        await pool.execute(
            `
            UPDATE employees

            SET department_id = ?

            WHERE id = ?
            `,
            [
                department.id,
                employee.id,
            ]
        );

        return res.status(200).json({
            success: true,

            message:
                "Employee added to department successfully",

            employee: {
                id:
                    employee.id,

                employee_code:
                    employee.employee_code,

                name:
                    `${employee.first_name || ""} ${
                        employee.last_name || ""
                    }`.trim(),
            },
        });

    } catch (error) {
        console.error(
            "Add employee to department error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to add employee to department",
            error: error.message,
        });
    }
};


// =====================================================
// REMOVE EMPLOYEE FROM DEPARTMENT
// =====================================================

const removeEmployeeFromDepartment = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        const [employees] =
            await pool.execute(
                `
                SELECT id

                FROM employees

                WHERE id = ?

                AND department_id = ?

                LIMIT 1
                `,
                [
                    req.params.employeeId,
                    department.id,
                ]
            );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee is not assigned to this department",
            });
        }

        await pool.execute(
            `
            UPDATE employees

            SET department_id = NULL

            WHERE id = ?
            `,
            [
                req.params.employeeId,
            ]
        );

        // If employee was department head,
        // remove them as head too.
        if (
            Number(
                department.manager_id
            ) ===
            Number(
                req.params.employeeId
            )
        ) {
            await pool.execute(
                `
                UPDATE departments

                SET manager_id = NULL

                WHERE id = ?
                `,
                [
                    department.id,
                ]
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Employee removed from department successfully",
        });

    } catch (error) {
        console.error(
            "Remove employee error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to remove employee from department",
            error: error.message,
        });
    }
};


// =====================================================
// MAKE DEPARTMENT HEAD
// =====================================================

const setDepartmentHead = async (
    req,
    res
) => {
    try {
        const department =
            await findDepartment(
                req.params.id
            );

        if (!department) {
            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }

        const {
            employee_id,
        } = req.body || {};

        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message:
                    "employee_id is required",
            });
        }

        const [employees] =
            await pool.execute(
                `
                SELECT
                    id,
                    employee_code,
                    first_name,
                    last_name,
                    department_id

                FROM employees

                WHERE id = ?

                LIMIT 1
                `,
                [
                    employee_id,
                ]
            );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Employee not found",
            });
        }

        const employee =
            employees[0];

        // Employee must already
        // belong to department.
        if (
            Number(
                employee.department_id
            ) !==
            Number(
                department.id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee must belong to this department before becoming department head",
            });
        }

        await pool.execute(
            `
            UPDATE departments

            SET manager_id = ?

            WHERE id = ?
            `,
            [
                employee.id,
                department.id,
            ]
        );

        return res.status(200).json({
            success: true,

            message:
                "Department head updated successfully",

            head: {
                id:
                    employee.id,

                employee_code:
                    employee.employee_code,

                name:
                    `${employee.first_name || ""} ${
                        employee.last_name || ""
                    }`.trim(),
            },
        });

    } catch (error) {
        console.error(
            "Set department head error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to set department head",
            error: error.message,
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
    setDepartmentHead,
};