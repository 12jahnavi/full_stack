import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, ArrowRight } from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <AppLogo />
        <Button asChild variant="outline">
          <Link href="/login">Admin Login</Link>
        </Button>
      </header>
      <main className="flex-grow">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Make Your Voice Heard in Your City
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CityZen Complaints is your direct line to city officials. Submit complaints, provide feedback, and help improve your community.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/complaints/new">
                      Submit a Complaint <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <Megaphone className="h-48 w-48 text-primary/10" strokeWidth={1} />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  A Better City, Together
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We provide the tools you need to effectively communicate with your local government and see real change.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">Effortless Submission</h3>
                <p className="text-sm text-muted-foreground">
                  Quickly file a new complaint with our easy-to-use form. No account needed.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">Admin Oversight</h3>
                <p className="text-sm text-muted-foreground">
                  A dedicated dashboard for city officials to view, manage, and update the status of all complaints.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <h3 className="text-lg font-bold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Our sentiment analysis tool helps officials understand the urgency and tone of citizen feedback.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CityZen Complaints. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
