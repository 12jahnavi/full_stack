'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Complaint } from '@/lib/definitions';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { FeedbackDialog } from '@/components/feedback-dialog';

const LookupSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type LookupFormValues = z.infer<typeof LookupSchema>;

export default function FeedbackPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupEmail, setLookupEmail] = useState<string | null>(null);

  const form = useForm<LookupFormValues>({
    resolver: zodResolver(LookupSchema),
    defaultValues: {
      email: '',
    },
  });

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !lookupEmail) return null;
    return query(
      collection(firestore, 'complaints'),
      where('email', '==', lookupEmail),
      where('status', '==', 'Resolved')
    );
  }, [firestore, lookupEmail]);

  const {
    data: complaints,
    isLoading: isLoadingComplaints,
    error,
  } = useCollection<Complaint>(complaintsQuery);

  const onSubmit = (data: LookupFormValues) => {
    setLookupEmail(data.email);
  };

  if (error) {
    toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch complaints. Please check your email or try again later.'
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-2 mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Submit Feedback</h2>
        <p className="text-muted-foreground">
          Find your resolved complaint to leave feedback.
        </p>
      </div>

      {!lookupEmail ? (
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Find Your Complaint</CardTitle>
                <CardDescription>
                  Enter the email you used to submit your complaint.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Searching...' : 'Find Complaints'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      ) : (
        <div className="space-y-4">
             <Button variant="outline" onClick={() => setLookupEmail(null)}>Try a different email</Button>
          {isLoadingComplaints && <p>Loading resolved complaints...</p>}
          {complaints && complaints.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Found {complaints.length} resolved complaint(s) for{' '}
                <strong>{lookupEmail}</strong>
              </h3>
              {complaints.map(complaint => (
                <Card key={complaint.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{complaint.title}</span>
                       <ComplaintStatusBadge status={complaint.status} />
                    </CardTitle>
                    <CardDescription>
                        Submitted on: {new Date(complaint.date.seconds * 1000).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <FeedbackDialog complaint={complaint} />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>
                  No resolved complaints found for <strong>{lookupEmail}</strong>.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please make sure the email is correct and that the complaint status is 'Resolved'.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
