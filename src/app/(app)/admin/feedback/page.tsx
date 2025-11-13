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
import { collection, query, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Feedback } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';

export default function AdminFeedbackPage() {
  const { firestore, user, auth, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
      if (firestore) {
        const adminDoc = await getDoc(doc(firestore, 'admins', user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          await auth.signOut();
          router.push('/login');
        }
      }
      setAuthChecked(true);
    };

    checkAdmin();
  }, [user, isUserLoading, router, firestore, auth]);

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;

  const feedbackQuery = useMemoFirebase(() => {
    if (!firestore || !authChecked || !isAdmin) return null;
    return query(collection(firestore, 'feedback'), orderBy('date', 'desc'));
  }, [firestore, authChecked, isAdmin]);

  const { data: feedback, isLoading: isLoadingFeedback } = useCollection<Feedback>(feedbackQuery);

  const totalPages = Math.ceil((feedback?.length || 0) / itemsPerPage);
  const paginatedFeedback = (feedback || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoading = isUserLoading || !authChecked || isLoadingFeedback;

  if (isLoading) {
    return <div className="h-24 text-center">Verifying administrator access and loading feedback...</div>;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Citizen Feedback</h2>
          <p className="text-muted-foreground">
            View all submitted feedback.
          </p>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted By</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Complaint Title</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Suggestions</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeedback.length > 0 ? (
              paginatedFeedback.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div>{item.email}</div>
                    <div>{item.phone}</div>
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{renderStars(item.rating)}</TableCell>
                  <TableCell className="max-w-xs truncate">{item.suggestions || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date((item.date as Timestamp).seconds * 1000).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No feedback found.
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
