/**
 * Live Firestore listener for agent user_state.
 *
 * The Python agent (Freja) writes session insights to:
 *   users/{userId}/user_state/{appName}
 * as: { state: { profiling, car_config, full_name, email, location, ... } }
 *
 * This service subscribes to that document in real-time using onSnapshot.
 */

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
