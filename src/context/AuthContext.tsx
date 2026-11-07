import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import * as authService from '@/services/auth';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** True until the saved session has been restored from storage on app start. */
  isLoading: boolean;
  signUp: typeof authService.signUp;
  verifySignupCode: typeof authService.verifySignupCode;
  resendSignupCode: typeof authService.resendSignupCode;
  signIn: typeof authService.signIn;
  signOut: typeof authService.signOut;
  sendPasswordResetCode: typeof authService.sendPasswordResetCode;
  resetPasswordWithCode: typeof authService.resetPasswordWithCode;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifying a recovery code signs the user in before the new password is saved. Holding
  // session updates until the reset finishes stops the router leaving the reset screen early.
  const isResettingPassword = useRef(false);
  const latestSession = useRef<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = authService.onSessionChange((nextSession) => {
      latestSession.current = nextSession;
      if (!isResettingPassword.current) setSession(nextSession);
      // Drop cached data from the previous account so the next user never sees it.
      if (!nextSession) queryClient.clear();
    });

    authService
      .getSession()
      .then((restored) => {
        if (isMounted) setSession(restored);
      })
      // A failed restore (e.g. a corrupt token) just means the user has to log in again.
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [queryClient]);

  const resetPasswordWithCode = useCallback<typeof authService.resetPasswordWithCode>(
    async (params) => {
      isResettingPassword.current = true;
      try {
        await authService.resetPasswordWithCode(params);
      } finally {
        isResettingPassword.current = false;
        setSession(latestSession.current);
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signUp: authService.signUp,
      verifySignupCode: authService.verifySignupCode,
      resendSignupCode: authService.resendSignupCode,
      signIn: authService.signIn,
      signOut: authService.signOut,
      sendPasswordResetCode: authService.sendPasswordResetCode,
      resetPasswordWithCode,
    }),
    [session, isLoading, resetPasswordWithCode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
