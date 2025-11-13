'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import type { Complaint, Feedback } from '@/lib/definitions';
import {
  analyzeCitizenFeedbackSentiment,
  type AnalyzeCitizenFeedbackSentimentOutput,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormLabel,
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/firebase/firestore/use-collection';

const FeedbackSchema = z.object({
  complaintId: z.string().min(1, 'Please select a complaint.'),
  name: z.string().min(4, 'Name must be more than 3 letters.').regex(/^[a-zA-Z\s]+$/, 'Name cannot contain numbers or special characters.'),
  email: z.string().email('Please enter a valid email.'),
  rating: z.number().min(1, 'Please select a rating.'),
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters long.'),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

export default function StandaloneFeedbackPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: { 
      complaintId: '',
      name: '',
      email: '',
      comments: '', 
      rating: 0,
    },
  });

  const resolvedComplaintsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'complaints'), where('status', '==', 'Resolved'));
  }, [firestore]);

  const { data: resolvedComplaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(resolvedComplaintsQuery);

  const onSubmit = async (data: FeedbackFormValues) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in to submit feedback.',
      });
      return;
    }

    const selectedComplaint = resolvedComplaints?.find(c => c.id === data.complaintId);
    if (!selectedComplaint) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected complaint not found.' });
        return;
    }

    setIsSubmitting(true);
    try {
      const sentimentResult: AnalyzeCitizenFeedbackSentimentOutput =
        await analyzeCitizenFeedbackSentiment({ feedbackText: data.comments });

      const feedbackData: Omit<Feedback, 'id'> = {
        complaintId: data.complaintId,
        complaintTitle: selectedComplaint.title,
        citizenId: user.uid,
        name: data.name,
        email: data.email,
        rating: data.rating,
        comments: data.comments,
        date: serverTimestamp(),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
      };

      const feedbackCollection = collection(firestore, 'feedback');
      addDoc(feedbackCollection, feedbackData)
        .then(() => {
          toast({
            title: 'Thank you!',
            description: 'Your feedback has been submitted.',
          });
          form.reset();
          setRating(0);
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: feedbackCollection.path,
            operation: 'create',
            requestResourceData: feedbackData,
          });
          errorEmitter.emit('permission-error', permissionError);
          toast({
            variant: 'destructive',
            title: 'Submission Failed',
            description: 'Could not submit your feedback due to a permission issue.',
          });
        }).finally(() => {
            setIsSubmitting(false);
        });

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  const handleRating = (rate: number) => {
    setRating(rate);
    form.setValue('rating', rate, { shouldValidate: true });
  };

  return (
    <>
    <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Submit Feedback</h2>
        <p className="text-muted-foreground">
            Let us know how we did resolving your complaint.
        </p>
    </div>
    <Card>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-6 pt-6">
                <FormField
                    control={form.control}
                    name="complaintId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select a Resolved Complaint</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingComplaints}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingComplaints ? "Loading complaints..." : "Select the complaint you want to give feedback for"} />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {(resolvedComplaints || []).map(complaint => (
                                    <SelectItem key={complaint.id} value={complaint.id}>
                                    {complaint.title} ({complaint.id.substring(0, 5)}...)
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Email</FormLabel>
                            <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            
                <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex justify-start space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleRating(star)}
                            className="focus:outline-none"
                        >
                            <Star
                            className={`h-8 w-8 cursor-pointer ${
                                star <= rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
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
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                            <Textarea
                                id="comments"
                                placeholder="Your comments..."
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
    </>
  );
}
