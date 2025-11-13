import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { UserNav } from '@/components/user-nav';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'CityZen Complaints',
  description: 'A modern platform for citizen feedback and complaint management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <FirebaseClientProvider>
            <div className="ml-auto flex items-center space-x-4 absolute top-4 right-4">
                <UserNav />
            </div>
            {children}
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
