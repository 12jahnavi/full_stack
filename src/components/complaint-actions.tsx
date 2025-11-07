'use client';

import { useState, useEffect } from 'react';
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
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { deleteComplaint, updateComplaintStatus } from '@/lib/data';
import { Complaint, ComplaintStatuses } from '@/lib/definitions';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

export function ComplaintActions({
  complaint,
}: {
  complaint: Complaint & { citizenId?: string };
}) {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && firestore) {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdmin(adminDoc.exists());
      }
    };
    checkAdminStatus();
  }, [user, firestore]);

  const handleDelete = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database not available.',
      });
      return;
    }
    if (
      confirm('Are you sure you want to delete this complaint? This action cannot be undone.')
    ) {
      setIsPending(true);
      const effectiveCitizenId = complaint.citizenId || user?.uid;
      if (effectiveCitizenId) {
        try {
          await deleteComplaint(firestore, effectiveCitizenId, complaint.id);
          toast({ title: 'Success', description: 'Complaint deleted.' });
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete complaint.',
          });
        } finally {
          setIsPending(false);
        }
      }
    }
  };

  const handleStatusChange = async (status: Complaint['status']) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database not available.',
      });
      return;
    }
    setIsPending(true);
    if (complaint.citizenId) {
      try {
        await updateComplaintStatus(
          firestore,
          complaint.citizenId,
          complaint.id,
          status
        );
        toast({ title: 'Success', description: 'Complaint status updated.' });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update status.',
        });
      } finally {
        setIsPending(false);
      }
    }
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
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(complaint.id)}
        >
          Copy Complaint ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {isAdmin && complaint.citizenId && (
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

        {(complaint.status === 'Pending' || isAdmin) && (
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
