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
import { collection, query, orderBy, Timestamp, getDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Feedback } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Extending Feedback to include a potential date as Timestamp
interface FeedbackWithTimestamp extends Omit<Feedback, 'date'> {
    date?: Timestamp;
    complaintTitle?: string;
}

export default function AdminFeedbackPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isUserLoading) return; // Wait until auth state is determined

    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdmin = async () => {
        if (firestore) {
            const adminDoc = await getDoc(doc(firestore, 'admins', user.uid));
            if (adminDoc.exists()) {
                setIsAdmin(true);
            } else {
                router.push('/'); // Redirect non-admins to home
            }
        }
        setAuthChecked(true); // Mark that we have checked admin status
    };
    
    checkAdmin();

  }, [user, isUserLoading, router, firestore]);

  const allFeedbackQuery = useMemoFirebase(() => {
    // CRITICAL FIX: Only run query if auth has been checked and user is an admin
    if (!firestore || !authChecked || !isAdmin) return null;
    // The security rules ensure only admins can read this collection
    return query(collection(firestore, 'feedback'), orderBy('date', 'desc'));
  }, [firestore, authChecked, isAdmin]);

  const { data: feedback, isLoading: isLoadingFeedback } =
    useCollection<FeedbackWithTimestamp>(allFeedbackQuery);

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil((feedback?.length || 0) / itemsPerPage);
  const paginatedFeedback = (feedback || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return <Badge variant="outline">N/A</Badge>;
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Badge className="bg-green-500 text-white">Positive</Badge>;
      case 'negative':
        return <Badge variant="destructive">Negative</Badge>;
      case 'neutral':
        return <Badge variant="secondary">Neutral</Badge>;
      default:
        return <Badge>{sentiment}</Badge>;
    }
  };

  const isLoading = isUserLoading || !authChecked || isLoadingFeedback;

  if (isLoading) {
    return <div className="h-24 text-center">Loading Feedback...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Citizen Feedback</h2>
          <p className="text-muted-foreground">
            Review feedback submitted for resolved complaints.
          </p>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Complaint Title</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeedback.length > 0 ? (
              paginatedFeedback.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.complaintTitle || item.complaintId.substring(0, 20)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < item.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                  <TableCell>{getSentimentBadge(item.sentiment)}</TableCell>
                  <TableCell>
                    {item.date
                      ? new Date(item.date.seconds * 1000).toLocaleDateString()
                      : 'No date'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
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
