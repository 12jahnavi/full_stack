'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where } from 'firebase/firestore';
import type { Complaint } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function TrackResults() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { firestore } = useFirebase();

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !email) return null;
    return query(
      collection(firestore, 'complaints'),
      where('email', '==', email)
    );
  }, [firestore, email]);

  const {
    data: complaints,
    isLoading,
    error,
  } = useCollection<Complaint>(complaintsQuery);

  if (!email) {
    return (
      <div className="text-center text-muted-foreground">
        Please provide an email to track your complaints.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center">Searching for your complaints...</div>;
  }

  if (error) {
    return (
       <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          An error occurred while fetching your complaints. The security rules might be preventing access.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Your Complaints</h2>
        <p className="text-muted-foreground">
          Showing results for <span className="font-semibold">{email}</span>.
        </p>
      </div>

      {complaints && complaints.length > 0 ? (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <Card key={complaint.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <Link
                    href={`/complaints/${complaint.id}`}
                    className="hover:underline"
                  >
                    {complaint.title}
                  </Link>
                  <ComplaintStatusBadge status={complaint.status} />
                </CardTitle>
                <CardDescription>
                  Complaint ID: {complaint.id.substring(0, 7)}... | Submitted:{' '}
                  {complaint.date
                     // @ts-ignore
                    ? new Date(complaint.date.seconds * 1000).toLocaleDateString()
                    : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                {complaint.status === 'Resolved' && (
                  <FeedbackDialog complaint={complaint} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
            <CardHeader>
                <CardTitle>No Complaints Found</CardTitle>
                <CardDescription>
                    We couldn't find any complaints matching that email address.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline">
                    <Link href="/complaints/new">Submit a New Complaint</Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}


export default function TrackResultsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TrackResults />
        </Suspense>
    )
}
