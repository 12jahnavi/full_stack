import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Complaint } from '@/lib/definitions';

export default function ComplaintStatusBadge({ status }: { status: Complaint['status'] }) {
  const variant = {
    'Pending': 'default',
    'In Progress': 'secondary',
    'Resolved': 'outline',
    'Rejected': 'destructive',
  }[status] as "default" | "secondary" | "destructive" | "outline" | null | undefined;
  
  const customClass = {
    'Resolved': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'In Progress': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    'Rejected': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  }[status];

  return <Badge variant={variant} className={cn('capitalize', customClass)}>{status}</Badge>;
}
