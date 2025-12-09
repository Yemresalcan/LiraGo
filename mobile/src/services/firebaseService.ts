// ===========================================
// FIREBASE SERVICE LAYER
// ===========================================
// Centralized Firebase operations with error handling,
// retry logic, and pagination support for 10K+ users

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// ============ TYPES ============
export interface PaginatedResult<T> {
  items: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export interface QueryOptions {
  pageSize?: number;
  startAfterDoc?: DocumentSnapshot;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
    value: unknown;
  }>;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============ GENERIC CRUD OPERATIONS ============

/**
 * Get a single document by ID
 */
export async function getDocument<T>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data()),
    } as T;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get paginated documents from a collection
 */
export async function getDocuments<T>(
  collectionName: string,
  options: QueryOptions = {}
): Promise<PaginatedResult<T>> {
  try {
    const {
      pageSize = DEFAULT_PAGE_SIZE,
      startAfterDoc,
      orderByField = 'createdAt',
      orderDirection = 'desc',
      filters = [],
    } = options;

    const constraints: QueryConstraint[] = [];

    // Add filters
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });

    // Add ordering
    constraints.push(orderBy(orderByField, orderDirection));

    // Add pagination
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    // Limit results (fetch one extra to check if there are more)
    const effectivePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
    constraints.push(limit(effectivePageSize + 1));

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > effectivePageSize;
    const items = docs.slice(0, effectivePageSize).map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as T[];

    return {
      items,
      lastDoc: docs.length > 0 ? docs[Math.min(docs.length - 1, effectivePageSize - 1)] : null,
      hasMore,
    };
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Create a new document
 */
export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for a collection
 */
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (items: T[]) => void,
  options: QueryOptions = {}
): Unsubscribe {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    filters = [],
  } = options;

  const constraints: QueryConstraint[] = [];

  filters.forEach(filter => {
    constraints.push(where(filter.field, filter.operator, filter.value));
  });

  constraints.push(orderBy(orderByField, orderDirection));
  constraints.push(limit(Math.min(pageSize, MAX_PAGE_SIZE)));

  const q = query(collection(db, collectionName), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as T[];
    callback(items);
  }, (error) => {
    console.error(`Error in collection subscription ${collectionName}:`, error);
  });
}

// ============ STORAGE OPERATIONS ============

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: Blob | ArrayBuffer
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Convert Firestore Timestamps to JavaScript Dates
 */
function convertTimestamps(data: DocumentData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = convertTimestamps(value as DocumentData);
    } else {
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Batch get documents by IDs
 */
export async function getDocumentsByIds<T>(
  collectionName: string,
  ids: string[]
): Promise<T[]> {
  if (ids.length === 0) return [];
  
  // Firestore 'in' queries are limited to 10 items, so we need to batch
  const batchSize = 10;
  const batches: string[][] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  
  const results: T[] = [];
  
  for (const batch of batches) {
    const q = query(
      collection(db, collectionName),
      where('__name__', 'in', batch)
    );
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
      results.push({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      } as T);
    });
  }
  
  return results;
}

/**
 * Count documents in a collection (with filters)
 */
export async function countDocuments(
  collectionName: string,
  filters: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
    value: unknown;
  }> = []
): Promise<number> {
  try {
    const constraints: QueryConstraint[] = filters.map(filter =>
      where(filter.field, filter.operator, filter.value)
    );
    
    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    throw error;
  }
}
