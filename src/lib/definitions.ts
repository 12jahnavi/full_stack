import { Timestamp } from "firebase/firestore";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type Complaint = {
  id: string;
  name: string;
  title: string;
  category: 'Roads' | 'Utilities' | 'Parks' | 'Public Transport' | 'Other';
  description: string;
  location: string;
  phone: string;
  email: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High';
  date: Timestamp;
  citizenId: string;
  imageUrl?: string;
};

export type Feedback = {
  id: string;
  complaintId: string;
  citizenId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
  date: Timestamp;
  sentiment?: string;
  sentimentConfidence?: number;
};

export const ComplaintCategories = ['Roads', 'Utilities', 'Parks', 'Public Transport', 'Other'] as const;
export const ComplaintPriorities = ['Low', 'Medium', 'High'] as const;
export const ComplaintStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;
