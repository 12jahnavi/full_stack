'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Star } from 'lucide-react';
import {
  analyzeCitizenFeedbackSentiment,
  type AnalyzeCitizenFeedbackSentimentOutput,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';
import { useRouter } from 'next/navigation';


const FeedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').regex(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces.' }),
  email: z.string().email('Please enter a valid email.'),
  complaintTitle: z.string().min(5, 'Please enter the title of your complaint.'),
  rating: z.number().min(1, 'Please select a rating of at least 1 star.'),
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
      complaintTitle: '',
      comments: '',
      suggestions: '',
      rating: 0,
    },
  });
  
  const handleRating = (rate: number) => {
    setRating(rate);
    form.setValue('rating', rate, { shouldValidate: true });
  };

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
      // 1. Analyze sentiment
      const sentimentResult: AnalyzeCitizenFeedbackSentimentOutput =
        await analyzeCitizenFeedbackSentiment({ feedbackText: data.comments });

      // 2. Save feedback to Firestore
      const feedbackCollection = collection(firestore, 'feedback');
      await addDoc(feedbackCollection, {
        // complaintId is unknown here, but we save title and email
        complaintTitle: data.complaintTitle,
        citizenId: user.uid,
        name: data.name,
        email: data.email,
        rating: data.rating,
        comments: data.comments,
        suggestions: data.suggestions,
        resolvedBy: "Admin", // Assuming admin resolved it
        date: serverTimestamp(),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
        // We add a dummy complaintId, as the schema expects one.
        // In a real scenario, you'd want a better way to link this.
        complaintId: `unlinked-${Date.now()}`
      });

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted.',
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

  return (
    <div className="max-w-2xl mx-auto">
       <div className="space-y-2 mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Submit Feedback</h2>
        <p className="text-muted-foreground">
          Let us know how we did resolving your complaint.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
           <Card>
            <CardContent className="grid gap-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., John Doe" {...field} />
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
                    name="complaintTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Title of the Resolved Complaint</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Large pothole on Main St" {...field} />
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
                        <FormLabel>Comments on Resolution</FormLabel>
                        <FormControl>
                        <Textarea placeholder="How was the problem resolved?" {...field} />
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
                        <Textarea placeholder="How could we do better next time?" {...field} />
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
           </Card>
        </form>
      </Form>
    </div>
  );
}
