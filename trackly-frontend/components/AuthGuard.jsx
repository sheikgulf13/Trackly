'use client';
import { useEffect, useState, memo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AuthGuard = memo(function AuthGuard({ allowedRoles, children }) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = useCallback(() => {
    return pathname === '/user/login' || 
           pathname === '/user/register' || 
           pathname === '/admin/register' || 
           pathname === '/admin/login';
  }, [pathname]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('role');

      if (isAuthPage()) {
        return;
      }

      if (!token || !allowedRoles.includes(role)) {
        router.push('/');
      } else {
        setIsAllowed(true);
      }
    };

    checkAuth();
  }, [isAuthPage, allowedRoles, router]);

  if (isAuthPage()) {
    return children;
  }

  return isAllowed ? children : null;
});

export default AuthGuard;
