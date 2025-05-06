const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/auth");

router.post('/create_task', protect, taskController.createTask);
router.put('/update_task/:id', protect, taskController.updateTask);
router.delete('/delete_task/:id', protect, taskController.deleteTask);
router.get('/get_all_my_tasks', protect, taskController.getAllTasks);
router.get('/created_tasks', protect, taskController.getTasksCreatedByMe);
router.get('/assigned_tasks', protect, taskController.getTasksAssignedToMe);

module.exports = router;