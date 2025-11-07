'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { analyzeCitizenFeedbackSentiment as analyzeSentimentFlow } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import type { AnalyzeCitizenFeedbackSentimentOutput } from '@/ai/flows/analyze-citizen-feedback-sentiment';

const FormSchema = z.object({
  id: z.string(),
  title: z.string({
    required_error: 'Please enter a title for the complaint.',
  }).min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.enum(['Roads', 'Utilities', 'Parks', 'Public Transport', 'Other'], {
    required_error: 'Please select a category.',
  }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  location: z.string().min(5, { message: 'Location must be at least 5 characters.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  priority: z.enum(['Low', 'Medium', 'High'], {
    required_error: 'Please select a priority level.',
  }),
  userId: z.string(),
  date: z.string(),
  status: z.string(),
});

const CreateComplaint = FormSchema.omit({ id: true, userId: true, date: true, status: true });

export type State = {
  errors?: {
    title?: string[];
    category?: string[];
    description?: string[];
    location?: string[];
    phone?: string[];
    email?: string[];
    priority?: string[];
  };
  message?: string | null;
};

// This is a mock function. In a real app, you would validate credentials.
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const role = formData.get('role');
  if (role === 'admin') {
    redirect('/admin');
  }
  redirect('/dashboard');
}


export async function createComplaint(prevState: State, formData: FormData) {
  const validatedFields = CreateComplaint.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    location: formData.get('location'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    priority: formData.get('priority'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Complaint.',
    };
  }

  // In a real app, you would insert the data into your database.
  console.log('Creating new complaint:', validatedFields.data);

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect('/dashboard');
}

export async function deleteComplaint(id: string) {
  // In a real app, you would delete from your database.
  console.log('Deleting complaint:', id);
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function updateComplaintStatus(id: string, status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected') {
  // In a real app, you would update the status in your database.
  console.log(`Updating complaint ${id} to status: ${status}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  revalidatePath(`/complaints/${id}`);
}

const SentimentSchema = z.object({
  feedbackText: z.string().min(10, { message: 'Feedback must be at least 10 characters long.' }),
});

export type SentimentState = {
  errors?: {
    feedbackText?: string[];
  };
  message?: string | null;
  analysis?: AnalyzeCitizenFeedbackSentimentOutput | null;
};

export async function analyzeCitizenFeedbackSentiment(
  prevState: SentimentState,
  formData: FormData,
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
