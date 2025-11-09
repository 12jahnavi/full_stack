'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { Complaint } from './definitions';

type ComplaintFormData = Omit<Complaint, 'id' | 'date' | 'status' | 'citizenId'>;

/**
 * Creates a new complaint document in Firestore.
 * This is a client-side function.
 * @param firestore - The Firestore instance.
 * @param citizenId - The ID of the user submitting the complaint.
 * @param data - The complaint form data.
 */
export async function createComplaint(
  firestore: Firestore,
  citizenId: string,
  data: ComplaintFormData
) {
  // All complaints now go into a single top-level collection
  const complaintsCollection = collection(firestore, 'complaints');
  await addDoc(complaintsCollection, {
    ...data,
    citizenId,
    status: 'Pending',
    date: serverTimestamp(),
  });
}

/**
 * Updates the status of a complaint document in Firestore.
 * This is a client-side function.
 * @param firestore - The Firestore instance.
 * @param complaintId - The ID of the complaint to update.
 * @param status - The new status.
 */
export async function updateComplaintStatus(
  firestore: Firestore,
  complaintId: string,
  status: Complaint['status']
) {
  const complaintDoc = doc(firestore, 'complaints', complaintId);
  await updateDoc(complaintDoc, { status });
}

/**
 * Deletes a complaint document from Firestore.
 * This is a client-side function.
 * @param firestore - The Firestore instance.
 * @param complaintId - The ID of the complaint to delete.
 */
export async function deleteComplaint(
  firestore: Firestore,
  complaintId: string
) {
  const complaintDoc = doc(firestore, 'complaints', complaintId);
  await deleteDoc(complaintDoc);
}
