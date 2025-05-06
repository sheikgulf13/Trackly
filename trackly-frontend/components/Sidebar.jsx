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
    <aside className="sidebar">
      <div className="menu">
        {navItems[role]?.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={pathname === href ? 'active' : ''}
          >
            {label}
          </Link>
        ))}
      </div>
      <button className="logout" onClick={logout}>Logout</button>
    </aside>
  );
};

export default Sidebar;
