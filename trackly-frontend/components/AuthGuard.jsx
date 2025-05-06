'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthGuard({ allowedRoles, children }) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/user/login' || pathname === '/user/register' || pathname === '/admin/register' || pathname === '/admin/register';

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');

    if(isAuthPage) {
        return
    }

    if (!token || !allowedRoles.includes(role)) {
      router.push('/');
    } else {
      setIsAllowed(true);
    }
  }, []);

  return isAllowed ? children : null;
}
