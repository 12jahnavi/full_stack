import ComplaintForm from '@/components/complaint-form';

export default function NewComplaintPage() {
  return (
    <div>
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Submit a New Complaint</h2>
        <p className="text-muted-foreground">
          Fill out the form below to report an issue in your community.
        </p>
      </div>
      <ComplaintForm />
    </div>
  );
}
