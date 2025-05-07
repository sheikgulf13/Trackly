'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
} from 'chart.js'
import { Pie, Line, Bar } from 'react-chartjs-2'
import { Search, Calendar, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement
)

const page = () => {
  const [createdTasks, setCreatedTasks] = useState([])
  const [assignedTasks, setAssignedTasks] = useState([])
  const [overdueTasks, setOverdueTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
    search: ''
  })


  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const query = new URLSearchParams(filters)

        const createdRes = await axios.get(
          `http://localhost:5000/api/tasks/created_tasks?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

       
        const assignedRes = await axios.get(
          `http://localhost:5000/api/tasks/assigned_tasks?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

     
        const overdueRes = await axios.get(
          `http://localhost:5000/api/tasks/overdue_tasks?`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

      
        const statsRes = await axios.get(
          `http://localhost:5000/api/tasks/get_all_my_tasks?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        setCreatedTasks(createdRes.data.tasks)
        setAssignedTasks(assignedRes.data.tasks)
        setOverdueTasks(overdueRes.data.tasks)
        setStats(statsRes.data)
      } catch (err) {
        console.error('Error fetching tasks', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [filters])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"
      />
    </div>
  )

 
  const pieData = {
    labels: ['Completed', 'Pending', 'In Progress', 'Overdue'],
    datasets: [
      {
        label: 'Tasks',
        data: [stats?.completedCount, stats?.pendingCount, stats?.inProgressCount, stats?.overdueCount],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',  
          'rgba(251, 191, 36, 0.8)', 
          'rgba(147, 51, 234, 0.8)', 
          'rgba(239, 68, 68, 0.8)',  
        ],
        borderColor: [
          'rgb(52, 211, 153)',
          'rgb(251, 191, 36)',
          'rgb(147, 51, 234)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  }


  const barData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Tasks',
        data: [
          stats?.priorityCounts?.High || 0,
          stats?.priorityCounts?.Medium || 0,
          stats?.priorityCounts?.Low || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',  
          'rgba(251, 191, 36, 0.8)', 
          'rgba(52, 211, 153, 0.8)',  
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(52, 211, 153)',
        ],
        borderWidth: 1,
      },
    ],
  }


  const lineData = {
    labels: stats?.history.map(h => h.date),
    datasets: [
      {
        label: 'Tasks Completed',
        data: stats?.history.map(h => h.completed),
        borderColor: 'rgb(147, 51, 234)',  
        backgroundColor: 'rgba(147, 51, 234, 0.1)',  
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  }

  const filterTasks = (tasks) => {
    return tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase())

      const matchesStatus = filters.status ? task.status === filters.status : true
      const matchesPriority = filters.priority ? task.priority === filters.priority : true
      const matchesDueDate =
        (filters.dueDateFrom && new Date(task.dueDate) < new Date(filters.dueDateFrom)) ||
        (filters.dueDateTo && new Date(task.dueDate) > new Date(filters.dueDateTo))
          ? false
          : true

      return matchesSearch && matchesStatus && matchesPriority && matchesDueDate
    })
  }

  const filteredCreatedTasks = filterTasks(createdTasks)
  const filteredAssignedTasks = filterTasks(assignedTasks)
  const filteredOverdueTasks = filterTasks(overdueTasks)

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

  const TaskList = ({ tasks, title, total }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1"
    >
      <div className="mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold text-gray-800">{title}</h2>
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
          >
            Total: {total}
          </motion.span>
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-50 rounded-xl shadow-sm overflow-hidden h-[500px] border border-gray-200 hover:shadow-md transition-all duration-200"
      >
        <div className="divide-y divide-gray-200 h-full overflow-y-auto">
          <AnimatePresence>
            {tasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, backgroundColor: "white" }}
                className="p-4 transition-colors border-b border-gray-200 last:border-b-0 group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-gray-800 transition-colors">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
                  </div>
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                  >
                    {task.status}
                  </motion.span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </motion.span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="p-4 text-center text-gray-500 border-b border-gray-200"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400" />
              </motion.div>
              <p className="mt-2">No tasks found</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
    >
      <div className="p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Task Dashboard
          </h1>
          <p className="text-gray-600">Track and manage your tasks</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: "Completed Tasks", count: stats?.completedCount || 0, color: "green" },
            { title: "Pending Tasks", count: stats?.pendingCount || 0, color: "yellow" },
            { title: "Overdue Tasks", count: stats?.overdueCount || 0, color: "red" }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-gray-50 rounded-xl shadow-sm p-6 border-l-4 border-${stat.color}-500`}
            >
              <div>
                <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.count}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
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
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </motion.div>

            {[
              { label: "Status", value: filters.status, setter: (value) => setFilters({ ...filters, status: value }), options: [
                { value: "", label: "All Status" },
                { value: "Pending", label: "Pending" },
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
                { value: "Overdue", label: "Overdue" }
              ]},
              { label: "Priority", value: filters.priority, setter: (value) => setFilters({ ...filters, priority: value }), options: [
                { value: "", label: "All Priority" },
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" }
              ]}
            ].map((filter, index) => (
              <motion.select
                key={filter.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                value={filter.value}
                onChange={(e) => filter.setter(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
              >
                {filter.options.map(option => (
                  <option key={option.value} value={option.value} className="text-gray-900">
                    {option.label}
                  </option>
                ))}
              </motion.select>
            ))}

            {[
              { label: "From", value: filters.dueDateFrom, setter: (value) => setFilters({ ...filters, dueDateFrom: value }) },
              { label: "To", value: filters.dueDateTo, setter: (value) => setFilters({ ...filters, dueDateTo: value }) }
            ].map((date, index) => (
              <motion.div
                key={date.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (index + 2) * 0.1 }}
                className="relative"
              >
                <input
                  type="date"
                  value={date.value}
                  onChange={(e) => date.setter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                />
                <span className="absolute -top-2 left-3 px-1 text-xs text-gray-500 bg-white">
                  {date.label} Date
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Task Lists */}
        <div className="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TaskList 
            tasks={filteredCreatedTasks} 
            title="Tasks Created by You" 
            total={createdTasks.length} 
          />
          <TaskList 
            tasks={filteredAssignedTasks} 
            title="Tasks Assigned to You" 
            total={assignedTasks.length} 
          />
          <TaskList 
            tasks={filteredOverdueTasks} 
            title="Overdue Tasks" 
            total={overdueTasks.length} 
          />
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Row 1: Two Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { title: "Task Status Distribution", data: pieData, component: Pie },
              { title: "Task Priority Breakdown", data: barData, component: Bar }
            ].map((chart, index) => (
              <motion.div
                key={chart.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="bg-gray-50 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{chart.title}</h2>
                <div className="h-80">
                  <chart.component 
                    data={chart.data} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            font: {
                              size: 12
                            }
                          }
                        }
                      },
                      maintainAspectRatio: false,
                      responsive: true
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
            className="bg-gray-50 rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Completion Over Time</h2>
            <div className="h-80">
              <Line 
                data={lineData} 
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  },
                  maintainAspectRatio: false,
                  responsive: true
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default page