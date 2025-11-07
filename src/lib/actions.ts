'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

import { analyzeCitizenFeedbackSentiment as analyzeSentimentFlow } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import type { AnalyzeCitizenFeedbackSentimentOutput } from '@/ai/flows/analyze-citizen-feedback-sentiment';
import type { Complaint } from './definitions';

const { auth, firestore } = initializeFirebase();

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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await setDoc(doc(firestore, 'citizens', user.uid), {
      id: user.uid,
      firstName,
      lastName,
      email,
      phone: '',
      address: '',
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { message: 'This email is already in use.' };
    }
    return { message: 'Something went wrong. Please try again.' };
  }

  redirect('/dashboard');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    await signInWithEmailAndPassword(auth, email, password);
    
    const user = auth.currentUser;
    // You might want to check for admin role here from a custom claim
    // or a document in Firestore.
    // For now, we assume any login can be an admin based on the query param.
    if (formData.has('role') && formData.get('role') === 'admin') {
      redirect('/admin');
    }

    redirect('/dashboard');
  } catch (error: any) {
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      return 'Invalid credentials.';
    }
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
  const user = auth.currentUser;
  if (!user) {
    return { message: 'You must be logged in to create a complaint.' };
  }

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

  try {
    const newComplaint = {
      ...validatedFields.data,
      citizenId: user.uid,
      date: serverTimestamp(),
      status: 'Pending',
    };
    const complaintsCollection = collection(firestore, `citizens/${user.uid}/complaints`);
    await addDoc(complaintsCollection, newComplaint);
  } catch (e) {
    return {
      message: 'Database Error: Failed to Create Complaint.',
    };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect('/dashboard');
}

export async function deleteComplaint(complaintId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required.');
  }
  const complaintDoc = doc(firestore, `citizens/${user.uid}/complaints`, complaintId);
  await deleteDoc(complaintDoc);
  
  revalidatePath('/dashboard');
  revalidatePath('/admin');
}

export async function updateComplaintStatus(
  citizenId: string,
  complaintId: string,
  status: Complaint['status']
) {
  const complaintDoc = doc(firestore, `citizens/${citizenId}/complaints`, complaintId);
  await updateDoc(complaintDoc, { status });
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
