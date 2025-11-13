'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ArrowRight } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [email, setEmail] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);
    if (!auth || !firestore) {
      setErrorMessage('Firebase not initialized. Please try again later.');
      return;
    }
    const formData = new FormData(event.currentTarget);
    const password = formData.get('password') as string;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const adminDocRef = doc(firestore, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);

      if (adminDoc.exists()) {
        router.push('/admin');
      } else {
        await auth.signOut();
        setErrorMessage('This login is for administrators only.');
      }
    } catch (error: any) {
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential'
      ) {
        setErrorMessage('Invalid credentials.');
      } else {
        setErrorMessage('Something went wrong. Please try again.');
        console.error(error);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.' });
        return;
    }
    if (!email) {
        toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your email address to reset your password.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${email} with password reset instructions.` });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/user-not-found') {
            toast({ variant: 'destructive', title: 'User Not Found', description: 'No admin account found with this email.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send password reset email.' });
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-[400px]">
      <AppLogo />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" type="button" onClick={handlePasswordReset} className="h-auto p-0 text-xs">
                    Forgot Password?
                </Button>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            {errorMessage && (
              <div className="flex items-center justify-center">
                <p className="text-sm font-medium text-destructive">
                  {errorMessage}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <LoginButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
      <ArrowRight className="ml-auto h-5 w-5" />
    </Button>
  );
}
