'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NavItem = memo(function NavItem({ label, href, icon, isActive, index }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 * index }}
    >
      <Link
        href={href}
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-purple-100 text-purple-800 shadow-sm'
            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
        }`}
      >
        <motion.span 
          className="mr-3 text-lg"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.span>
        {label}
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 w-1 h-8 bg-purple-600 rounded-r-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  );
});

function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = {
    user: [
      { label: 'Dashboard', href: '/user/dashboard', icon: '📊' },
      { label: 'My Tasks', href: '/user/tasks', icon: '✓' },
    ],
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { label: 'Manage Tasks', href: '/admin/tasks', icon: '📝' },
      { label: 'Audit Logs', href: '/admin/logs', icon: '📋' },
    ],
  };

  const logout = useCallback(async () => {
    document.cookie = 'refreshToken=; Max-Age=0; path=/';
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    router.push('/');
  }, [router]);

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 shadow-lg"
    >
      <div className="p-6 flex-1">
        <motion.h2 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-8"
        >
          {role === 'user' ? 'User Panel' : 'Admin Panel'}
        </motion.h2>
        
        <nav className="space-y-2">
          <AnimatePresence>
            {navItems[role]?.map((item, index) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={pathname === item.href}
                index={index}
              />
            ))}
          </AnimatePresence>
        </nav>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-6"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md"
        >
          <span className="mr-2">🚪</span>
          Logout
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}

export default memo(Sidebar);
