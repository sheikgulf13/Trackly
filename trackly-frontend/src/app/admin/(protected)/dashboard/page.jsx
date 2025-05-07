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
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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
    const [stats, setStats] = useState([])
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      const fetchStats = async () => {
        try {
          const token = localStorage.getItem('accessToken')
  
          const res = await axios.get('http://localhost:5000/api/admin/get_analytics', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
  
          setStats(res.data.data)
        } catch (err) {
          console.error('Failed to fetch analytics:', err)
          toast.error(err.response?.data?.message || 'Failed to fetch analytics')
        } finally {
          setLoading(false)
        }
      }
  
      fetchStats()
    }, [])
  
    if (loading) return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    )
  
    const totalTasks = stats.reduce((acc, s) => acc + s.total, 0)
    const inProgressTasks = stats.reduce((acc, s) => acc + s.inProgress, 0)
    const completedTasks = stats.reduce((acc, s) => acc + s.completed, 0)
    const overdueTasks = stats.reduce((acc, s) => acc + s.overdue, 0)
  
    const pieData = {
      labels: ['Completed', 'Pending', 'In Progress', 'Overdue'],
      datasets: [
        {
          label: 'Task Status Overview',
          data: [completedTasks, totalTasks - completedTasks - inProgressTasks - overdueTasks, inProgressTasks, overdueTasks],
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
  
    const pieData2 = {
      labels: stats.map((s) => s.user.name),
      datasets: [
        {
          label: 'Total Tasks by User',
          data: stats.map((s) => s.total),
          backgroundColor: [
            'rgba(147, 51, 234, 0.8)', 
            'rgba(99, 102, 241, 0.8)',  
            'rgba(236, 72, 153, 0.8)',  
            'rgba(251, 191, 36, 0.8)',  
            'rgba(52, 211, 153, 0.8)',  
            'rgba(59, 130, 246, 0.8)', 
            'rgba(239, 68, 68, 0.8)',   
          ],
          borderColor: [
            'rgb(147, 51, 234)',
            'rgb(99, 102, 241)',
            'rgb(236, 72, 153)',
            'rgb(251, 191, 36)',
            'rgb(52, 211, 153)',
            'rgb(59, 130, 246)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 1,
        },
      ],
    }
  
    const stackedBarData = {
      labels: stats.map((s) => s.user.name),
      datasets: [
        {
          label: 'Completed',
          data: stats.map((s) => s.completed),
          backgroundColor: 'rgba(52, 211, 153, 0.8)',  
          borderColor: 'rgb(52, 211, 153)',
          borderWidth: 1,
        },
        {
          label: 'In Progress',
          data: stats.map((s) => s.inProgress),
          backgroundColor: 'rgba(147, 51, 234, 0.8)',  
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
        },
        {
          label: 'Pending',
          data: stats.map((s) => s.total - s.completed - s.inProgress - s.overdue),
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgb(251, 191, 36)',
          borderWidth: 1,
        },
        {
          label: 'Overdue',
          data: stats.map((s) => s.overdue),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',  
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    }
  
    const lineData = {
      labels: stats.map((s) => s.user.name),
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: stats.map((s) => parseFloat(s.completionRate)),
          borderColor: 'rgb(147, 51, 234)',  
          backgroundColor: 'rgba(147, 51, 234, 0.1)',  
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: 'rgb(147, 51, 234)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }
  
    const barData = {
      labels: stats.map((s) => s.user.name),
      datasets: [
        {
          label: 'Overdue Tasks',
          data: stats.map((s) => s.overdue),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',  
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
        },
      ],
    }
  
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full overflow-y-auto bg-white"
      >
        <div className="p-8">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 mt-2">Welcome to your admin dashboard</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {[
              { title: 'Total Tasks', value: totalTasks, color: 'green' },
              { title: 'Completed Tasks', value: completedTasks, color: 'blue' },
              { title: 'Overdue Tasks', value: overdueTasks, color: 'red' }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 border-${stat.color}-500 hover:shadow-xl transition-all duration-300`}
              >
                <div>
                  <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
    
          {/* Charts Grid */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Row 1: Two Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
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
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Status by User</h2>
                <div className="h-80">
                  <Bar 
                    data={stackedBarData} 
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
                        x: {
                          stacked: true,
                          grid: {
                            display: false
                          }
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
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
    
            {/* Row 2: Line Chart */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 w-full"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Completion Rate per User</h2>
              <div className="h-80 w-full">
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
                        max: 100,
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
    
            {/* Row 3: Bar Chart */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 w-full"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Overdue Tasks per User</h2>
              <div className="h-80 w-full">
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
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

export default page