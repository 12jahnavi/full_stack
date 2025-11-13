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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  analyzeCitizenFeedbackSentiment,
  type AnalyzeCitizenFeedbackSentimentOutput,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { Complaint } from '@/lib/definitions';

const FeedbackSchema = z.object({
  complaintId: z.string().min(1, 'Please select a complaint.'),
  rating: z.number().min(1, 'Please select a rating between 1 and 5.'),
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters long.')
    .max(500, 'Comments must be no more than 500 characters long.'),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

export default function FeedbackPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      complaintId: '',
      comments: '',
      rating: 0,
    },
  });

  const resolvedComplaintsQuery = useMemoFirebase(() => {
    // CRITICAL: Don't run query until we have a user (even anonymous)
    if (!firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'complaints'),
      where('status', '==', 'Resolved')
    );
  }, [firestore, isUserLoading]);

  const { data: resolvedComplaints, isLoading: isLoadingComplaints } =
    useCollection<Complaint>(resolvedComplaintsQuery);

  const onSubmit = async (data: FeedbackFormValues) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in to submit feedback.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Fetch the selected complaint to get all details
      const complaintDoc = await getDoc(
        doc(firestore, 'complaints', data.complaintId)
      );
      if (!complaintDoc.exists()) {
        throw new Error('Selected complaint not found.');
      }
      const complaintData = complaintDoc.data() as Complaint;

      const sentimentResult: AnalyzeCitizenFeedbackSentimentOutput =
        await analyzeCitizenFeedbackSentiment({ feedbackText: data.comments });

      const feedbackData = {
        complaintId: data.complaintId,
        complaintTitle: complaintData.title,
        citizenId: user.uid,
        citizenName: complaintData.name, // Get name from original complaint
        citizenEmail: complaintData.email, // Get email from original complaint
        rating: data.rating,
        comments: data.comments,
        date: serverTimestamp(),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
      };

      const feedbackCollection = collection(firestore, 'feedback');
      await addDoc(feedbackCollection, feedbackData);

      toast({
        title: 'Success!',
        description: 'Your feedback has been submitted successfully!',
      });
      form.reset();
      setRating(0);
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = (rate: number) => {
    setRating(rate);
    form.setValue('rating', rate, { shouldValidate: true });
  };

  return (
    <div>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">
          Submit Feedback on a Resolved Complaint
        </h2>
        <p className="text-muted-foreground">
          Let us know how we did. Your feedback helps us improve.
        </p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Feedback Form</CardTitle>
              <CardDescription>
                Select a resolved complaint and provide your feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="complaintId"
                render={({ field }) => (
                  <FormItem>
                    <Label>Resolved Complaint</Label>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingComplaints || isUserLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a complaint..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingComplaints || isUserLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading complaints...
                          </SelectItem>
                        ) : resolvedComplaints &&
                          resolvedComplaints.length > 0 ? (
                          resolvedComplaints.map(complaint => (
                            <SelectItem key={complaint.id} value={complaint.id}>
                              {complaint.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No resolved complaints found.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex justify-start space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <Label>Comments</Label>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide a detailed description of your experience."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
