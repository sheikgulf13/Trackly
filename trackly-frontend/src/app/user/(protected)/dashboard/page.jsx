'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
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
import { Search } from 'lucide-react'

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

  // Fetch tasks and statistics
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const query = new URLSearchParams(filters)

        // Fetch created tasks
        const createdRes = await axios.get(
          `http://localhost:5000/api/tasks/created_tasks?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Fetch assigned tasks
        const assignedRes = await axios.get(
          `http://localhost:5000/api/tasks/assigned_tasks?${query.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Fetch overdue tasks
        const overdueRes = await axios.get(
          `http://localhost:5000/api/tasks/overdue_tasks?`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Fetch stats
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
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  )

  // Pie chart data for task status
  const pieData = {
    labels: ['Completed', 'Pending', 'In Progress', 'Overdue'],
    datasets: [
      {
        label: 'Tasks',
        data: [stats?.completedCount, stats?.pendingCount, stats?.inProgressCount, stats?.overdueCount],
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',  // Soft green for Completed
          'rgba(251, 191, 36, 0.8)',  // Soft amber for Pending
          'rgba(147, 51, 234, 0.8)',  // Soft purple for In Progress
          'rgba(239, 68, 68, 0.8)',   // Soft red for Overdue
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

  // Bar chart data for task priority distribution
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
          'rgba(239, 68, 68, 0.8)',   // Soft red for High
          'rgba(251, 191, 36, 0.8)',  // Soft amber for Medium
          'rgba(52, 211, 153, 0.8)',  // Soft green for Low
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

  // Line chart data for task completion over time
  const lineData = {
    labels: stats?.history.map(h => h.date),
    datasets: [
      {
        label: 'Tasks Completed',
        data: stats?.history.map(h => h.completed),
        borderColor: 'rgb(147, 51, 234)',  // Purple line
        backgroundColor: 'rgba(147, 51, 234, 0.1)',  // Very light purple fill
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
    <div className="flex-1">
      <div className="mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-md font-semibold text-gray-800">{title}</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Total: {total}</span>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl shadow-sm overflow-hidden h-[500px] border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="divide-y divide-gray-200 h-full overflow-y-auto">
          {tasks.map((task) => (
            <div key={task._id} className="p-4 hover:bg-white transition-colors border-b border-gray-200 last:border-b-0 group">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-gray-800 transition-colors">{task.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{task.description}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="p-4 text-center text-gray-500 border-b border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2">No tasks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Task Dashboard</h1>
          <p className="text-gray-600">Track and manage your tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Completed Tasks</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.completedCount || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.pendingCount || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Overdue Tasks</h3>
            <p className="text-3xl font-bold text-gray-800">{stats?.overdueCount || 0}</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            >
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <input
              type="date"
              value={filters.dueDateFrom}
              onChange={(e) => setFilters({ ...filters, dueDateFrom: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
            />
            <input
              type="date"
              value={filters.dueDateTo}
              onChange={(e) => setFilters({ ...filters, dueDateTo: e.target.value })}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>

         {/* Task Lists */}
         <div className="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <TaskList 
              tasks={filteredCreatedTasks} 
              title="Tasks Created by You" 
              total={createdTasks.length} 
            />
          </div>
          <div className="space-y-6">
            <TaskList 
              tasks={filteredAssignedTasks} 
              title="Tasks Assigned to You" 
              total={assignedTasks.length} 
            />
          </div>
          <div className="space-y-6">
            <TaskList 
              tasks={filteredOverdueTasks} 
              title="Overdue Tasks" 
              total={overdueTasks.length} 
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Row 1: Two Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Status Distribution</h2>
              <div className="h-80">
                <Pie 
                  data={pieData} 
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
            </div>
            <div className="bg-gray-50 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Priority Breakdown</h2>
              <div className="h-80">
                <Bar 
                  data={barData} 
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
            </div>
          </div>

          {/* Row 2: Line Chart */}
          <div className="bg-gray-50 rounded-xl shadow-sm p-6">
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
          </div>
        </div>

       
      </div>
    </div>
  )
}

export default page