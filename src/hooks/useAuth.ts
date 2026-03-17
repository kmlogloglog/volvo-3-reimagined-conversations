import { useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { useAuthStore } from '@/store/authStore';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
} from '@/services/authService';
import type { AuthUser, AuthState } from '@/types/auth';

/**
 * Maps a Firebase User to our minimal AuthUser representation.
 */
function mapFirebaseUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
  };
}

/**
 * Central auth hook — wires the Firebase onAuthStateChanged listener
 * to the Zustand auth store so that every state transition flows
 * through a single source of truth.
 *
 * Returns the current user, auth state, and sign-in / sign-out actions.
 */
export function useAuth(): {
  user: AuthUser | null;
  authState: AuthState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const user = useAuthStore((s) => s.user);
  const authState = useAuthStore((s) => s.authState);
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  // Subscribe to Firebase auth changes on mount.
  // All state transitions flow through this listener — NOT from
  // signIn / signOut return values — ensuring a single source of truth.
  // Skip clearing when a guest user is active (uid === 'guest').
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        const current = useAuthStore.getState().user;
        if (current?.uid !== 'guest') {
          clearUser();
        }
      }
    });

    return unsubscribe;
  }, [setUser, clearUser]);

  const signIn = useCallback(async (): Promise<void> => {
    // We intentionally do NOT update the store here.
    // The onAuthStateChanged listener handles all state transitions.
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const current = useAuthStore.getState().user;
    if (current?.uid === 'guest') {
      clearUser();
      return;
    }
    await signOutUser();
  }, [clearUser]);

  return { user, authState, signIn, signOut };
}
