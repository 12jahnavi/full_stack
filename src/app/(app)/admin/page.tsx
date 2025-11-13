'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Pagination from '@/components/pagination';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  collection,
  query,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import type { Complaint } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { ComplaintActions } from '@/components/complaint-actions';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function AdminDashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
        if (user && firestore) {
            const adminDoc = await getDoc(doc(firestore, 'admins', user.uid));
            if (adminDoc.exists()) {
                setIsAdmin(true);
            } else {
                // If not an admin, redirect away
                router.push('/complaints/new');
            }
        }
    };
    if (user) {
        checkAdmin();
    }

  }, [user, isUserLoading, router, firestore]);

  const queryTerm = searchParams.get('query') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;

  const allComplaintsQuery = useMemoFirebase(() => {
    // CRITICAL FIX: Only run query if the user is confirmed to be an admin.
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'complaints'), orderBy('date', 'desc'));
  }, [firestore, isAdmin]);

  const { data: allComplaints, isLoading: isLoadingAll } = useCollection<Complaint>(allComplaintsQuery);

  const filteredComplaints = useMemo(() => {
    if (!allComplaints) return [];
    if (!queryTerm) return allComplaints;
    return allComplaints.filter(complaint =>
      complaint.title.toLowerCase().includes(queryTerm.toLowerCase()) ||
      (complaint.name && complaint.name.toLowerCase().includes(queryTerm.toLowerCase())) ||
      (complaint.email && complaint.email.toLowerCase().includes(queryTerm.toLowerCase())) ||
      complaint.category.toLowerCase().includes(queryTerm.toLowerCase())
    );
  }, [allComplaints, queryTerm]);


  const totalPages = Math.ceil((filteredComplaints?.length || 0) / itemsPerPage);
  const paginatedComplaints = (filteredComplaints || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoading = isUserLoading || isLoadingAll || !isAdmin;

  if (isLoading) {
    return <div className="h-24 text-center">Loading complaints...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            View and manage all citizen complaints.
          </p>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint ID</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedComplaints.length > 0 ? (
              paginatedComplaints.map(complaint => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-mono text-xs">
                    {complaint.id.substring(0, 5)}...
                  </TableCell>
                   <TableCell className="font-medium">{complaint.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{complaint.title}</TableCell>
                  <TableCell>{complaint.category}</TableCell>
                   <TableCell>
                    <ComplaintStatusBadge status={complaint.priority} />
                  </TableCell>
                  <TableCell>
                    <ComplaintStatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(complaint.date.seconds * 1000).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ComplaintActions complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No complaints found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <Pagination totalPages={totalPages} />
      </div>
    </>
  );
}
