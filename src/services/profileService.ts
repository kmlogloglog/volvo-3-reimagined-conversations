/**
 * Firestore service layer for Vän profile documents.
 *
 * Document structure: users/{userId}/profile (single doc per user)
 *
 * Because Firestore stores each profile as a single nested document
 * under `users/{userId}`, we read/write at the document level.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VanProfile, VanProfileWithId } from '@/types/profile';

const USERS_COLLECTION = 'users';

/**
 * Casts raw Firestore DocumentData to VanProfile.
 *
 * In a production app you'd validate at runtime; here we trust
 * that uploads go through schemaValidator first.
 */
function castToProfile(data: DocumentData): VanProfile {
  return data as unknown as VanProfile;
}

/**
 * Fetch a single profile by user ID.
 * Returns `null` if the document doesn't exist.
 */
export async function fetchProfileById(
  userId: string,
): Promise<VanProfileWithId | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    userId,
    ...castToProfile(snapshot.data()),
  };
}

/**
 * Fetch all profiles in the `users` collection.
 *
 * For MVP we read all documents. If the collection grows large,
 * add pagination with `query`, `orderBy`, `limit`, `startAfter`.
 */
export async function fetchAllProfiles(): Promise<VanProfileWithId[]> {
  const colRef = collection(db, USERS_COLLECTION);
  const snapshot = await getDocs(colRef);

  const profiles: VanProfileWithId[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    // Only include documents that look like profiles (have profileData)
    if (data['profileData'] !== undefined) {
      profiles.push({
        userId: docSnap.id,
        ...castToProfile(data),
      });
    }
  }

  return profiles;
}

/**
 * Upload (create or overwrite) a profile document.
 *
 * The caller is responsible for validating the data with
 * `schemaValidator` before calling this function.
 */
export async function uploadProfile(
  userId: string,
  profile: VanProfile,
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  // setDoc with merge: false → full overwrite
  await setDoc(docRef, profile);
}
