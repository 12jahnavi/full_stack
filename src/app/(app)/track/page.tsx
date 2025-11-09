'use client';

import { useState } from 'react';
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

export default function TrackComplaintPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    
    // Pass the email as a query parameter to the results page
    const query = new URLSearchParams({ email });
    router.push(`/track/results?${query.toString()}`);
  };

  return (
    <div className="flex justify-center items-start pt-12">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Track Your Complaints</CardTitle>
            <CardDescription>
              Enter your email address to find your submitted complaints and
              their status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Find My Complaints
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
