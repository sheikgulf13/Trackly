"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { format } from "date-fns";
import clsx from "clsx";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, Search, Plus, Trash2, UserPlus } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const page = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dueDateFrom: "",
    dueDateTo: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Low",
    dueDate: "",
    assignedTo: "",
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "",
  });

  const [assignModal, setAssignModal] = useState({ taskId: null, userId: "" });
  const [refresh, setRefresh] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : "";
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    taskId: null,
  });

  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/get_all_tasks",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTasks(res.data.tasks);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/get_all_users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(res.data.users);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTasks(), fetchUsers()]).finally(() => setLoading(false));
  }, [refresh]);

  const filteredTasks = tasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((t) => (filters.status ? t.status === filters.status : true))
    .filter((t) => (filters.priority ? t.priority === filters.priority : true))
    .filter((t) =>
      filters.dueDateFrom && filters.dueDateTo
        ? new Date(t.dueDate) >= new Date(filters.dueDateFrom) &&
          new Date(t.dueDate) <= new Date(filters.dueDateTo)
        : true
    );

  const validateForm = () => {
    const newErrors = {
      title: "",
      description: "",
      dueDate: "",
      assignedTo: "",
    };

    if (!form.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!form.dueDate) {
      newErrors.dueDate = "Due date is required";
    }
    if (!form.assignedTo) {
      newErrors.assignedTo = "Please assign the task to a user";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/create_task",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task created successfully!");
      setIsOpen(false);
      setForm({
        title: "",
        description: "",
        status: "pending",
        priority: "low",
        dueDate: "",
        assignedTo: "",
      });
      setErrors({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: "",
      });
      setRefresh(!refresh);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const assignTask = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/admin/assign_task",
        { taskId: assignModal.taskId, assignedTo: assignModal.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignModal({ taskId: null, userId: "" });
      setRefresh(!refresh);
      toast.success("Task assigned successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign task");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/admin/delete_task/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeleteModal({ isOpen: false, taskId: null });
      setRefresh(!refresh);
      toast.success("Task deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen flex flex-col bg-white"
    >
      <Toaster position="top-right" />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-8 flex-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                Task Management
              </h1>
              <p className="text-gray-600">Manage and track all tasks</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              Create Task
            </motion.button>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-50 rounded-xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                />
              </motion.div>
              {[
                { label: "Status", options: ["All Status", "Pending", "Completed", "Overdue"] },
                { label: "Priority", options: ["All Priority", "Low", "Medium", "High"] }
              ].map((filter, index) => (
                <motion.select
                  key={filter.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  onChange={(e) => setFilters({ ...filters, [filter.label.toLowerCase()]: e.target.value })}
                >
                  {filter.options.map(option => (
                    <option key={option} value={option === `All ${filter.label}` ? "" : option}>
                      {option}
                    </option>
                  ))}
                </motion.select>
              ))}
              {[
                { label: "From", value: filters.dueDateFrom },
                { label: "To", value: filters.dueDateTo }
              ].map((date, index) => (
                <motion.input
                  key={date.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (index + 2) * 0.1 }}
                  type="date"
                  className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
                  onChange={(e) => setFilters({ ...filters, [`dueDate${date.label}`]: e.target.value })}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Assigned To</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.tr
                      key={task._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2 max-w-[200px]">{task.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{task.assignedTo?.name || "Unassigned"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                        >
                          {task.status}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </motion.span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setAssignModal({ taskId: task._id, userId: task.assignedTo?._id || "" })}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Assign Task"
                          >
                            <UserPlus size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteModal({ isOpen: true, taskId: task._id })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredTasks.length === 0 && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No tasks found.
                    </td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal.taskId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white p-6 rounded-xl w-[400px] space-y-4 shadow-lg"
            >
              <h2 className="text-lg font-medium text-gray-900">Assign Task</h2>
              <select
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
                value={assignModal.userId}
                onChange={(e) => setAssignModal({ ...assignModal, userId: e.target.value })}
              >
                <option value="" className="text-gray-700">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="text-gray-900">{u.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAssignModal({ taskId: null, userId: "" })}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={assignTask}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Assign
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-xl rounded-xl bg-white shadow-lg flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <DialogTitle className="text-xl font-semibold text-gray-900">Create New Task</DialogTitle>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      setErrors({ ...errors, title: "" });
                    }}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500 ${
                      errors.title ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.title}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Enter task description"
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setErrors({ ...errors, description: "" });
                    }}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500 ${
                      errors.description ? "border-red-500" : "border-gray-200"
                    }`}
                    rows={4}
                  />
                  {errors.description && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.description}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => {
                      setForm({ ...form, dueDate: e.target.value });
                      setErrors({ ...errors, dueDate: "" });
                    }}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500 ${
                      errors.dueDate ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.dueDate && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.dueDate}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.assignedTo}
                    onChange={(e) => {
                      setForm({ ...form, assignedTo: e.target.value });
                      setErrors({ ...errors, assignedTo: "" });
                    }}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 ${
                      errors.assignedTo ? "border-red-500" : "border-gray-200"
                    }`}
                  >
                    <option value="" className="text-gray-500">Select User</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {errors.assignedTo && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-500"
                    >
                      {errors.assignedTo}
                    </motion.p>
                  )}
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Task
              </motion.button>
            </div>
          </motion.div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null })}
        className="relative z-50"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md rounded-xl bg-white shadow-lg"
          >
            <div className="p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
                className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4"
              >
                <Trash2 className="h-6 w-6 text-red-600" />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Task</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteModal({ isOpen: false, taskId: null })}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteTask(deleteModal.taskId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </Dialog>
    </motion.div>
  );
};

export default page;
