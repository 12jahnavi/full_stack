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
import { useFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, getDoc, DocumentReference, DocumentData } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import type { Complaint } from '@/lib/definitions';


export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const { firestore, user } = useFirebase();
  const [complaintRef, setComplaintRef] = useState<DocumentReference<DocumentData> | null>(null);
  const [citizenName, setCitizenName] = useState<string>('Unknown');
  const router = useRouter();

  // Find the full path to the complaint document.
  // This is a bit tricky since we only have the complaint ID.
  // A real app might store the full path or have a different URL structure.
  // For now, we assume the user viewing is the owner, or an admin.
  useEffect(() => {
    const findComplaintPath = async () => {
      if (!firestore || !user) return;

      // Try citizen's own complaints first
      const potentialPath = `citizens/${user.uid}/complaints/${params.id}`;
      const docRef = doc(firestore, potentialPath);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setComplaintRef(docRef);
        setCitizenName(user.displayName || 'Unknown');
      } else {
        // If not found, a real app would need a more robust way to find the complaint
        // (e.g., for an admin). Since we don't have that, we can assume not found.
        // For this app, an admin finds complaints via collectionGroup, but that's inefficient here.
        // We'll stick to the user's complaints.
        // A better structure might be a top-level 'complaints' collection.
      }
    };
    findComplaintPath();
  }, [firestore, user, params.id]);

  const memoizedComplaintRef = useMemo(() => complaintRef, [complaintRef]);

  // @ts-ignore
  const { data: complaint, isLoading } = useDoc<Complaint>(memoizedComplaintRef);

  // Fetch citizen data if an admin is viewing
  useEffect(() => {
    const fetchCitizenData = async () => {
      if (firestore && complaint?.citizenId && user?.uid !== complaint.citizenId) {
        const userDocRef = doc(firestore, 'citizens', complaint.citizenId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            setCitizenName(`${userData.firstName} ${userData.lastName}`);
        }
      }
    };
    if (complaint) {
      fetchCitizenData();
    }
  }, [firestore, complaint, user]);


  if (isLoading) {
    return <div>Loading complaint details...</div>;
  }

  if (!complaint && !isLoading) {
     // A delay to allow path discovery to complete
    setTimeout(() => {
        if (!complaintRef) notFound();
    }, 2000)
    return <div>Searching for complaint...</div>
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
                <span>Submitted on {new Date(complaint.date.seconds * 1000).toLocaleString()}</span>
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
