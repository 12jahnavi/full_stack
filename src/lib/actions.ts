'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/firebase/admin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

import { analyzeCitizenFeedbackSentiment as analyzeSentimentFlow } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import type { AnalyzeCitizenFeedbackSentimentOutput } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import { Complaint, ComplaintCategories, ComplaintPriorities, ComplaintStatuses } from './definitions';

// This is a client-side auth instance, used ONLY for signInWithEmailAndPassword
// DO NOT use it for any other purpose in this file.
const { auth: clientAuth } = initializeFirebase();

// Admin SDK instances for all server-side operations
const adminApp = initializeAdminApp();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

const SignUpSchema = z
  .object({
    firstName: z.string().min(1, { message: 'First name is required.' }),
    lastName: z.string().min(1, { message: 'Last name is required.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export type SignUpState = {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string | null;
};

export async function signup(prevState: SignUpState, formData: FormData) {
  const validatedFields = SignUpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Failed to sign up.',
    };
  }

  const { email, password, firstName, lastName } = validatedFields.data;

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await adminDb.collection('citizens').doc(userRecord.uid).set({
      id: userRecord.uid,
      firstName,
      lastName,
      email,
      phone: '',
      address: '',
    });
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return { message: 'This email is already in use.' };
    }
    return { message: 'Something went wrong. Please try again.' };
  }

  // To complete the login flow, we also need to sign the user in on the client
  // Since we can't do that from a server action, we redirect to login
  // where the user can immediately log in with their new credentials.
  redirect('/login');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // We use the client SDK here just to sign the user in to get an ID token.
    // The session is managed by Firebase automatically on the client.
    await signInWithEmailAndPassword(clientAuth, email, password);

    // After client sign-in, we can verify the user on the server
    const user = await adminAuth.getUserByEmail(email);

    if (formData.has('role') && formData.get('role') === 'admin') {
      const adminDoc = await adminDb.collection('admins').doc(user.uid).get();
      if (adminDoc.exists) {
        redirect('/admin');
      } else {
         return 'You are not an administrator.';
      }
    }

    redirect('/dashboard');
  } catch (error: any) {
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential'
    ) {
      return 'Invalid credentials.';
    }
    console.error(error);
    return 'Something went wrong.';
  }
}

const FormSchema = z.object({
  id: z.string(),
  title: z
    .string({
      required_error: 'Please enter a title for the complaint.',
    })
    .min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.enum(ComplaintCategories, {
    required_error: 'Please select a category.',
  }),
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
  priority: z.enum(ComplaintPriorities, {
    required_error: 'Please select a priority level.',
  }),
  citizenId: z.string(), // Added citizenId
});

const CreateComplaint = FormSchema.omit({
  id: true,
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

export async function createComplaint(prevState: State, formData: FormData) {
  const validatedFields = CreateComplaint.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    description: formData.get('description'),
    location: formData.get('location'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    priority: formData.get('priority'),
    citizenId: formData.get('citizenId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Complaint.',
    };
  }
  
  const { citizenId, ...complaintData } = validatedFields.data;

  if (!citizenId) {
     return { message: 'You must be logged in to create a complaint.' };
  }

  try {
    const newComplaint = {
      ...complaintData,
      date: FieldValue.serverTimestamp(),
      status: 'Pending',
    };
    const complaintsCollection = adminDb.collection(`citizens/${citizenId}/complaints`);
    await complaintsCollection.add(newComplaint);
  } catch (e) {
    console.error(e);
    return {
      message: 'Database Error: Failed to Create Complaint.',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect('/dashboard');
}

export async function deleteComplaint(citizenId: string, complaintId: string) {
  if (!citizenId || !complaintId) {
    throw new Error('Citizen ID and Complaint ID are required.');
  }
  const complaintDoc = adminDb.doc(`citizens/${citizenId}/complaints/${complaintId}`);
  await complaintDoc.delete();
  
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function updateComplaintStatus(
  citizenId: string,
  complaintId: string,
  status: Complaint['status']
) {
  if (!ComplaintStatuses.includes(status)) {
    throw new Error('Invalid status value.');
  }
  const complaintDoc = adminDb.doc(`citizens/${citizenId}/complaints/${complaintId}`);
  await complaintDoc.update({ status });
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  revalidatePath(`/complaints/${complaintId}`);
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
