const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const { emitToUser } = require("../sockets/socketEmitter");
const AuditLog = require("../models/AuditLog");

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, assignedTo } =
      req.body;

    if (!title.trim() || !assignedTo) {
      return res
        .status(400)
        .json({ message: "Title and AssignedTo are required!" });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user does not exist" });
    }

    const validStatus = ["Pending", "In Progress", "completed"];
    const validPriority = ["Low", "Medium", "High"];

    if (status && !validStatus.includes(status)) {
      return res.status(404).json({ message: "Invalid Status" });
    }
    if (priority && !validPriority.includes(priority)) {
      return res.status(404).json({ message: "Invalid Priority" });
    }

    const task = await Task.create({
      title,
      description: !description.trim() ? "" : description,
      status,
      priority,
      dueDate,
      createdBy: req.user.id,
      assignedTo,
    });

    await AuditLog({
      userId: req.user.id,
      action: "create_task",
      taskId: task._id,
      details: {
        title,
        assignedTo,
        createdAt: task.createdAt,
      },
    });

    if (assignedTo !== req.user.id) {
      emitToUser(assignedTo.toString(), "task:assigned", {
        taskId: task._id,
        title: task.title,
        assignedBy: req.user.id,
      });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "assignedTo",
    ];

    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const validStatus = ["Pending", "In Progress", "Completed"];
    const validPriority = ["Low", "Medium", "High"];

    if (updates.status && !validStatus.includes(updates.status)) {
      return res.status(404).json({ message: "Invalid Status" });
    }
    if (updates.priority && !validPriority.includes(updates.priority)) {
      return res.status(404).json({ message: "Invalid Priority" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userId = req.user.id;
    const isCreater = task.createdBy.toString() === userId;
    const isAssigned = task.assignedTo.toString() === userId;

    if (!isCreater && !isAssigned) {
      return res
        .status(404)
        .json({ message: `You don't have access to update this task` });
    }

    if (isAssigned && !isCreater) {
      allowedFieldsToUpdate = ["status"];
      for (const key of Object.keys(updates)) {
        if (!allowedFieldsToUpdate.includes(key)) {
          return res
            .status(404)
            .json({ message: "Assignee can only update status" });
        }
      }
    }

    Object.assign(task, updates);
    await task.save();

    await AuditLog({
      userId: req.user.id,
      action: "update_task",
      taskId: task._id,
      details: {
        title: updates?.title,
        description: updates?.description,
        status: updates?.status,
        priority: updates?.priority,
        dueDate: updates?.dueDate,
        assignedTo: updates?.assignedTo,
        updatedAt: task.updatedAt,
      },
    });

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userId = req.user.id;
    const isCreater = task.createdBy.toString() === userId;
    const isAssigned = task.assignedTo.toString() === userId;

    if (!isCreater && !isAssigned) {
      return res
        .status(404)
        .json({ message: `You don't have access to update this task` });
    }

    if (isAssigned && !isCreater) {
      return res.status(404).json({ message: "Assignee cannot delete a task" });
    }

    const deleteTask = await Task.findOneAndDelete({ _id: req.params.id });

    if (!deleteTask)
      return res
        .status(404)
        .json({ message: "Error deleting task, try again!" });

    await AuditLog({
      userId: req.user.id,
      action: "delete_task",
      taskId: task._id,
      details: {
        title: task.title,
        createdBy: task.createdBy,
        assignedTo: task.assignedTo,
        deletedAt: new Date(),
      },
    });

    res.status(200).json({ success: true, message: "Task deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { status, priority, dueDateFrom, dueDateTo } = req.query;

    const filters = {
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (dueDateFrom || dueDateTo) {
      filters.dueDate = {};
      if (dueDateFrom) filters.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filters.dueDate.$lte = new Date(dueDateTo);
    }

    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    const completedCount = tasks.filter(
      (task) => task.status === "Completed"
    ).length;
    const pendingCount = tasks.filter(
      (task) => task.status === "Pending"
    ).length;
    const inProgressCount = tasks.filter(
      (task) => task.status === "In Progress"
    ).length;
    const overdueCount = tasks.filter((task) => {
      return task.status !== "Completed" && new Date(task.dueDate) < new Date();
    }).length;

    const priorityCounts = {
      High: tasks.filter((task) => task.priority === "High").length,
      Medium: tasks.filter((task) => task.priority === "Medium").length,
      Low: tasks.filter((task) => task.priority === "Low").length,
    };

    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const completedOnDate = tasks.filter((task) => {
        return (
          task.status === "Completed" &&
          task.updatedAt &&
          task.updatedAt.toISOString().split("T")[0] === dateStr
        );
      }).length;

      history.push({ date: dateStr, completed: completedOnDate });
    }

    res.status(200).json({
      success: true,
      completedCount,
      pendingCount,
      inProgressCount,
      overdueCount,
      priorityCounts,
      history,
      tasks,
    });
  } catch (error) {
    console.log("get all tasks error", error);
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.getTasksCreatedByMe = async (req, res) => {
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

    const filters = {
      createdBy: req.user.id,
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (dueDateFrom || dueDateTo) {
      filters.dueDate = {};
      if (dueDateFrom) filters.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filters.dueDate.$lte = new Date(dueDateTo);
    }

    //const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      //.skip(skip)
      //.limit(parseInt(limit))
      .populate("assignedTo", "-password -refreshToken -__v");

    const total = await Task.countDocuments(filters);

    res.status(200).json({
      success: true,
      total,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.getTasksAssignedToMe = async (req, res) => {
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

    const filters = {
      assignedTo: req.user.id,
    };

    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    if (dueDateFrom || dueDateTo) {
      filters.dueDate = {};
      if (dueDateFrom) filters.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filters.dueDate.$lte = new Date(dueDateTo);
    }

    //const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(filters)
      .sort({ createdAt: -1 })
      .populate("createdBy", "-password -refreshToken -__v");

    const total = await Task.countDocuments(filters);

    res.status(200).json({
      success: true,
      total,
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    //const { page = 1, limit = 10, priority, sortBy = 'dueDate', order = 'asc' } = req.query;

    const now = new Date();

    const filters = {
      dueDate: { $lt: now },
      status: { $ne: "Completed" },
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    };

    const total = await Task.countDocuments(filters);
    const overdueTasks = await Task.find(filters);
    //.sort({ [sortBy]: order === 'asc' ? 1 : -1 })

    res.status(200).json({
      success: true,
      total,
      tasks: overdueTasks,
    });
  } catch (error) {
    console.error("Error in getOverdueTasks:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

exports.assignTask = async (req, res) => {
  try {
    const { taskId, assignedTo } = req.body;

    if (!taskId?.trim() || !assignedTo?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both taskId and assignedTo are required.",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const [task, assignee] = await Promise.all([
      Task.findById(taskId),
      User.findById(assignedTo),
    ]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found.`,
      });
    }

    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${assignedTo} not found.`,
      });
    }

    const isCreator = task.createdBy.toString() === userId;
    const isAssignedUser = task.assignedTo?.toString() === userId;

    if (!isCreator && !isAssignedUser) {
      return res.status(403).json({
        success: false,
        message: `You don't have access to reassign this task.`,
      });
    }

    if (!isCreator && isAssignedUser) {
      return res.status(403).json({
        success: false,
        message: "Assignee cannot assign task to others.",
      });
    }

    if (task.assignedTo?.toString() === assignedTo) {
      return res.status(409).json({
        success: false,
        message: "Task is already assigned to this user.",
      });
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

    emitToUser(assignedTo.toString(), "task:assigned", {
      taskId: task._id,
      title: task.title,
      assignedBy: userId,
    });

    return res.status(200).json({
      success: true,
      message: `Task assigned to ${assignee.name || "user"} successfully.`,
      task,
    });
  } catch (error) {
    console.error("AssignTask Error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};
