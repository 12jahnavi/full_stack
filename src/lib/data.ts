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

// This now includes name, email, and phone
export type ComplaintFormData = Omit<Complaint, 'id' | 'date' | 'status' | 'citizenId'>;

/**
 * Creates a new complaint document in Firestore and returns its ID.
 * This is a client-side function.
 * @param firestore - The Firestore instance.
 * @param citizenId - The ID of the user submitting the complaint.
 * @param data - The complaint form data, which now includes personal info.
 * @returns The ID of the newly created complaint document.
 */
export async function createComplaint(
  firestore: Firestore,
  citizenId: string,
  data: ComplaintFormData
): Promise<string> {
  const complaintsCollection = collection(firestore, 'complaints');
  const newDocRef = await addDoc(complaintsCollection, {
    ...data, // This includes name, email, phone, title, etc.
    citizenId,
    status: 'Pending',
    date: serverTimestamp(),
  });
  return newDocRef.id;
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
