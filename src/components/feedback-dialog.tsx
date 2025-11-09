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
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Complaint } from '@/lib/definitions';
import {
  analyzeCitizenFeedbackSentiment,
  type AnalyzeCitizenFeedbackSentimentOutput,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';

const FeedbackSchema = z.object({
  resolvedBy: z.string().min(1, 'This field is required.'),
  rating: z.number().min(1, 'Please select a rating.'),
  comments: z
    .string()
    .min(10, 'Comments must be at least 10 characters long.'),
  suggestions: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof FeedbackSchema>;

export function FeedbackDialog({ complaint }: { complaint: Complaint }) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackSchema),
    defaultValues: { 
      comments: '', 
      suggestions: '',
      resolvedBy: 'Admin'
    },
  });

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
        complaintId: complaint.id,
        complaintTitle: complaint.title, // Store the title with the feedback
        citizenId: user.uid,
        name: complaint.name, // Carry over citizen's name
        email: complaint.email, // Carry over citizen's email
        rating: data.rating,
        comments: data.comments,
        suggestions: data.suggestions,
        resolvedBy: data.resolvedBy,
        date: serverTimestamp(),
        sentiment: sentimentResult.sentiment,
        sentimentConfidence: sentimentResult.confidence,
      });

      toast({
        title: 'Thank you!',
        description: 'Your feedback has been submitted.',
      });
      setIsOpen(false);
      form.reset();
      setRating(0);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Submit Feedback</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Feedback for: {complaint.title}</DialogTitle>
            <DialogDescription>
              Let us know how we did with resolving your complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="resolvedBy">Complaint Resolved By</Label>
              <Input id="resolvedBy" {...form.register('resolvedBy')} readOnly />
               {form.formState.errors.resolvedBy && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.resolvedBy.message}
                </p>
              )}
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
              {form.formState.errors.rating && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rating.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Your comments..."
                {...form.register('comments')}
              />
              {form.formState.errors.comments && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.comments.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestions">Suggestions</Label>
              <Textarea
                id="suggestions"
                placeholder="Any suggestions for improvement?"
                {...form.register('suggestions')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
