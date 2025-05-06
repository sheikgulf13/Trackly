const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middlewares/auth");
const allowRoles = require("../middlewares/role");

router.get('/get_audit_logs', protect, allowRoles('Admin'), adminController.getAuditLogs);
router.get('/get_analytics', protect, allowRoles('Admin'), adminController.getAnalytics);
router.get('/get_all_tasks', protect, allowRoles('Admin'), adminController.getAllTasks);
router.get('/get_all_users', protect, allowRoles('Admin'), adminController.getAllUsers);
router.put('/assign_task', protect, allowRoles('Admin'), adminController.assignTask);
router.post('/create_task', protect, allowRoles('Admin'), adminController.createTask);
router.delete('/delete_task', protect, allowRoles('Admin'), adminController.deleteTask);

module.exports = router;