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
import { collection, query, orderBy } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Feedback } from '@/lib/definitions';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminFeedbackPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const allFeedbackQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'feedback'), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: feedback, isLoading: isLoadingFeedback } =
    useCollection<Feedback>(allFeedbackQuery);

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil((feedback?.length || 0) / itemsPerPage);
  const paginatedFeedback = (feedback || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
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

  if (isUserLoading || isLoadingFeedback) {
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
              <TableHead>Complaint ID</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comments</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeedback.length > 0 ? (
              paginatedFeedback.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.complaintId.substring(0, 7)}...
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
                  <TableCell className="max-w-xs truncate">{item.comments}</TableCell>
                  <TableCell>{getSentimentBadge(item.sentiment)}</TableCell>
                  <TableCell>
                    {item.date
                      ? new Date(
                          // @ts-ignore
                          item.date.seconds * 1000
                        ).toLocaleDateString()
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
