"use client"

import Sidebar from '../../../../components/Sidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { SocketProvider } from '../../../../src/contexts/SocketContext';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';

const UserLayout = memo(function UserLayout({ children }) {
  return (
    <AuthGuard allowedRoles={['User']}>
      <SocketProvider>
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
            <Sidebar role="user" />
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
          <Toaster />
        </motion.div>
      </SocketProvider>
    </AuthGuard>
  );
});

export default UserLayout;
