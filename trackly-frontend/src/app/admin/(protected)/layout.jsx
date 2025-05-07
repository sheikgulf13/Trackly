"use client"

import Sidebar from '../../../../components/Sidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';

const AdminLayout = memo(function AdminLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['Admin']}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-screen flex overflow-hidden bg-gray-50"
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Sidebar role="admin" />
        </motion.div>
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex-1 overflow-y-auto"
        >
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </motion.main>
      </motion.div>
    </AuthGuard>
  );
});

export default AdminLayout;
