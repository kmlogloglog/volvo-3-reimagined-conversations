import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import type { User, Unsubscribe } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

/**
 * Signs in anonymously — satisfies Firestore auth rules without a login UI.
 * Safe to call multiple times; Firebase is a no-op if already signed in.
 */
export async function signInAnon(): Promise<void> {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
}

/**
 * Guarantees a Firebase auth token exists before any Firestore read.
 * Resolves immediately if already signed in (cached from a prior session).
 * Otherwise starts anonymous sign-in and waits for onAuthStateChanged to
 * confirm the token — preventing the "Missing or insufficient permissions"
 * race condition where Firestore fires before the auth handshake completes.
 */
export function ensureAuth(): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser) { resolve(); return; }
    void signInAnonymously(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(); }
    });
  });
}

/**
 * Opens a Google sign-in popup.
 * Throws on failure (caller handles error).
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs out the current user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase auth state changes.
 * Returns an unsubscribe function for cleanup.
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void,
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
