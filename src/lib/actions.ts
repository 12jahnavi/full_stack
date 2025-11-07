'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  AnalyzeCitizenFeedbackSentimentOutput,
  analyzeCitizenFeedbackSentiment as analyzeSentimentFlow,
} from '@/ai/flows/analyze-citizen-feedback-sentiment';
import {
  ComplaintCategories,
  ComplaintPriorities,
} from './definitions';

const SentimentSchema = z.object({
  feedbackText: z
    .string()
    .min(10, { message: 'Feedback must be at least 10 characters long.' }),
});

export type SentimentState = {
  errors?: {
    feedbackText?: string[];
  };
  message?: string | null;
  analysis?: AnalyzeCitizenFeedbackSentimentOutput | null;
};

export async function analyzeCitizenFeedbackSentiment(
  prevState: SentimentState | undefined,
  formData: FormData
): Promise<SentimentState> {
  const validatedFields = SentimentSchema.safeParse({
    feedbackText: formData.get('feedbackText'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input.',
    };
  }

  const { feedbackText } = validatedFields.data;

  try {
    const analysis = await analyzeSentimentFlow({ feedbackText });
    return {
      message: 'Analysis complete.',
      analysis,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Failed to analyze sentiment.',
      analysis: null,
    };
  }
}

// Actions related to complaints are now handled on the client-side
// in lib/data.ts to interact with Firestore directly.
// This file is now only for server-side AI actions.
