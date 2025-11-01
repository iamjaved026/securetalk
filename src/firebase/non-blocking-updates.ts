
'use client';

import {
  doc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  DocumentReference,
  CollectionReference,
  SetOptions,
  UpdateData,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally but returns the promise.
 * Catches permission errors and emits them.
 */
export function setDocumentNonBlocking(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
) {
  const promise = (options ? setDoc(docRef, data, options) : setDoc(docRef, data))
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'write', // 'set' is a form of 'write'
          requestResourceData: data,
        })
      );
      // Re-throw the error to allow individual promise chains to handle it if needed
      throw error;
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally but returns the promise.
 * Catches permission errors and emits them.
 */
export function updateDocumentNonBlocking(
  docRef: DocumentReference,
  data: UpdateData<any>
) {
  const promise = updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
      // Re-throw the error to allow individual promise chains to handle it
      throw error;
    });
  return promise;
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally but returns the promise.
 * Catches permission errors and emits them.
 */
export function addDocumentNonBlocking(
  collectionRef: CollectionReference,
  data: any
) {
    const promise = addDoc(collectionRef, data)
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: collectionRef.path,
                    operation: 'create',
                    requestResourceData: data,
                })
            );
            throw error;
        });
    return promise;
}
