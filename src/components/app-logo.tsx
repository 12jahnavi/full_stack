import { Megaphone } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-xl font-bold text-primary',
        className
      )}
    >
      <Megaphone className="h-6 w-6" />
      <span>CityZen Complaints</span>
    </Link>
  );
}
