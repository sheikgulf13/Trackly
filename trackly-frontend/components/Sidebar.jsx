'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Sidebar = ({ role }) => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = {
    user: [
      { label: 'Dashboard', href: '/user/dashboard' },
      { label: 'My Tasks', href: '/user/tasks' },
    ],
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Manage Tasks', href: '/admin/tasks' },
      { label: 'Audit Logs', href: '/admin/logs' },
    ],
  };

  const logout = async () => {
    document.cookie = 'refreshToken=; Max-Age=0; path=/';
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    router.push('/');
  };

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-200">
      <div className="p-6 flex-1">
        <h2 className="text-xl font-bold text-purple-800 mb-8">
          {role === 'user' ? 'User Panel' : 'Admin Panel'}
        </h2>
        
        <nav className="space-y-2">
          {navItems[role]?.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                pathname === href
                  ? 'bg-purple-100 text-purple-800'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-6">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
