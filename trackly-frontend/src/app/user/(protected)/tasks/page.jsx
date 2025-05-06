'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import dayjs from 'dayjs'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, Search, Plus, Trash2, UserPlus, Pencil } from "lucide-react";
import { toast } from 'react-hot-toast'

const page = () => {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
  })
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Low",
    dueDate: "",
    assignedTo: ""
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: ""
  });

  const [assignModal, setAssignModal] = useState({ taskId: null, userId: '' })
  const [refresh, setRefresh] = useState(false)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''
  const [editModal, setEditModal] = useState({
    isOpen: false,
    task: null,
    form: {
      status: '',
      priority: ''
    }
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null });

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks/get_all_my_tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTasks(res.data.tasks)
    } catch (err) {
      console.error('Fetch tasks error:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks/get_all_users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      console.log('user', res)
      setUsers(res.data.users)
    } catch (err) {
      console.error('Fetch users error:', err)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchUsers()]).finally(() => setLoading(false))
  }, [refresh])

  const filteredTasks = tasks
    .filter((t) =>
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
    )

  const validateForm = () => {
    const newErrors = {
      title: "",
      description: "",
      dueDate: "",
      assignedTo: ""
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
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    console.log('form', form)

    try {
      const res = await axios.post(
        "http://localhost:5000/api/tasks/create_task",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsOpen(false);
      setForm({
        title: "",
        description: "",
        status: "pending",
        priority: "Low",
        dueDate: "",
        assignedTo: "",
      });
      setErrors({
        title: "",
        description: "",
        dueDate: "",
        assignedTo: ""
      });
      setRefresh(!refresh);
      toast.success('Task created successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    }
  };

  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  const handleEdit = async () => {
    try {
      // Validate status and priority values
      const validStatus = ["Pending", "In Progress", "Completed"];
      const validPriority = ["Low", "Medium", "High"];

      if (editModal.form.status && !validStatus.includes(editModal.form.status)) {
        toast.error('Invalid Status')
        return;
      }

      if (editModal.form.priority && !validPriority.includes(editModal.form.priority)) {
        toast.error('Invalid Priority')
        return;
      }

      // Only include priority in the update if it's selected
      const updateData = {
        status: editModal.form.status
      };
      
      if (editModal.form.priority) {
        updateData.priority = editModal.form.priority;
      }

      const response = await axios.put(
        `http://localhost:5000/api/tasks/update_task/${editModal.task._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setEditModal({ isOpen: false, task: null, form: { status: '', priority: '' } });
        setRefresh(!refresh);
        toast.success('Task updated successfully!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task')
    }
  };

  const handleAssignTask = async () => {
    try {
      await axios.put(
        'http://localhost:5000/api/tasks/assign_task',
        { taskId: assignModal.taskId, assignedTo: assignModal.userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAssignModal({ taskId: null, userId: '' })
      setRefresh(!refresh)
      toast.success('Task assigned successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task')
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/delete_task/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDeleteModal({ isOpen: false, taskId: null });
      setRefresh(!refresh)
      toast.success('Task deleted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
            <p className="text-gray-600">Manage and track all tasks</p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={18} />
            Create Task
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
            <select
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Overdue</option>
            </select>
            <select
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priority</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
            />
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-270px)]">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
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
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2 max-w-[200px]">{task.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{task.assignedTo?.name || 'Unassigned'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditModal({
                              isOpen: true,
                              task,
                              form: {
                                status: '',
                                priority: ''
                              }
                            });
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setAssignModal({ taskId: task._id, userId: task.assignedTo?._id || '' })}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Assign Task"
                        >
                          <UserPlus size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, taskId: task._id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Dialog open={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, task: null, form: { status: '', priority: '' } })} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-xl rounded-xl bg-white shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <DialogTitle className="text-xl font-semibold text-gray-900">Edit Task</DialogTitle>
              <button 
                onClick={() => setEditModal({ isOpen: false, task: null, form: { status: '', priority: '' } })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editModal.form.status}
                    onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, status: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editModal.form.priority}
                    onChange={(e) => setEditModal({ ...editModal, form: { ...editModal.form, priority: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                  >
                    <option value="">Select Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={handleEdit}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Update Task
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Assign Task Modal */}
      {assignModal.taskId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] space-y-4 shadow-lg">
            <h2 className="text-lg font-medium text-gray-900">Assign Task</h2>
            <select
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              value={assignModal.userId}
              onChange={(e) => setAssignModal({ ...assignModal, userId: e.target.value })}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setAssignModal({ taskId: null, userId: '' })}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTask}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-xl rounded-xl bg-white shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <DialogTitle className="text-xl font-semibold text-gray-900">Create New Task</DialogTitle>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
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
                    <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div>
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
                    <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
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
                    <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>
                  )}
                </div>

                <div>
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
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {errors.assignedTo && (
                    <p className="mt-1 text-sm text-red-500">{errors.assignedTo}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={handleCreate}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Task
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, taskId: null })} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Task</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, taskId: null })}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTask(deleteModal.taskId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}

export default page