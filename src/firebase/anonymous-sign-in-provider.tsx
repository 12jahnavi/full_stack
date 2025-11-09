
'use client';

import { useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

/**
 * A client component that initiates anonymous sign-in when the app loads.
 * It uses the useFirebase hook to get the auth instance and ensures sign-in
 * is only attempted once on the client-side.
 */
export function AnonymousSignInProvider() {
  const { auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    // Only attempt to sign in if:
    // 1. Auth is initialized.
    // 2. We are not still in the initial loading state.
    // 3. There is no user (neither anonymous nor signed-in).
    if (auth && !isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  // This component does not render anything.
  return null;
}
