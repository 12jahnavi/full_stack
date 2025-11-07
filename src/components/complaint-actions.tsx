'use client';

import { useTransition } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { deleteComplaint, updateComplaintStatus } from '@/lib/actions';
import { Complaint, ComplaintStatuses } from '@/lib/definitions';
import { usePathname } from 'next/navigation';
import { useFirebase } from '@/firebase';

export function ComplaintActions({ complaint }: { complaint: Complaint & { citizenId?: string } }) {
  const { user } = useFirebase();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const isAdminView = pathname.startsWith('/admin');

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      startTransition(() => {
        // Use citizenId from complaint if available (for admins), otherwise use current user's UID.
        const effectiveCitizenId = complaint.citizenId || user?.uid;
        if (effectiveCitizenId) {
          deleteComplaint(effectiveCitizenId, complaint.id);
        }
      });
    }
  };

  const handleStatusChange = (status: Complaint['status']) => {
    startTransition(() => {
        if (complaint.citizenId) {
            updateComplaintStatus(complaint.citizenId, complaint.id, status);
        }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(complaint.id)}>
          Copy Complaint ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {isAdminView && complaint.citizenId && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Update Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {ComplaintStatuses.map(status => (
                  <DropdownMenuItem 
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={isPending || complaint.status === status}
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}

        {(complaint.status === 'Pending' || isAdminView) && (
          <DropdownMenuItem className="text-destructive" onClick={handleDelete} disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
