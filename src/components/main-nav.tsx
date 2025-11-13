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
  const { user, firestore, isUserLoading } = useFirebase();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Only check for admin status if the user is signed in (not anonymous)
      if (user && !user.isAnonymous && firestore) {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      } else {
        // For anonymous or logged-out users, they are never admins.
        setIsAdmin(false);
      }
    };
    // Don't check status until we know who the user is
    if (!isUserLoading) {
      checkAdminStatus();
    }
  }, [user, firestore, isUserLoading]);

  // Define all possible routes
  const routes = [
    {
      href: '/complaints/new',
      label: 'New Complaint',
      active: pathname === '/complaints/new',
      // Visible to everyone
      visible: true,
    },
    {
      href: '/feedback',
      label: 'Submit Feedback',
      active: pathname === '/feedback',
      // Visible to everyone
      visible: true,
    },
    {
      href: '/admin',
      label: 'Admin Dashboard',
      active: pathname.startsWith('/admin') && !pathname.startsWith('/admin/feedback'),
      // Only for admins
      visible: isAdmin,
    },
    {
      href: '/admin/feedback',
      label: 'Feedback',
      active: pathname === '/admin/feedback',
      // Only for admins
      visible: isAdmin,
    },
  ];

  // Filter routes based on visibility
  const visibleRoutes = routes.filter(route => route.visible);

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
