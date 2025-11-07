import { FilePlus2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { complaints, users } from '@/lib/data';
import { Complaint } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import { ComplaintActions } from '@/components/complaint-actions';

export default function DashboardPage() {
  // In a real app, user would be from session.
  const currentUser = users[0];
  const userComplaints = complaints.filter(c => c.userId === currentUser.id);

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {currentUser.name}!</h2>
          <p className="text-muted-foreground">
            Here's a list of your submitted complaints.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/complaints/new">
              <FilePlus2 className="mr-2 h-4 w-4" /> New Complaint
            </Link>
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userComplaints.length > 0 ? (
              userComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">
                    <Link href={`/complaints/${complaint.id}`} className="hover:underline">
                      {complaint.title}
                    </Link>
                  </TableCell>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>{complaint.priority}</TableCell>
                  <TableCell>{new Date(complaint.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ComplaintStatusBadge status={complaint.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ComplaintActions complaint={complaint} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  You have not submitted any complaints yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
