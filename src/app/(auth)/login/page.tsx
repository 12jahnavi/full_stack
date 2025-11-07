'use client';

import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, KeyRound, User } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <AppLogo />
      <Tabs defaultValue="citizen" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="citizen">Citizen</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="citizen">
          <Card>
            <CardHeader>
              <CardTitle>Citizen Login</CardTitle>
              <CardDescription>
                Access your dashboard to manage complaints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="citizen-email">Email</Label>
                  <Input
                    id="citizen-email"
                    name="email"
                    type="email"
                    placeholder="citizen@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizen-password">Password</Label>
                  <Input
                    id="citizen-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <input type="hidden" name="role" value="citizen" />
                {errorMessage && (
                  <div className="flex items-center justify-center">
                    <p className="text-sm font-medium text-destructive">
                      {errorMessage}
                    </p>
                  </div>
                )}
                <LoginButton icon={<User />} text="Login as Citizen" />
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>
                Access the admin panel to manage all complaints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={dispatch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <input type="hidden" name="role" value="admin" />
                {errorMessage && (
                  <div className="flex items-center justify-center">
                    <p className="text-sm font-medium text-destructive">
                      {errorMessage}
                    </p>
                  </div>
                )}
                <LoginButton icon={<KeyRound />} text="Login as Admin" />
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoginButton({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? (
        'Logging in...'
      ) : (
        <>
          {icon}
          <span className="ml-2">{text}</span>
          <ArrowRight className="ml-auto h-5 w-5" />
        </>
      )}
    </Button>
  );
}
