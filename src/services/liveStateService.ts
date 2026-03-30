/**
 * Live Firestore listener for agent user_state.
 *
 * The Python agent (Freja) writes session insights to:
 *   users/{userId}/user_state/{appName}
 * as: { state: { profiling, car_config, full_name, email, location, ... } }
 *
 * This service subscribes to that document in real-time using onSnapshot.
 */

import { doc, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Known agent user IDs used as fallback when collectionGroup query fails
const KNOWN_USER_IDS = ['manolo', 'demo-user'];

export interface AgentUserState {
  profiling?: Record<string, string> | string[];
  car_config?: {
    model?: string;
    exterior?: string;
    interior?: string;
    wheels?: string;
  };
  full_name?: string;
  email?: string;
  location?: string | { city?: string; nation?: string; street?: string; lat?: number | null; lng?: number | null };
  current_car?: string;
  height_cm?: string | number;
  preferences?: string;
  test_drive_appointment?: Record<string, unknown>;
  test_drive_preferences?: Record<string, unknown>;
}

/**
 * Subscribes to real-time updates on a user's agent state document.
 *
 * @param userId   - Firestore user document ID (e.g. "manolo")
 * @param appName  - ADK app name (e.g. "volvo_vaen")
 * @param callback - Called with the latest state on every change
 * @returns Unsubscribe function — call on component unmount
 */
export function subscribeToUserState(
  userId: string,
  appName: string,
  callback: (state: AgentUserState | null) => void,
): () => void {
  const docRef = doc(db, 'users', userId, 'user_state', appName);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.data() as { state?: AgentUserState };
      callback(data?.state ?? null);
    },
    (error) => {
      console.error('[liveStateService] onSnapshot error:', error);
      callback(null);
    },
  );

  return unsubscribe;
}

/**
 * Callback shape for collection-level listener.
 * Maps userId → latest AgentUserState.
 */
export type AllUserStatesCallback = (
  states: Map<string, AgentUserState>,
) => void;

/**
 * Subscribes to real-time updates across ALL user_state documents.
 *
 * Uses `collectionGroup('user_state')` so any new user who starts a
 * conversation is detected immediately (no page refresh required).
 *
 * Falls back to polling known user IDs if the collectionGroup Firestore
 * rule is missing.
 *
 * @param appName  - ADK app name filter (e.g. "volvo_vaen")
 * @param callback - Called with a Map<userId, state> on every change
 * @returns Unsubscribe function
 */
export function subscribeToAllUserStates(
  appName: string,
  callback: AllUserStatesCallback,
): () => void {
  let cancelled = false;

  // Try collectionGroup listener first
  const cgRef = collectionGroup(db, 'user_state');

  const unsubscribe = onSnapshot(
    cgRef,
    (snapshot) => {
      if (cancelled) return;
      const states = new Map<string, AgentUserState>();
      for (const docSnap of snapshot.docs) {
        // Only include docs matching our appName
        if (docSnap.id !== appName) continue;
        const userId = docSnap.ref.parent.parent?.id;
        if (!userId) continue;
        const data = docSnap.data() as { state?: AgentUserState };
        if (data?.state) {
          states.set(userId, data.state);
        }
      }
      callback(states);
    },
    (error) => {
      console.warn(
        '[liveStateService] collectionGroup("user_state") listener failed — ' +
        'falling back to polling known user IDs. Add the Firestore rule: ' +
        'match /{path=**}/user_state/{docId} { allow read: if request.auth != null; }',
        error,
      );

      // Fallback: poll known user IDs with individual doc listeners
      if (cancelled) return;
      startFallbackListeners(appName, callback);
    },
  );

  let fallbackUnsubs: (() => void)[] = [];

  function startFallbackListeners(app: string, cb: AllUserStatesCallback) {
    const states = new Map<string, AgentUserState>();
    for (const uid of KNOWN_USER_IDS) {
      const docRef = doc(db, 'users', uid, 'user_state', app);
      const unsub = onSnapshot(docRef, (snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as { state?: AgentUserState };
          if (data?.state) states.set(uid, data.state);
        }
        cb(new Map(states));
      });
      fallbackUnsubs.push(unsub);
    }
  }

  return () => {
    cancelled = true;
    unsubscribe();
    for (const unsub of fallbackUnsubs) unsub();
    fallbackUnsubs = [];
  };
}
