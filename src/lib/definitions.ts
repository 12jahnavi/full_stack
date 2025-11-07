export type User = {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
};

export type Complaint = {
  id: string;
  title: string;
  category: 'Roads' | 'Utilities' | 'Parks' | 'Public Transport' | 'Other';
  description: string;
  location: string;
  phone: string;
  email: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High';
  date: string;
  userId: string;
  imageUrl?: string;
};

export type Feedback = {
  id: string;
  complaintId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
  date: string;
};

export const ComplaintCategories = ['Roads', 'Utilities', 'Parks', 'Public Transport', 'Other'] as const;
export const ComplaintPriorities = ['Low', 'Medium', 'High'] as const;
export const ComplaintStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'] as const;
