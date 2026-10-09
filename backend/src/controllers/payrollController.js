const pool = require("../config/db");
const { notifyAdmins } = require("../utils/notificationService");

/*
|--------------------------------------------------------------------------
| Helper: Get Employee By Employee Code
|--------------------------------------------------------------------------
*/
const getEmployeeByCode = async (employee_code) => {
    const [employees] = await pool.execute(
        `
        SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.email,
            e.salary,
            e.department_id,
            e.position,
            e.status,

            d.name AS department_name

        FROM employees e

        LEFT JOIN departments d
            ON e.department_id = d.id

        WHERE e.employee_code = ?

        LIMIT 1
        `,
        [employee_code]
    );

    return employees.length > 0
        ? employees[0]
        : null;
};


/*
|--------------------------------------------------------------------------
| Calculate Payroll
|--------------------------------------------------------------------------
*/
const calculatePayroll = async (req, res) => {
    try {
        const body = req.body || {};

        const {
            employee_code,
            payroll_month,

            house_allowance = 0,
            transport_allowance = 0,
            other_allowance = 0,
            allowances = 0,

            overtime = 0,
            bonus = 0,

            tax_deduction = 0,
            loan_deduction = 0,
            late_deduction = null,
            unpaid_leave_deduction = null,
            advance_deduction = 0,
            other_deduction = 0,
        } = body;


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!employee_code) {
            return res.status(400).json({
                success: false,
                message: "Employee code is required",
            });
        }

        if (!payroll_month) {
            return res.status(400).json({
                success: false,
                message: "Payroll month is required",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Find Employee
        |--------------------------------------------------------------------------
        */

        const employee =
            await getEmployeeByCode(employee_code);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message:
                    `Employee ${employee_code} not found`,
            });
        }

        if (employee.status !== "Active") {
            return res.status(400).json({
                success: false,
                message:
                    `Employee ${employee_code} is not active`,
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Basic Salary
        |--------------------------------------------------------------------------
        */

        const basicSalary =
            Number(employee.salary || 0);


        /*
        |--------------------------------------------------------------------------
        | Allowances
        |--------------------------------------------------------------------------
        */

        const totalAllowances =
            Number(house_allowance || 0) +
            Number(transport_allowance || 0) +
            Number(other_allowance || 0) +
            Number(allowances || 0);


        /*
        |--------------------------------------------------------------------------
        | Gross Salary
        |--------------------------------------------------------------------------
        */

        const grossSalary =
            basicSalary +
            totalAllowances +
            Number(overtime || 0) +
            Number(bonus || 0);


        /*
        |--------------------------------------------------------------------------
        | Get Payroll Month
        |--------------------------------------------------------------------------
        */

        const payrollDate =
            new Date(`${payroll_month}T00:00:00`);

        if (Number.isNaN(payrollDate.getTime())) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payroll month. Use YYYY-MM-01",
            });
        }

        const payrollYear =
            payrollDate.getFullYear();

        const payrollMonthNumber =
            payrollDate.getMonth() + 1;


        /*
        |--------------------------------------------------------------------------
        | Automatic Late Deduction
        |--------------------------------------------------------------------------
        |
        | Rs. 500 per late attendance.
        |
        */

        let calculatedLateDeduction = 0;

        if (late_deduction !== null) {

            calculatedLateDeduction =
                Number(late_deduction || 0);

        } else {

            const [lateRows] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS late_days

                    FROM attendance

                    WHERE employee_id = ?

                    AND status = 'Late'

                    AND YEAR(attendance_date) = ?

                    AND MONTH(attendance_date) = ?
                    `,
                    [
                        employee.id,
                        payrollYear,
                        payrollMonthNumber,
                    ]
                );

            const lateDays =
                Number(
                    lateRows[0]?.late_days || 0
                );

            calculatedLateDeduction =
                lateDays * 500;
        }


        /*
        |--------------------------------------------------------------------------
        | Automatic Unpaid Leave Deduction
        |--------------------------------------------------------------------------
        |
        | Daily salary = Basic salary / 30
        |
        */

        let calculatedUnpaidLeaveDeduction = 0;

        if (unpaid_leave_deduction !== null) {

            calculatedUnpaidLeaveDeduction =
                Number(
                    unpaid_leave_deduction || 0
                );

        } else {

            const [leaveRows] =
                await pool.execute(
                    `
                    SELECT
                        COALESCE(
                            SUM(total_days),
                            0
                        ) AS unpaid_days

                    FROM leaves

                    WHERE employee_id = ?

                    AND status = 'Approved'

                    AND leave_type IN (
                        'Unpaid',
                        'Unpaid Leave'
                    )

                    AND YEAR(start_date) = ?

                    AND MONTH(start_date) = ?
                    `,
                    [
                        employee.id,
                        payrollYear,
                        payrollMonthNumber,
                    ]
                );

            const unpaidDays =
                Number(
                    leaveRows[0]?.unpaid_days || 0
                );

            const dailySalary =
                basicSalary / 30;

            calculatedUnpaidLeaveDeduction =
                unpaidDays * dailySalary;
        }


        /*
        |--------------------------------------------------------------------------
        | Total Deductions
        |--------------------------------------------------------------------------
        */

        const totalDeduction =
            Number(tax_deduction || 0) +
            Number(loan_deduction || 0) +
            Number(calculatedLateDeduction || 0) +
            Number(
                calculatedUnpaidLeaveDeduction || 0
            ) +
            Number(advance_deduction || 0) +
            Number(other_deduction || 0);


        /*
        |--------------------------------------------------------------------------
        | Net Salary
        |--------------------------------------------------------------------------
        */

        const netSalary =
            grossSalary - totalDeduction;


        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({
            success: true,
            message: "Payroll calculated successfully",

            payroll: {
                employee_code:
                    employee.employee_code,

                employee_name:
                    `${employee.first_name} ${employee.last_name}`,

                department:
                    employee.department_name,

                position:
                    employee.position,

                payroll_month,

                basic_salary:
                    Number(basicSalary.toFixed(2)),

                house_allowance:
                    Number(
                        Number(
                            house_allowance || 0
                        ).toFixed(2)
                    ),

                transport_allowance:
                    Number(
                        Number(
                            transport_allowance || 0
                        ).toFixed(2)
                    ),

                other_allowance:
                    Number(
                        Number(
                            other_allowance || 0
                        ).toFixed(2)
                    ),

                allowances:
                    Number(
                        Number(
                            allowances || 0
                        ).toFixed(2)
                    ),

                total_allowances:
                    Number(
                        totalAllowances.toFixed(2)
                    ),

                overtime:
                    Number(
                        Number(
                            overtime || 0
                        ).toFixed(2)
                    ),

                bonus:
                    Number(
                        Number(
                            bonus || 0
                        ).toFixed(2)
                    ),

                gross_salary:
                    Number(
                        grossSalary.toFixed(2)
                    ),

                tax_deduction:
                    Number(
                        Number(
                            tax_deduction || 0
                        ).toFixed(2)
                    ),

                loan_deduction:
                    Number(
                        Number(
                            loan_deduction || 0
                        ).toFixed(2)
                    ),

                late_deduction:
                    Number(
                        calculatedLateDeduction.toFixed(2)
                    ),

                unpaid_leave_deduction:
                    Number(
                        calculatedUnpaidLeaveDeduction.toFixed(2)
                    ),

                advance_deduction:
                    Number(
                        Number(
                            advance_deduction || 0
                        ).toFixed(2)
                    ),

                other_deduction:
                    Number(
                        Number(
                            other_deduction || 0
                        ).toFixed(2)
                    ),

                total_deduction:
                    Number(
                        totalDeduction.toFixed(2)
                    ),

                net_salary:
                    Number(
                        netSalary.toFixed(2)
                    ),
            },
        });

    } catch (error) {

        console.error(
            "Calculate payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to calculate payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Get All Payroll
|--------------------------------------------------------------------------
*/
const getPayroll = async (req, res) => {
    try {

        const {
            month,
            year,
            search,
            payment_status,
        } = req.query;


        let query = `
            SELECT
                p.id,

                p.employee_id,

                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.position,

                d.name AS department_name,

                p.payroll_month,

                p.basic_salary,

                p.house_allowance,
                p.transport_allowance,
                p.other_allowance,

                p.allowances,
                p.overtime,
                p.bonus,

                p.gross_salary,

                p.tax_deduction,
                p.loan_deduction,
                p.late_deduction,
                p.unpaid_leave_deduction,
                p.advance_deduction,
                p.other_deduction,

                p.deductions,
                p.tax,
                p.total_deduction,

                p.net_salary,

                p.payment_status,
                p.payment_date,
                p.payment_method,

                p.notes,

                p.created_at,
                p.updated_at

            FROM payroll p

            INNER JOIN employees e
                ON p.employee_id = e.id

            LEFT JOIN departments d
                ON e.department_id = d.id

            WHERE 1 = 1
        `;


        const params = [];


        /*
        |--------------------------------------------------------------------------
        | Month Filter
        |--------------------------------------------------------------------------
        */

        if (month) {
            query += `
                AND MONTH(p.payroll_month) = ?
            `;

            params.push(Number(month));
        }


        /*
        |--------------------------------------------------------------------------
        | Year Filter
        |--------------------------------------------------------------------------
        */

        if (year) {
            query += `
                AND YEAR(p.payroll_month) = ?
            `;

            params.push(Number(year));
        }


        /*
        |--------------------------------------------------------------------------
        | Payment Status Filter
        |--------------------------------------------------------------------------
        */

        if (payment_status) {

            query += `
                AND p.payment_status = ?
            `;

            params.push(payment_status);
        }


        /*
        |--------------------------------------------------------------------------
        | Search By Employee Code / Name
        |--------------------------------------------------------------------------
        */

        if (search) {

            query += `
                AND (
                    e.employee_code LIKE ?
                    OR e.first_name LIKE ?
                    OR e.last_name LIKE ?
                    OR CONCAT(
                        e.first_name,
                        ' ',
                        e.last_name
                    ) LIKE ?
                )
            `;

            const searchValue =
                `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Order
        |--------------------------------------------------------------------------
        */

        query += `
            ORDER BY
                p.payroll_month DESC,
                p.id DESC
        `;


        const [rows] =
            await pool.execute(
                query,
                params
            );


        return res.status(200).json({
            success: true,
            count: rows.length,
            payroll: rows,
        });

    } catch (error) {

        console.error(
            "Get payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Get Payroll By ID
|--------------------------------------------------------------------------
*/
const getPayrollById = async (req, res) => {
    try {

        const { id } = req.params;


        const [rows] =
            await pool.execute(
                `
                SELECT
                    p.*,

                    e.employee_code,
                    e.first_name,
                    e.last_name,
                    e.email,
                    e.phone,
                    e.position,
                    e.salary,

                    d.name AS department_name

                FROM payroll p

                INNER JOIN employees e
                    ON p.employee_id = e.id

                LEFT JOIN departments d
                    ON e.department_id = d.id

                WHERE p.id = ?

                LIMIT 1
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payroll record not found",
            });
        }


        return res.status(200).json({
            success: true,
            payroll: rows[0],
        });

    } catch (error) {

        console.error(
            "Get payroll by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load payroll record",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Create Payroll
|--------------------------------------------------------------------------
*/
const createPayroll = async (req, res) => {

    let connection;

    try {

        const body = req.body || {};


        const {
            employee_code,
            payroll_month,

            house_allowance = 0,
            transport_allowance = 0,
            other_allowance = 0,
            allowances = 0,

            overtime = 0,
            bonus = 0,

            tax_deduction = 0,
            loan_deduction = 0,
            late_deduction = null,
            unpaid_leave_deduction = null,
            advance_deduction = 0,
            other_deduction = 0,

            notes = null,
        } = body;


        /*
        |--------------------------------------------------------------------------
        | Validation
        |--------------------------------------------------------------------------
        */

        if (!employee_code) {

            return res.status(400).json({
                success: false,
                message:
                    "Employee code is required",
            });
        }


        if (!payroll_month) {

            return res.status(400).json({
                success: false,
                message:
                    "Payroll month is required",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Find Employee
        |--------------------------------------------------------------------------
        */

        const employee =
            await getEmployeeByCode(
                employee_code
            );


        if (!employee) {

            return res.status(404).json({
                success: false,
                message:
                    `Employee ${employee_code} not found`,
            });
        }


        if (employee.status !== "Active") {

            return res.status(400).json({
                success: false,
                message:
                    `Employee ${employee_code} is not active`,
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Check Duplicate Payroll
        |--------------------------------------------------------------------------
        */

        const [existingPayroll] =
            await pool.execute(
                `
                SELECT id

                FROM payroll

                WHERE employee_id = ?

                AND payroll_month = ?

                LIMIT 1
                `,
                [
                    employee.id,
                    payroll_month,
                ]
            );


        if (existingPayroll.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    `Payroll already exists for ${employee_code} for ${payroll_month}`,
                payroll_id:
                    existingPayroll[0].id,
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Salary
        |--------------------------------------------------------------------------
        */

        const basicSalary =
            Number(employee.salary || 0);


        /*
        |--------------------------------------------------------------------------
        | Allowances
        |--------------------------------------------------------------------------
        */

        const totalAllowances =
            Number(house_allowance || 0) +
            Number(transport_allowance || 0) +
            Number(other_allowance || 0) +
            Number(allowances || 0);


        /*
        |--------------------------------------------------------------------------
        | Gross Salary
        |--------------------------------------------------------------------------
        */

        const grossSalary =
            basicSalary +
            totalAllowances +
            Number(overtime || 0) +
            Number(bonus || 0);


        /*
        |--------------------------------------------------------------------------
        | Payroll Date
        |--------------------------------------------------------------------------
        */

        const payrollDate =
            new Date(`${payroll_month}T00:00:00`);


        if (
            Number.isNaN(
                payrollDate.getTime()
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payroll month. Use YYYY-MM-01",
            });
        }


        const payrollYear =
            payrollDate.getFullYear();

        const payrollMonthNumber =
            payrollDate.getMonth() + 1;


        /*
        |--------------------------------------------------------------------------
        | Late Deduction
        |--------------------------------------------------------------------------
        */

        let calculatedLateDeduction = 0;


        if (late_deduction !== null) {

            calculatedLateDeduction =
                Number(late_deduction || 0);

        } else {

            const [lateRows] =
                await pool.execute(
                    `
                    SELECT COUNT(*) AS late_days

                    FROM attendance

                    WHERE employee_id = ?

                    AND status = 'Late'

                    AND YEAR(attendance_date) = ?

                    AND MONTH(attendance_date) = ?
                    `,
                    [
                        employee.id,
                        payrollYear,
                        payrollMonthNumber,
                    ]
                );


            const lateDays =
                Number(
                    lateRows[0]?.late_days || 0
                );


            /*
            |--------------------------------------------------------------------------
            | Rs. 500 Per Late Day
            |--------------------------------------------------------------------------
            */

            calculatedLateDeduction =
                lateDays * 500;
        }


        /*
        |--------------------------------------------------------------------------
        | Unpaid Leave Deduction
        |--------------------------------------------------------------------------
        */

        let calculatedUnpaidLeaveDeduction =
            0;


        if (
            unpaid_leave_deduction !== null
        ) {

            calculatedUnpaidLeaveDeduction =
                Number(
                    unpaid_leave_deduction || 0
                );

        } else {

            const [leaveRows] =
                await pool.execute(
                    `
                    SELECT
                        COALESCE(
                            SUM(total_days),
                            0
                        ) AS unpaid_days

                    FROM leaves

                    WHERE employee_id = ?

                    AND status = 'Approved'

                    AND leave_type IN (
                        'Unpaid',
                        'Unpaid Leave'
                    )

                    AND YEAR(start_date) = ?

                    AND MONTH(start_date) = ?
                    `,
                    [
                        employee.id,
                        payrollYear,
                        payrollMonthNumber,
                    ]
                );


            const unpaidDays =
                Number(
                    leaveRows[0]?.unpaid_days || 0
                );


            const dailySalary =
                basicSalary / 30;


            calculatedUnpaidLeaveDeduction =
                unpaidDays * dailySalary;
        }


        /*
        |--------------------------------------------------------------------------
        | Total Deductions
        |--------------------------------------------------------------------------
        */

        const totalDeduction =
            Number(tax_deduction || 0) +
            Number(loan_deduction || 0) +
            Number(
                calculatedLateDeduction || 0
            ) +
            Number(
                calculatedUnpaidLeaveDeduction || 0
            ) +
            Number(advance_deduction || 0) +
            Number(other_deduction || 0);


        /*
        |--------------------------------------------------------------------------
        | Net Salary
        |--------------------------------------------------------------------------
        */

        const netSalary =
            grossSalary -
            totalDeduction;


        /*
        |--------------------------------------------------------------------------
        | Start Transaction
        |--------------------------------------------------------------------------
        */

        connection =
            await pool.getConnection();

        await connection.beginTransaction();


        /*
        |--------------------------------------------------------------------------
        | Insert Payroll
        |--------------------------------------------------------------------------
        */

        const [result] =
            await connection.execute(
                `
                INSERT INTO payroll
                (
                    employee_id,
                    payroll_month,

                    basic_salary,

                    house_allowance,
                    transport_allowance,
                    other_allowance,

                    allowances,
                    overtime,
                    bonus,

                    gross_salary,

                    tax_deduction,
                    loan_deduction,
                    late_deduction,
                    unpaid_leave_deduction,
                    advance_deduction,
                    other_deduction,

                    deductions,
                    tax,

                    total_deduction,

                    net_salary,

                    payment_status,

                    notes

                )

                VALUES
                (
                    ?,
                    ?,

                    ?,

                    ?,
                    ?,
                    ?,

                    ?,
                    ?,
                    ?,

                    ?,

                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,

                    ?,
                    ?,

                    ?,

                    ?,

                    'Pending',

                    ?
                )
                `,
                [
                    employee.id,
                    payroll_month,

                    basicSalary,

                    Number(
                        house_allowance || 0
                    ),

                    Number(
                        transport_allowance || 0
                    ),

                    Number(
                        other_allowance || 0
                    ),

                    Number(
                        allowances || 0
                    ),

                    Number(
                        overtime || 0
                    ),

                    Number(
                        bonus || 0
                    ),

                    grossSalary,

                    Number(
                        tax_deduction || 0
                    ),

                    Number(
                        loan_deduction || 0
                    ),

                    calculatedLateDeduction,

                    calculatedUnpaidLeaveDeduction,

                    Number(
                        advance_deduction || 0
                    ),

                    Number(
                        other_deduction || 0
                    ),

                    /*
                    | Legacy deductions field
                    */
                    totalDeduction,

                    /*
                    | Legacy tax field
                    */
                    Number(
                        tax_deduction || 0
                    ),

                    totalDeduction,

                    netSalary,

                    notes,
                ]
            );


        /*
        |--------------------------------------------------------------------------
        | Commit
        |--------------------------------------------------------------------------
        */

        await connection.commit();

        await notifyAdmins({
            title: "Payroll created",
            message: `Payroll for ${employee.first_name} ${employee.last_name} (${payroll_month}) is ready for review.`,
            type: "Info",
        });


        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        return res.status(201).json({

            success: true,

            message:
                "Payroll created successfully",

            payroll: {

                id:
                    result.insertId,

                employee_code:
                    employee.employee_code,

                employee_name:
                    `${employee.first_name} ${employee.last_name}`,

                payroll_month,

                basic_salary:
                    Number(
                        basicSalary.toFixed(2)
                    ),

                gross_salary:
                    Number(
                        grossSalary.toFixed(2)
                    ),

                total_deduction:
                    Number(
                        totalDeduction.toFixed(2)
                    ),

                net_salary:
                    Number(
                        netSalary.toFixed(2)
                    ),

                payment_status:
                    "Pending",
            },
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Create payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create payroll",
            error: error.message,
        });

    } finally {

        if (connection) {
            connection.release();
        }
    }
};


/*
|--------------------------------------------------------------------------
| Update Payroll
|--------------------------------------------------------------------------
*/
const updatePayroll = async (req, res) => {

    try {

        const { id } =
            req.params;

        const body =
            req.body || {};


        /*
        |--------------------------------------------------------------------------
        | Check Payroll
        |--------------------------------------------------------------------------
        */

        const [existing] =
            await pool.execute(
                `
                SELECT id

                FROM payroll

                WHERE id = ?

                LIMIT 1
                `,
                [id]
            );


        if (existing.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payroll record not found",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Build Dynamic Update
        |--------------------------------------------------------------------------
        */

        const allowedFields = [

            "house_allowance",
            "transport_allowance",
            "other_allowance",

            "allowances",
            "overtime",
            "bonus",

            "tax_deduction",
            "loan_deduction",
            "late_deduction",
            "unpaid_leave_deduction",
            "advance_deduction",
            "other_deduction",

            "deductions",
            "tax",

            "gross_salary",
            "total_deduction",
            "net_salary",

            "payment_status",
            "payment_date",
            "payment_method",

            "notes",
        ];


        const fields = [];
        const values = [];


        allowedFields.forEach(
            (field) => {

                if (
                    body[field] !==
                    undefined
                ) {

                    fields.push(
                        `${field} = ?`
                    );

                    values.push(
                        body[field]
                    );
                }
            }
        );


        if (fields.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "No valid fields provided for update",
            });
        }


        values.push(id);


        const query = `
            UPDATE payroll

            SET
                ${fields.join(", ")}

            WHERE id = ?
        `;


        await pool.execute(
            query,
            values
        );


        return res.status(200).json({

            success: true,

            message:
                "Payroll updated successfully",
        });

    } catch (error) {

        console.error(
            "Update payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Process Payroll
|--------------------------------------------------------------------------
*/
const processPayroll = async (req, res) => {

    try {

        const { id } =
            req.params;


        const [rows] =
            await pool.execute(
                `
                SELECT
                    id,
                    payment_status

                FROM payroll

                WHERE id = ?

                LIMIT 1
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payroll record not found",
            });
        }


        if (
            rows[0].payment_status !==
            "Pending"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `Payroll cannot be processed because its current status is ${rows[0].payment_status}`,
            });
        }


        await pool.execute(
            `
            UPDATE payroll

            SET
                payment_status = 'Processed'

            WHERE id = ?
            `,
            [id]
        );


        return res.status(200).json({

            success: true,

            message:
                "Payroll processed successfully",
        });

    } catch (error) {

        console.error(
            "Process payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Pay Payroll
|--------------------------------------------------------------------------
*/
const payPayroll = async (req, res) => {

    try {

        const { id } =
            req.params;

        const body =
            req.body || {};


        const {
            payment_method = "Bank Transfer",
            payment_date = null,
        } = body;


        /*
        |--------------------------------------------------------------------------
        | Check Payroll
        |--------------------------------------------------------------------------
        */

        const [rows] =
            await pool.execute(
                `
                SELECT
                    id,
                    payment_status

                FROM payroll

                WHERE id = ?

                LIMIT 1
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payroll record not found",
            });
        }


        if (
            rows[0].payment_status ===
            "Paid"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Payroll has already been paid",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | Update Payment
        |--------------------------------------------------------------------------
        */

        await pool.execute(
            `
            UPDATE payroll

            SET

                payment_status = 'Paid',

                payment_method = ?,

                payment_date =
                    COALESCE(
                        ?,
                        CURDATE()
                    )

            WHERE id = ?
            `,
            [
                payment_method,
                payment_date,
                id,
            ]
        );


        return res.status(200).json({

            success: true,

            message:
                "Payroll paid successfully",
        });

    } catch (error) {

        console.error(
            "Pay payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to pay payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Delete Payroll
|--------------------------------------------------------------------------
*/
const deletePayroll = async (req, res) => {

    try {

        const { id } =
            req.params;


        const [rows] =
            await pool.execute(
                `
                SELECT id

                FROM payroll

                WHERE id = ?

                LIMIT 1
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payroll record not found",
            });
        }


        await pool.execute(
            `
            DELETE FROM payroll

            WHERE id = ?
            `,
            [id]
        );


        return res.status(200).json({

            success: true,

            message:
                "Payroll deleted successfully",
        });

    } catch (error) {

        console.error(
            "Delete payroll error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete payroll",
            error: error.message,
        });
    }
};


/*
|--------------------------------------------------------------------------
| Export Controllers
|--------------------------------------------------------------------------
*/

module.exports = {
    calculatePayroll,
    getPayroll,
    getPayrollById,
    createPayroll,
    updatePayroll,
    processPayroll,
    payPayroll,
    deletePayroll,
};