'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import AppLogo from './app-logo';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { user, firestore } = useFirebase();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && !user.isAnonymous && firestore) {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user, firestore]);

  const routes = [
    {
      href: '/complaints/new',
      label: 'New Complaint',
      active: pathname === '/complaints/new',
      role: 'all',
    },
    {
      href: '/admin',
      label: 'Admin Dashboard',
      active: pathname === '/admin',
      role: 'admin',
    },
  ];

  const visibleRoutes = routes.filter(route => {
    if (route.role === 'all') return true;
    return isAdmin && route.role === 'admin';
  });

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <AppLogo className="mr-6 hidden md:flex" />
      {visibleRoutes.map(route => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active
              ? 'text-black dark:text-white'
              : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
