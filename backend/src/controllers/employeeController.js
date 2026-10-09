const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { notifyAdmins } = require("../utils/notificationService");

/*
|--------------------------------------------------------------------------
| GET ALL EMPLOYEES
|--------------------------------------------------------------------------
*/

const getEmployees = async (req, res) => {
    try {
        const [employees] = await pool.execute(`
            SELECT
                e.id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                e.date_of_birth,
                e.gender,
                e.address,
                e.city,
                e.country,
                e.profile_photo,
                e.department_id,
                e.position,
                e.manager_id,
                e.joining_date,
                e.employment_type,
                e.salary,
                e.skills,
                e.emergency_contact_name,
                e.emergency_contact_phone,
                e.status,
                e.created_at,
                e.updated_at,

                d.name AS department_name,

                CONCAT(
                    e.first_name,
                    ' ',
                    e.last_name
                ) AS full_name

            FROM employees e

            LEFT JOIN departments d
                ON e.department_id = d.id

            ORDER BY
                e.created_at DESC,
                e.first_name ASC
        `);

        const formattedEmployees = employees.map((employee) => {
            const firstName =
                employee.first_name || "";

            const lastName =
                employee.last_name || "";

            const name =
                `${firstName} ${lastName}`.trim();

            const initials =
                `${firstName.charAt(0)}${lastName.charAt(0)}`
                    .toUpperCase();

            return {
                ...employee,

                // Fields used by All Employees UI
                name: name || "Unnamed Employee",

                department:
                    employee.department_name ||
                    "Unassigned",

                initials:
                    initials || "NA",
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedEmployees.length,
            employees: formattedEmployees,
        });

    } catch (error) {
        console.error(
            "Get employees error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load employees",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE EMPLOYEE
|--------------------------------------------------------------------------
*/

const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [employees] = await pool.execute(
            `
            SELECT
                e.*,
                d.name AS department_name,

                CONCAT(
                    e.first_name,
                    ' ',
                    e.last_name
                ) AS full_name

            FROM employees e

            LEFT JOIN departments d
                ON e.department_id = d.id

            WHERE e.id = ?

            LIMIT 1
            `,
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        const employee = employees[0];

        const initials =
            `${employee.first_name?.charAt(0) || ""}${employee.last_name?.charAt(0) || ""}`
                .toUpperCase();

        return res.status(200).json({
            success: true,
            employee: {
                ...employee,
                name:
                    employee.full_name ||
                    "Unnamed Employee",
                department:
                    employee.department_name ||
                    "Unassigned",
                initials:
                    initials || "NA",
            },
        });

    } catch (error) {
        console.error(
            "Get employee error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load employee",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| CREATE EMPLOYEE
|--------------------------------------------------------------------------
|
| Creates:
|
| 1. Employee record
| 2. User login account
|
| Employee Login:
| Employee ID + Password
|
|--------------------------------------------------------------------------
*/

const createEmployee = async (req, res) => {
    let connection;

    try {
        const {
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            address,
            city,
            country,
            department_id,
            position,
            manager_id,
            joining_date,
            employment_type,
            salary,
            skills,
            emergency_contact_name,
            emergency_contact_phone,
            status = "Active",

            // Login password
            password,
            confirm_password,
        } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
            !employee_code ||
            !first_name ||
            !last_name ||
            !email ||
            !department_id ||
            !position ||
            !joining_date
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Employee code, name, email, department, position and joining date are required",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | PASSWORD VALIDATION
        |--------------------------------------------------------------------------
        */

        if (!password) {
            return res.status(400).json({
                success: false,
                message:
                    "Password is required for employee login",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters long",
            });
        }

        if (
            confirm_password &&
            password !== confirm_password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password and confirm password do not match",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | GET DATABASE CONNECTION
        |--------------------------------------------------------------------------
        */

        connection = await pool.getConnection();


        /*
        |--------------------------------------------------------------------------
        | START TRANSACTION
        |--------------------------------------------------------------------------
        */

        await connection.beginTransaction();


        /*
        |--------------------------------------------------------------------------
        | CHECK EMPLOYEE CODE
        |--------------------------------------------------------------------------
        */

        const [existingCode] =
            await connection.execute(
                `
                SELECT id
                FROM employees
                WHERE employee_code = ?
                LIMIT 1
                `,
                [employee_code]
            );

        if (existingCode.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Employee code already exists",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK EMPLOYEE EMAIL
        |--------------------------------------------------------------------------
        */

        const [existingEmail] =
            await connection.execute(
                `
                SELECT id
                FROM employees
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );

        if (existingEmail.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "Employee email already exists",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK USER EMAIL
        |--------------------------------------------------------------------------
        |
        | The users table also contains email.
        |
        */

        const [existingUserEmail] =
            await connection.execute(
                `
                SELECT id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );

        if (existingUserEmail.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message:
                    "A user account with this email already exists",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK DEPARTMENT
        |--------------------------------------------------------------------------
        */

        const [department] =
            await connection.execute(
                `
                SELECT id
                FROM departments
                WHERE id = ?
                LIMIT 1
                `,
                [department_id]
            );

        if (department.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Department not found",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CHECK MANAGER
        |--------------------------------------------------------------------------
        */

        if (manager_id) {
            const [manager] =
                await connection.execute(
                    `
                    SELECT id
                    FROM employees
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [manager_id]
                );

            if (manager.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message:
                        "Manager not found",
                });
            }
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE EMPLOYEE
        |--------------------------------------------------------------------------
        */

        const [employeeResult] =
            await connection.execute(
                `
                INSERT INTO employees
                (
                    employee_code,
                    first_name,
                    last_name,
                    email,
                    phone,
                    date_of_birth,
                    gender,
                    address,
                    city,
                    country,
                    department_id,
                    position,
                    manager_id,
                    joining_date,
                    employment_type,
                    salary,
                    skills,
                    emergency_contact_name,
                    emergency_contact_phone,
                    status
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    employee_code,
                    first_name,
                    last_name,
                    email,
                    phone || null,
                    date_of_birth || null,
                    gender || null,
                    address || null,
                    city || null,
                    country || null,
                    department_id,
                    position,
                    manager_id || null,
                    joining_date,
                    employment_type || "Full-time",
                    salary || 0,
                    skills || null,
                    emergency_contact_name || null,
                    emergency_contact_phone || null,
                    status,
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | NEW EMPLOYEE DATABASE ID
        |--------------------------------------------------------------------------
        */

        const employeeId =
            employeeResult.insertId;


        /*
        |--------------------------------------------------------------------------
        | HASH EMPLOYEE PASSWORD
        |--------------------------------------------------------------------------
        */

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        /*
        |--------------------------------------------------------------------------
        | CREATE USER LOGIN ACCOUNT
        |--------------------------------------------------------------------------
        |
        | Employee login will use:
        |
        | Employee Code = employee ID
        | Password = password provided by HR
        |
        */

        const [userResult] =
            await connection.execute(
                `
                INSERT INTO users
                (
                    employee_id,
                    email,
                    password,
                    role,
                    status
                )
                VALUES
                (?, ?, ?, 'Employee', 'Active')
                `,
                [
                    employeeId,
                    email,
                    hashedPassword,
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | COMMIT TRANSACTION
        |--------------------------------------------------------------------------
        */

        await connection.commit();

        await notifyAdmins({
            title: "Employee added",
            message: `${first_name} ${last_name} joined the company.`,
            type: "Info",
        });


        /*
        |--------------------------------------------------------------------------
        | SUCCESS RESPONSE
        |--------------------------------------------------------------------------
        */

        return res.status(201).json({
            success: true,

            message:
                "Employee and login account created successfully",

            employeeId: employeeId,

            userId:
                userResult.insertId,

            employee: {
                employee_id:
                    employeeId,

                employee_code:
                    employee_code,

                first_name:
                    first_name,

                last_name:
                    last_name,

                email:
                    email,

                role:
                    "Employee",

                status:
                    status,
            },

            login: {
                employee_id:
                    employee_code,

                message:
                    "Employee can login using Employee ID and password",
            },
        });

    } catch (error) {

        /*
        |--------------------------------------------------------------------------
        | ROLLBACK IF ANYTHING FAILS
        |--------------------------------------------------------------------------
        */

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Create employee error:",
            error
        );

        /*
        |--------------------------------------------------------------------------
        | HANDLE MYSQL DUPLICATE ERROR
        |--------------------------------------------------------------------------
        */

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "Employee code or email already exists",
                error:
                    error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create employee",
            error:
                error.message,
        });

    } finally {

        /*
        |--------------------------------------------------------------------------
        | RELEASE CONNECTION
        |--------------------------------------------------------------------------
        */

        if (connection) {
            connection.release();
        }
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE EMPLOYEE
|--------------------------------------------------------------------------
*/

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender,
            address,
            city,
            country,
            department_id,
            position,
            manager_id,
            joining_date,
            employment_type,
            salary,
            skills,
            emergency_contact_name,
            emergency_contact_phone,
            status,
        } = req.body;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM employees
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        await pool.execute(
            `
            UPDATE employees
            SET
                employee_code = ?,
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                date_of_birth = ?,
                gender = ?,
                address = ?,
                city = ?,
                country = ?,
                department_id = ?,
                position = ?,
                manager_id = ?,
                joining_date = ?,
                employment_type = ?,
                salary = ?,
                skills = ?,
                emergency_contact_name = ?,
                emergency_contact_phone = ?,
                status = ?
            WHERE id = ?
            `,
            [
                employee_code,
                first_name,
                last_name,
                email,
                phone || null,
                date_of_birth || null,
                gender || null,
                address || null,
                city || null,
                country || null,
                department_id,
                position,
                manager_id || null,
                joining_date,
                employment_type || "Full-time",
                salary || 0,
                skills || null,
                emergency_contact_name || null,
                emergency_contact_phone || null,
                status || "Active",
                id,
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                "Employee updated successfully",
        });

    } catch (error) {
        console.error(
            "Update employee error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update employee",
            error:
                error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE EMPLOYEE
|--------------------------------------------------------------------------
*/

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await pool.execute(
            `
            SELECT id
            FROM employees
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found",
            });
        }

        await pool.execute(
            `
            DELETE FROM employees
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Employee deleted successfully",
        });

    } catch (error) {
        console.error(
            "Delete employee error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete employee",
            error:
                error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| EXPORT CONTROLLERS
|--------------------------------------------------------------------------
*/

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
};