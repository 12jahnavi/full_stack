import { FirebaseClientProvider } from '@/firebase';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <main className="flex items-center justify-center min-h-screen">
        {children}
      </main>
    </FirebaseClientProvider>
  );
}
