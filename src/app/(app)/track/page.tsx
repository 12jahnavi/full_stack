'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Complaint } from '@/lib/definitions';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { FeedbackDialog } from '@/components/feedback-dialog';

const TrackSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your full name.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

type TrackFormValues = z.infer<typeof TrackSchema>;

export default function TrackComplaintPage() {
  const { firestore } = useFirebase();
  const [searchCriteria, setSearchCriteria] = useState<TrackFormValues | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TrackFormValues>({
    resolver: zodResolver(TrackSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit: SubmitHandler<TrackFormValues> = async (data) => {
    if (!firestore) {
        setError('Database connection not available.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setComplaints([]);
    setSearchCriteria(data);

    try {
        const complaintsQuery = query(
            collection(firestore, 'complaints'),
            where('email', '==', data.email),
            where('name', '==', data.name)
        );
        const querySnapshot = await getDocs(complaintsQuery);
        const foundComplaints: Complaint[] = [];
        querySnapshot.forEach(doc => {
            foundComplaints.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        setComplaints(foundComplaints);
        if (foundComplaints.length === 0) {
            setError("No complaints found for this name and email combination.");
        }
    } catch (e) {
        console.error(e);
        setError("An error occurred while fetching your complaints. The security rules might be preventing access.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Track Your Complaint</h2>
        <p className="text-muted-foreground">
          Enter your name and email to find your submitted complaints.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Find Complaints</CardTitle>
            <CardDescription>Enter the details used during submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Searching...' : 'Search'}</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Complaints</h3>
            {isLoading && <p>Loading...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {!isLoading && complaints.length > 0 && (
                <div className="space-y-4 rounded-lg border p-4">
                    {complaints.map(complaint => (
                        <div key={complaint.id} className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{complaint.title}</p>
                                <p className="text-sm text-muted-foreground">ID: {complaint.id}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <ComplaintStatusBadge status={complaint.status} />
                                {complaint.status === 'Resolved' && (
                                    <FeedbackDialog complaint={complaint} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
             {!isLoading && !error && searchCriteria && complaints.length === 0 && (
                <p>No complaints found for the provided details.</p>
            )}
        </div>
      </div>
    </>
  );
}
