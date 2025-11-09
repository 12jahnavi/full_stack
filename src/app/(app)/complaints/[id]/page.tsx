'use client';

import { notFound, usePathname, useRouter } from 'next/navigation';
import ComplaintStatusBadge from '@/components/complaint-status-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Tag, MapPin, User, Mail, Phone, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Complaint } from '@/lib/definitions';


export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const { firestore, user } = useFirebase();
  const [citizenName, setCitizenName] = useState<string>('Unknown');
  const router = useRouter();

  // Create a memoized reference to the document in the top-level 'complaints' collection
  const complaintRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'complaints', params.id);
  }, [firestore, params.id]);

  const { data: complaint, isLoading } = useDoc<Complaint>(complaintRef);

  // Fetch citizen data once the complaint data is loaded
  useEffect(() => {
    const fetchCitizenData = async () => {
      if (firestore && complaint?.citizenId) {
        const userDocRef = doc(firestore, 'citizens', complaint.citizenId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setCitizenName(`${userData.firstName} ${userData.lastName}`);
        } else {
            setCitizenName('Unknown User');
        }
      }
    };
    
    if (complaint) {
      fetchCitizenData();
    }
  }, [firestore, complaint]);


  if (isLoading) {
    return <div>Loading complaint details...</div>;
  }
  
  // After loading, if no complaint is found, show the not found page.
  if (!complaint && !isLoading) {
    notFound();
  }
  
  // This check should now be redundant, but as a safeguard.
  if (!complaint) {
    return <div>Complaint not found.</div>
  }

  return (
    <div>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Complaint Details</h2>
        <p className="text-muted-foreground">
          Viewing details for complaint ID:{' '}
          <span className="font-mono">{params.id}</span>
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{complaint.title}</span>
                <ComplaintStatusBadge status={complaint.status} />
              </CardTitle>
              <CardDescription>{complaint.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    Submitted by: <strong>{citizenName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>
                    Contact Email: <strong>{complaint.email}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>
                    Contact Phone: <strong>{complaint.phone}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                { /* @ts-ignore */ }
                <span>Submitted on {complaint.date ? new Date(complaint.date.seconds * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{complaint.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{complaint.category}</Badge>
              </div>
               <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <Badge variant={complaint.priority === 'High' ? 'destructive' : complaint.priority === 'Medium' ? 'default' : 'secondary'}>
                  {complaint.priority} Priority
                </Badge>
              </div>
            </CardContent>
          </Card>

          {complaint.status === 'Resolved' && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>
                  How was your experience with this resolution?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* A real app would use a form with a server action here */}
                <div className="flex justify-around">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <Button key={rating} variant="outline" size="icon">
                      {rating}
                    </Button>
                  ))}
                </div>
                <Textarea placeholder="Add your comments..." />
                <Button className="w-full">Submit Feedback</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
