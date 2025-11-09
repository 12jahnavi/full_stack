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
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  collection,
  query,
  getDoc,
  doc,
  orderBy,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Complaint } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface EnrichedComplaint extends Complaint {
  userName: string;
}

export default function AdminDashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAdmin, setIsAdmin] = useState(false);
  const [enrichedComplaints, setEnrichedComplaints] = useState<EnrichedComplaint[]>([]);

  // 1. Check for admin status and redirect if not an admin
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
          router.push('/dashboard'); // Redirect non-admins
        } else {
          setIsAdmin(true);
        }
      }
    };
    checkAdminStatus();
  }, [user, isUserLoading, router, firestore]);

  // 2. Set up the real-time query for all complaints from the top-level collection
  const allComplaintsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'complaints'), orderBy('date', 'desc'));
  }, [firestore, isAdmin]);

  // 3. Use the hook to get real-time complaint data
  const { data: complaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(allComplaintsQuery);

  // 4. Enrich complaint data with citizen names when complaints are fetched
  useEffect(() => {
    const enrichComplaintData = async () => {
      if (!firestore || !complaints) {
          setEnrichedComplaints([]);
          return;
      };

      const enrichedPromises = complaints.map(async (complaint) => {
        if (!complaint || !complaint.citizenId) {
          console.warn(`Complaint ${complaint?.id} is invalid.`);
          return {
            ...complaint,
            userName: 'Unknown User',
          } as EnrichedComplaint;
        }

        let userName = 'Unknown User';
        try {
            const userDocRef = doc(firestore, 'citizens', complaint.citizenId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = `${userData.firstName} ${userData.lastName}`;
            }
        } catch(e) {
            console.error("Error fetching user name for complaint:", complaint.id, e);
        }

        return {
            ...complaint,
            userName: userName,
        };
      });

      const resolvedEnriched = (await Promise.all(enrichedPromises)).filter(Boolean) as EnrichedComplaint[];
      setEnrichedComplaints(resolvedEnriched);
    };

    enrichComplaintData();
  }, [complaints, firestore]);


  // 5. Pagination and Filtering logic
  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;
  const queryParam = searchParams.get('query') || '';

  const filteredComplaints = enrichedComplaints.filter(
    complaint =>
      complaint.title.toLowerCase().includes(queryParam.toLowerCase()) ||
      complaint.description.toLowerCase().includes(queryParam.toLowerCase()) ||
      complaint.id.toLowerCase().includes(queryParam.toLowerCase()) ||
      complaint.userName.toLowerCase().includes(queryParam.toLowerCase())
  );

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Show loading state until admin check and initial data load is complete
  if (isUserLoading || !isAdmin) {
    return <div className="h-24 text-center">Loading Admin Dashboard...</div>;
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
            {isLoadingComplaints ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading complaints...
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
                          // @ts-ignore
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
