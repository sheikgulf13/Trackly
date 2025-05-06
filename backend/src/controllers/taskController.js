const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const { emitToUser } = require("../sockets/socketEmitter");

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

    const validStatus = ["Pending", "In Progress", "completed"];
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
      allowedFieldsToUpdate = ["Status"];
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

    const {
      status,
      priority,
      dueDateFrom,
      dueDateTo,
      page = 1,
      limit = 10,
    } = req.query;

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
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.getTasksAssignedToMe = async (req, res) => {
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
  try {
  } catch (error) {
    res.status(500).json({ message: "Server Error!" });
  }
};

exports.assignTaskToUser = async (req, res) => {
  try {
    const { taskId, newAssigneeId } = req.body;

    if (!taskId?.trim() || !newAssigneeId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both taskId and newAssigneeId are required.",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found.`,
      });
    }

    const requestingUserId = req.user?.id;
    if (!requestingUserId || task.createdBy.toString() !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator is authorized to reassign the task.",
      });
    }

    const newAssignee = await User.findById(newAssigneeId);
    if (!newAssignee) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${newAssigneeId} not found.`,
      });
    }

    if (task.assignedTo.toString() === newAssigneeId) {
      return res.status(409).json({
        success: false,
        message: "Task is already assigned to this user.",
      });
    }

    task.assignedTo = newAssigneeId;
    await task.save();

    emitToUser(newAssignee._id.toString(), "task:assigned", {
      taskId: task._id,
      title: task.title,
      assignedBy: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: `Task reassigned to ${newAssignee.name || "the selected user"}.`,
      task,
    });
  } catch (error) {
    console.error("Task Reassignment Error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred during reassignment.",
    });
  }
};
