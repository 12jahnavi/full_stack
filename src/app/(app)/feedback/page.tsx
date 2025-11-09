
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
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  analyzeCitizenFeedbackSentiment,
  type AnalyzeCitizenFeedbackSentimentOutput,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';
import { useRouter } from 'next/navigation';

const FeedbackSchema = z.object({
  name: z.string().min(2, { message: 'Please enter your name.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  complaintId: z.string().min(5, 'Please enter a valid complaint ID.'),
  rating: z.number().min(1, 'Please select a rating.'),
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters long.'),
  suggestions: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

export default function FeedbackPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: {
      name: '',
      email: '',
      complaintId: '',
      comments: '',
      suggestions: '',
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Connection not ready. Please try again.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sentimentResult: AnalyzeCitizenFeedbackSentimentOutput =
        await analyzeCitizenFeedbackSentiment({ feedbackText: data.comments });

      const feedbackCollection = collection(firestore, 'feedback');
      await addDoc(feedbackCollection, {
        complaintId: data.complaintId,
        citizenId: user.uid, // Still useful to link anonymous user session
        name: data.name,
        email: data.email,
        rating: data.rating,
        comments: data.comments,
        suggestions: data.suggestions,
        date: serverTimestamp(),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
      });

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted successfully.',
      });
      form.reset();
      setRating(0);
      router.push('/');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your feedback. Please try again.',
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
    <div className="max-w-2xl mx-auto">
       <div className="space-y-2 mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Submit Feedback</h2>
        <p className="text-muted-foreground">
          Let us know how we did with resolving your complaint.
        </p>
      </div>
      <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="pt-6 grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
             <FormField
                  control={form.control}
                  name="complaintId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the ID of the resolved complaint" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            
            <div className="space-y-2">
              <FormLabel>Overall Rating</FormLabel>
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
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
               <FormField
                  control={form.control}
                  name="rating"
                  render={() => (
                     <FormItem>
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
                    <FormLabel>Comments on Resolution</FormLabel>
                    <FormControl>
                        <Textarea
                            id="comments"
                            placeholder="Please describe your experience with the resolution process."
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="suggestions"
              render={({ field }) => (
                 <FormItem>
                    <FormLabel>Suggestions for Improvement (Optional)</FormLabel>
                    <FormControl>
                        <Textarea
                            id="suggestions"
                            placeholder="How could we improve our process in the future?"
                            {...field}
                        />
                    </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardHeader className="border-t mt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </CardHeader>
        </form>
      </Form>
      </Card>
    </div>
  );
}
