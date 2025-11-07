'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import AppLogo from './app-logo';
import { users } from '@/lib/data';

export default function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  // In a real app, you'd get the user role from a session.
  const user = users[0]; // Assuming citizen user for nav links
  const isAdmin = pathname.startsWith('/admin');

  const routes = [
    {
      href: '/dashboard',
      label: 'My Dashboard',
      active: pathname === '/dashboard',
      admin: false,
    },
    {
      href: '/admin',
      label: 'Admin Dashboard',
      active: pathname === '/admin',
      admin: true,
    },
    {
      href: '/complaints/new',
      label: 'New Complaint',
      active: pathname === '/complaints/new',
      admin: false,
    },
    {
      href: '/sentiment-analyzer',
      label: 'Sentiment Analyzer',
      active: pathname === '/sentiment-analyzer',
      admin: true,
    },
  ];

  const visibleRoutes = routes.filter(route => isAdmin ? route.admin : !route.admin);

  return (
    <nav
      className={cn('flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      <AppLogo className="hidden md:flex" />
      {visibleRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
