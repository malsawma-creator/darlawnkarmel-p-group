import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gifted-hope-zv9wh",
  appId: "1:254184440552:web:d11947ea0810cf4f233f5d",
  apiKey: "AIzaSyCAEvt-F7T4oFdIHt4kS6IPwyAVyEIQI1w",
  authDomain: "gifted-hope-zv9wh.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-karmelpgroupdarl-1f9e44b4-5814-4f1d-a290-7aa0213df023",
  storageBucket: "gifted-hope-zv9wh.firebasestorage.app",
  messagingSenderId: "254184440552",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const COLLECTIONS = {
  MEMBERS: 'members',
  NOTICES: 'notices',
  COMPETITIONS: 'competitions',
  SUBMISSIONS: 'submissions',
  MEETINGS: 'meetings',
  RECORDS: 'records',
  BOOK_REVIEWS: 'book_reviews',
  SUGGESTIONS: 'suggestions',
  PROMISE_BUDGETS: 'promise_budgets',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  EX_OFFICIO: 'ex_officio',
  HLA_BAWM: 'hla_bawm',
  APP_NOTIFICATIONS: 'app_notifications',
};

// Local storage keys to firestore mapping
export const STORAGE_TO_FIRESTORE: Record<string, string> = {
  'kpg_members_v4': COLLECTIONS.MEMBERS,
  'kpg_notices_v4': COLLECTIONS.NOTICES,
  'kpg_competitions_v4': COLLECTIONS.COMPETITIONS,
  'kpg_submissions_v4': COLLECTIONS.SUBMISSIONS,
  'kpg_meetings_v4': COLLECTIONS.MEETINGS,
  'kpg_records_v4': COLLECTIONS.RECORDS,
  'kpg_book_reviews_v4': COLLECTIONS.BOOK_REVIEWS,
  'kpg_suggestions_v4': COLLECTIONS.SUGGESTIONS,
  'kpg_promise_budgets_v4': COLLECTIONS.PROMISE_BUDGETS,
  'kpg_payments_v4': COLLECTIONS.PAYMENTS,
  'kpg_expenses_v4': COLLECTIONS.EXPENSES,
  'kpg_ex_officio_v4': COLLECTIONS.EX_OFFICIO,
  'kpg_hla_bawm_v4': COLLECTIONS.HLA_BAWM,
  'kpg_notifications_v1': COLLECTIONS.APP_NOTIFICATIONS,
};

// Firestore to Local storage keys mapping
export const FIRESTORE_TO_STORAGE: Record<string, string> = Object.entries(STORAGE_TO_FIRESTORE).reduce(
  (acc, [storageKey, coll]) => {
    acc[coll] = storageKey;
    return acc;
  },
  {} as Record<string, string>
);

function cleanUndefined(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof HTMLElement || obj.$typeof || typeof obj === 'function') {
    return undefined;
  }
  if (seen.has(obj)) {
    return undefined;
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanUndefined(item, seen))
      .filter((item) => item !== undefined);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const cleanedVal = cleanUndefined(value, seen);
      if (cleanedVal !== undefined) {
        cleaned[key] = cleanedVal;
      }
    }
  }
  return cleaned;
}

// Cloud db operation functions
export async function addToFirestore(collectionName: string, id: string, data: any) {
  try {
    const cleanData = cleanUndefined({ ...data, id });
    await setDoc(doc(db, collectionName, id), cleanData);
  } catch (error) {
    console.error(`Error adding to Firestore [${collectionName}]:`, error);
  }
}

export async function updateInFirestore(collectionName: string, id: string, data: any) {
  try {
    const cleanData = cleanUndefined({ ...data, id });
    await setDoc(doc(db, collectionName, id), cleanData, { merge: true });
  } catch (error) {
    console.error(`Error updating in Firestore [${collectionName}]:`, error);
  }
}

export async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting from Firestore [${collectionName}]:`, error);
  }
}

export async function clearCollectionInFirestore(collectionName: string) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error clearing collection [${collectionName}]:`, error);
  }
}

// Seed helper: Seeds data if collection is empty
export async function seedFirestoreCollection(collectionName: string, initialData: any[]) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty && initialData.length > 0) {
      console.log(`Seeding Firestore collection: ${collectionName} with ${initialData.length} records`);
      const batch = writeBatch(db);
      initialData.forEach((item) => {
        if (!item.id) return;
        const dRef = doc(db, collectionName, item.id);
        batch.set(dRef, cleanUndefined(item));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error(`Error seeding collection [${collectionName}]:`, error);
  }
}

const ALL_MOCK_IDS = new Set([
  'mem-1', 'mem-2', 'mem-4', 'mem-5', 'mem-6', 'mem-7', 'mem-8', 'mem-9', 'mem-10', 'mem-11', 'mem-12', 'mem-pending-1',
  'not-1', 'not-2', 'not-3',
  'comp-1', 'comp-2',
  'meet-1',
  'rec-1', 'rec-2',
  'sug-1', 'sug-2',
  'exp-1', 'exp-2', 'exp-3',
  'pay-1', 'pay-2', 'pay-3', 'pay-4',
  'pb-1', 'pb-2', 'pb-4', 'pb-5', 'pb-6', 'pb-7', 'pb-8', 'pb-9', 'pb-10', 'pb-11', 'pb-12',
  'exo-1', 'exo-2', 'exo-3',
  'notif-1',
]);

// Set up real-time listener for ALL collections
export function syncAllCollections(onDataUpdated: () => void) {
  const unsubscribers: (() => void)[] = [];

  Object.entries(STORAGE_TO_FIRESTORE).forEach(([storageKey, collectionName]) => {
    const colRef = collection(db, collectionName);
    const unsub = onSnapshot(colRef, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        if (ALL_MOCK_IDS.has(docSnap.id)) {
          // Delete mock document from cloud database permanently
          deleteDoc(docSnap.ref).catch(() => {});
        } else {
          items.push({ id: docSnap.id, ...docSnap.data() });
        }
      });

      // Update local storage with clean real-time cloud database data
      localStorage.setItem(storageKey, JSON.stringify(items));
      onDataUpdated();
    }, (error: any) => {
      if (error?.message?.includes('offline') || error?.message?.includes('unavailable') || !navigator.onLine) {
        // Suppress noisy offline logs
      } else {
        console.warn(`Listener warning on [${collectionName}]:`, error?.message || error);
      }
    });
    unsubscribers.push(unsub);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

export async function isFirestoreInitialized(): Promise<boolean> {
  try {
    const docRef = doc(db, 'metadata', 'config');
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.message?.includes('unavailable') || !navigator.onLine) {
      console.info("Firestore is offline or unreachable. Operating in local mode.");
    } else {
      console.warn("Error checking firestore status:", error?.message || error);
    }
    return true; // Assume initialized in offline mode to fallback to local storage smoothly
  }
}

export async function markFirestoreInitialized() {
  try {
    await setDoc(doc(db, 'metadata', 'config'), { initialized: true, seededAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error marking firestore initialized:", error);
  }
}

export async function clearAllFirestoreCollections() {
  try {
    const colls = Object.values(COLLECTIONS);
    for (const c of colls) {
      await clearCollectionInFirestore(c);
    }
    await markFirestoreInitialized();
  } catch (error) {
    console.error("Error clearing all firestore collections:", error);
  }
}

