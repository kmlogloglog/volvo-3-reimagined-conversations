/**
 * Minimal user representation extracted from Firebase User.
 * Only includes the fields the dashboard actually uses.
 */
export interface AuthUser {
  readonly uid: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly photoURL: string | null;
}

/**
 * Authentication lifecycle states.
 * - 'loading': initial state while onAuthStateChanged has not yet fired
 * - 'authenticated': user is signed in
 * - 'unauthenticated': no user / signed out
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
