'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import AppLogo from './app-logo';
import { useFirebase } from '@/firebase';

export default function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebase();

  // Show admin links if a user is logged in (not anonymous).
  const isAdmin = !isUserLoading && user && !user.isAnonymous;

  const routes = [
    {
      href: '/complaints/new',
      label: 'New Complaint',
      active: pathname === '/complaints/new',
      visible: true,
    },
    {
      href: '/admin',
      label: 'Admin Dashboard',
      active: pathname.startsWith('/admin'),
      visible: isAdmin,
    },
  ];

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
