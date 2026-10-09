const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const managerRoutes = require("./routes/managerRoutes");
const documentRoutes = require("./routes/documentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const leaveRoutes = require("./routes/leaveRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const attendanceRoutes =
    require("./routes/attendanceRoutes");
const notificationRoutes =
    require("./routes/notificationRoutes");


const app = express();

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(
    "/uploads",
    express.static("uploads")
);

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/attendance", attendanceRoutes); 
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/notifications", notificationRoutes);
// IMPORTANT
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HR Portal API is running",
    });
});

module.exports = app;