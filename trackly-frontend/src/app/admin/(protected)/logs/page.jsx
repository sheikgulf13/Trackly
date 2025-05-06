"use client";

import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

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
        const token = localStorage.getItem('token');
        const params = {};
  
        if (actionFilter) params.action = actionFilter;
        if (userFilter) params.userId = userFilter;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
  
        const res = await axios.get('http://localhost:5000/api/admin/get_audit_logs', {
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
      <div className="p-4 max-h-screen flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
  
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded w-64"
          />
  
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border p-2 rounded w-48"
          >
            <option value="">All Actions</option>
            <option value="create_task">Create Task</option>
            <option value="assign_task">Assign Task</option>
            <option value="delete_task">Delete Task</option>
          </select>
  
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border p-2 rounded w-48"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>
  
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded"
          />
  
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded"
          />
  
          <button
            onClick={() => {
              setFromDate('');
              setToDate('');
              setActionFilter('');
              setUserFilter('');
              setSearch('');
            }}
            className="border px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
  
        {/* Log List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 mt-16">No audit logs found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log._id} className="border rounded p-4 shadow-sm">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>{format(new Date(log.timestamp), 'PPpp')}</span>
                  <span className="uppercase font-medium">{log.action}</span>
                </div>
                <div className="text-sm mb-1">
                  <strong>{log?.userId?.name || 'Unknown User'}</strong>{' '}
                  performed action on{' '}
                  <em>{log?.taskId?.title || 'Unknown Task'}</em>
                </div>
                {log.details && (
                  <pre className="bg-gray-50 text-xs p-2 rounded mt-2 whitespace-pre-wrap break-words overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

export default page;
