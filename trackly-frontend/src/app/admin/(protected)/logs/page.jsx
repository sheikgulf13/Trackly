"use client";

import React from "react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../../../../lib/api";

const page = () => {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
  
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const params = {};
  
        if (actionFilter) params.action = actionFilter;
        if (userFilter) params.userId = userFilter;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
  
        const res = await api.get('/admin/get_audit_logs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        });
  
        const logs = res.data.data || [];
        setLogs(logs);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      }
    };
  
    useEffect(() => {
      fetchLogs();
    }, [actionFilter, userFilter, fromDate, toDate]);
  
    useEffect(() => {
      const seen = {};
      const uniqueUsers = [];
  
      logs.forEach((log) => {
        if (log?.userId && !seen[log.userId._id]) {
          seen[log.userId._id] = true;
          uniqueUsers.push(log.userId);
        }
      });
  
      setUsers(uniqueUsers);
    }, [logs]);
  
    useEffect(() => {
      const lowerSearch = search.toLowerCase();
  
      const filtered = logs.filter((log) => {
        const matchSearch =
          log?.userId?.name?.toLowerCase().includes(lowerSearch) ||
          log?.taskId?.title?.toLowerCase().includes(lowerSearch) ||
          JSON.stringify(log.details || {}).toLowerCase().includes(lowerSearch);
  
        return matchSearch;
      });
  
      setFilteredLogs(filtered);
    }, [search, logs]);
  
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
            <p className="text-gray-600">Track and monitor all system activities</p>
          </div>
  
          {/* Filters */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
                />
              </div>
  
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
              >
                <option value="" className="text-gray-700">All Actions</option>
                <option value="create_task" className="text-gray-900">Create Task</option>
                <option value="update_task" className="text-gray-900">Update Task</option>
                <option value="assign_task" className="text-gray-900">Assign Task</option>
                <option value="delete_task" className="text-gray-900">Delete Task</option>
              </select>
  
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
              >
                <option value="" className="text-gray-700">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id} className="text-gray-900">
                    {user.name}
                  </option>
                ))}
              </select>
  
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
              />
  
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-700"
              />
            </div>
  
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setActionFilter('');
                  setUserFilter('');
                  setSearch('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
  
          {/* Log List */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-4 text-gray-500">No audit logs found</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.action === 'create_task' ? 'bg-green-100 text-green-800' :
                          log.action === 'assign_task' ? 'bg-blue-100 text-blue-800' :
                          log.action === 'delete_task' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'PPpp')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{log?.userId?.name || 'Unknown User'}</span>
                        <span className="text-gray-500"> performed action on </span>
                        <span className="font-medium text-gray-900">{log?.taskId?.title || 'Unknown Task'}</span>
                      </div>
                      
                      {log.details && (
                        <div className="mt-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

export default page;
