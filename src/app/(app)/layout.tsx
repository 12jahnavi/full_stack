
import MainNav from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { AnonymousSignInProvider } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <>
        <AnonymousSignInProvider />
        <div className="flex flex-col min-h-screen">
          <div className="border-b">
            <div className="flex h-16 items-center px-4 container mx-auto">
              <MainNav />
              <div className="ml-auto flex items-center space-x-4">
                <UserNav />
              </div>
            </div>
          </div>
          <main className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
            {children}
          </main>
        </div>
      </>
  );
}
