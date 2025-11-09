import MainNav from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Search } from '@/components/search';
import { FirebaseClientProvider } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

function AnonymousSignIn() {
  const { auth } = initializeFirebase();
  initiateAnonymousSignIn(auth);
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AnonymousSignIn />
      <div className="flex flex-col min-h-screen">
        <div className="border-b">
          <div className="flex h-16 items-center px-4 container mx-auto">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <main className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
          {children}
        </main>
      </div>
    </FirebaseClientProvider>
  );
}
