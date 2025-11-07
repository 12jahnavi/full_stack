'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { analyzeCitizenFeedbackSentiment as analyzeSentimentFlow } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import type { AnalyzeCitizenFeedbackSentimentOutput } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import { complaints, users } from './data';
import type { Complaint } from './definitions';

const FormSchema = z.object({
  id: z.string(),
  title: z
    .string({
      required_error: 'Please enter a title for the complaint.',
    })
    .min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.enum(
    ['Roads', 'Utilities', 'Parks', 'Public Transport', 'Other'],
    {
      required_error: 'Please select a category.',
    }
  ),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' }),
  location: z
    .string()
    .min(5, { message: 'Location must be at least 5 characters.' }),
  phone: z
    .string()
    .regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  priority: z.enum(['Low', 'Medium', 'High'], {
    required_error: 'Please select a priority level.',
  }),
  userId: z.string(),
  date: z.string(),
  status: z.string(),
});

const CreateComplaint = FormSchema.omit({
  id: true,
  userId: true,
  date: true,
  status: true,
});

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
  formData: FormData
) {
  const email = formData.get('email') as string;
  const user = users.find(u => u.email === email);
  const isAdminLogin = (formData.get('role') ?? 'citizen') === 'admin'
  
  if (user?.role === 'admin' && isAdminLogin) {
    redirect('/admin');
  }
  
  if (user?.role === 'citizen' && !isAdminLogin) {
     redirect('/dashboard');
  }

  return 'Invalid credentials.';
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
  
  const { title, category, description, location, phone, email, priority } = validatedFields.data;

  const newComplaint: Complaint = {
    id: `cmp-${String(complaints.length + 1).padStart(3, '0')}`,
    title,
    category,
    description,
    location,
    phone,
    email,
    priority,
    userId: '1', // Mock user id
    date: new Date().toISOString(),
    status: 'Pending',
  };

  complaints.unshift(newComplaint);

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect('/dashboard');
}

export async function deleteComplaint(id: string) {
  const index = complaints.findIndex(c => c.id === id);
  if (index > -1) {
    complaints.splice(index, 1);
  }
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function updateComplaintStatus(
  id: string,
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected'
) {
  const complaint = complaints.find(c => c.id === id);
  if (complaint) {
    complaint.status = status;
  }
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  revalidatePath(`/complaints/${id}`);
}

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