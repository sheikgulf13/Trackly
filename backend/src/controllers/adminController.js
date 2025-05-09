const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Task = require("../models/Task");
const { emitToUser } = require("../sockets/socketEmitter");
const sendEmail = require("../utils/mail");

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, userId, from, to } = req.query;

    const query = {};

    if (action) query.action = action;
    if (userId && mongoose.Types.ObjectId.isValid(userId))
      query.userId = userId;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate([
        { path: "userId", select: "name email role" },
        { path: "taskId", select: "title status assignedTo" },
      ])
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,

      total,
      data: logs,
    });
  } catch (err) {
    console.error("Audit log fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: err.message,
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const users = await User.find({}, { _id: 1, name: 1, email: 1 }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const aggregation = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$status", "Completed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = aggregation.map((entry) => {
      const user = userMap.get(entry._id?.toString());

      return {
        user: user
          ? {
              id: user._id,
              name: user.name,
              email: user.email,
            }
          : { id: entry._id, name: "Unknown", email: "N/A" },
        total: entry.total,
        inProgress: entry.inProgress,
        completed: entry.completed,
        overdue: entry.overdue,
        completionRate: entry.total
          ? ((entry.completed / entry.total) * 100).toFixed(2) + "%"
          : "0%",
      };
    });

    const userIdsWithData = new Set(stats.map((s) => s.user.id.toString()));
    users.forEach((user) => {
      if (!userIdsWithData.has(user._id.toString())) {
        stats.push({
          user: { id: user._id, name: user.name, email: user.email },
          total: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
          completionRate: "0%",
        });
      }
    });

    res.status(200).json({
      success: true,
      totalUsers: users.length,
      usersWithTasks: stats.length,
      data: stats.sort((a, b) => a.user.name.localeCompare(b.user.name)),
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics",
      error: err.message,
    });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      status,
      priority,
      dueDateFrom,
      dueDateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (dueDateFrom || dueDateTo) {
      filters.dueDate = {};
      if (dueDateFrom) filters.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filters.dueDate.$lte = new Date(dueDateTo);
    }

    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      //.limit(parseInt(limit))
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    //const total = await Task.countDocuments(filters);

    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.log("get all tasks error", error);
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { taskId, assignedTo } = req.body;

    if (!taskId || !assignedTo) {
      return res.status(400).json({
        success: false,
        message: "taskId and assignedTo are required",
      });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res
        .status(404)
        .json({ success: false, message: "Assignee not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = assignedTo;
    await task.save();

    await AuditLog.create({
      userId: req.user._id,
      action: "assign_task",
      taskId: task._id,
      details: {
        from: previousAssignee,
        to: assignedTo,
      },
    });

    await emitToUser(assignedTo.toString(), "task:assigned", {
      taskId: task._id,
      title: task.title,
      assignedBy: req.user.id,
    });

    await sendEmail(
      assignee.email,
      "New Task Assigned",
      `You have been assigned a new task: ${task.title}`
    );

    return res.status(200).json({
      success: true,
      message: "Task reassigned successfully",
      task,
    });
  } catch (err) {
    console.error("Admin assignTask error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res
        .status(400)
        .json({ success: false, message: "Task ID is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const assignedTo = task.assignedTo;

    const deleteTask = await Task.findOneAndDelete({ _id: taskId });

    if (!deleteTask)
      return res
        .status(404)
        .json({ message: "Error deleting task, try again!" });

    const assignee = await User.findById(assignedTo);

    await AuditLog.create({
      userId: req.user._id,
      action: "delete_task",
      taskId,
      details: {
        title: task.title,
        assignedTo,
        deletedAt: new Date(),
      },
    });

    if (assignedTo) {
      emitToUser(assignedTo, "task:deleted", {
        taskId,
        title: task.title,
        deletedBy: req.user.name,
        timestamp: new Date(),
      });

      await sendEmail(
        assignee.email,
        "New Task Assigned",
        `You have been assigned a new task: ${task.title}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      task,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and due date are required.",
      });
    }

    if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignedTo user ID." });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
    });

    await AuditLog.create({
      userId: req.user.id,
      action: "create_task",
      taskId: task._id,
      details: {
        title,
        assignedTo,
        createdAt: task.createdAt,
      },
    });

    if (assignedTo) {
      const assignee = await User.findById(assignedTo);

      emitToUser(assignedTo, "task:assigned", {
        taskId: task._id,
        title,
        assignedBy: req.user.name,
        dueDate,
        timestamp: new Date(),
      });

      await sendEmail(
        assignee.email,
        "New Task Assigned",
        `You have been assigned a new task: ${task.title}`
      );
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const users = await User.find(
      { role: "User" },
      { name: 1, email: 1 }
    ).lean();

    const formattedUsers = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
    }));

    res.status(200).json({
      success: true,
      totalUsers: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("[Admin] getAllUsers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
