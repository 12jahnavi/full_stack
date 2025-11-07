'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { ComplaintActions } from '@/components/complaint-actions';
import Pagination from '@/components/pagination';
import { useFirebase } from '@/firebase';
import {
  collectionGroup,
  query,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Complaint } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface EnrichedComplaint extends Complaint {
  citizenId: string;
  userName: string;
}

export default function AdminDashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  const searchParams = useSearchParams();
  const [complaints, setComplaints] = useState<EnrichedComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Redirect if user is not an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isUserLoading) return;
      if (!user) {
        router.push('/login');
        return;
      }
      if (firestore) {
        const adminDocRef = doc(firestore, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (!adminDoc.exists()) {
          router.push('/dashboard');
        } else {
          setIsAdmin(true);
        }
      }
    };
    checkAdminStatus();
  }, [user, isUserLoading, router, firestore]);

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const complaintsQuery = query(collectionGroup(firestore, 'complaints'));
        const querySnapshot = await getDocs(complaintsQuery);
        const allComplaints: EnrichedComplaint[] = [];

        for (const complaintDoc of querySnapshot.docs) {
          const complaintData = complaintDoc.data() as Complaint;
          const citizenId = complaintDoc.ref.parent.parent?.id;

          if (citizenId) {
            const userDocRef = doc(firestore, 'citizens', citizenId);
            const userDoc = await getDoc(userDocRef);

            const userName = userDoc.exists()
              ? `${userDoc.data().firstName} ${userDoc.data().lastName}`
              : 'Unknown User';

            allComplaints.push({
              ...(complaintData as Complaint),
              id: complaintDoc.id,
              citizenId,
              userName,
            });
          }
        }
        setComplaints(allComplaints);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAdmin) {
      fetchComplaints();
    }
  }, [firestore, isAdmin]);

  const queryParam = searchParams.get('query') || '';
  const filteredComplaints = complaints.filter(
    complaint =>
      complaint.title.toLowerCase().includes(queryParam.toLowerCase()) ||
      complaint.description.toLowerCase().includes(queryParam.toLowerCase()) ||
      complaint.id.toLowerCase().includes(queryParam.toLowerCase())
  );

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isUserLoading || !isAdmin) {
    return <div className="h-24 text-center">Loading or redirecting...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and resolve all citizen complaints.
          </p>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedComplaints.length > 0 ? (
              paginatedComplaints.map(complaint => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-mono text-xs">
                    {complaint.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {complaint.title}
                  </TableCell>
                  <TableCell>{complaint.userName}</TableCell>
                  <TableCell>{complaint.priority}</TableCell>
                  <TableCell>
                    {complaint.date
                      ? new Date(
                          complaint.date.seconds * 1000
                        ).toLocaleDateString()
                      : 'No date'}
                  </TableCell>
                  <TableCell>
                    <ComplaintStatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ComplaintActions complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
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
