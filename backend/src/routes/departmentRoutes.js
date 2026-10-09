const express = require("express");

const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addEmployeeToDepartment,
    removeEmployeeFromDepartment,
    setDepartmentHead,
} = require("../controllers/departmentController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all departments
router.get(
    "/",
    authMiddleware,
    getDepartments
);

// Create department
router.post(
    "/",
    authMiddleware,
    createDepartment
);

// Get single department details
router.get(
    "/:id",
    authMiddleware,
    getDepartmentById
);

// Update department
router.put(
    "/:id",
    authMiddleware,
    updateDepartment
);

// Delete department
router.delete(
    "/:id",
    authMiddleware,
    deleteDepartment
);

// Add employee to department
router.post(
    "/:id/employees",
    authMiddleware,
    addEmployeeToDepartment
);

// Remove employee from department
router.delete(
    "/:id/employees/:employeeId",
    authMiddleware,
    removeEmployeeFromDepartment
);

// Make employee department head
router.put(
    "/:id/head",
    authMiddleware,
    setDepartmentHead
);

module.exports = router; 