import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { Job, VehicleInspection } from "@shared/schema";
import { InspectionForm } from "@/components/vehicle/inspection-form";
import { Loader2 } from "lucide-react";

export default function VehicleInspectionPage() {
  const params = useParams<{ jobId?: string }>();
  const [, navigate] = useLocation();
  const jobId = params.jobId ? parseInt(params.jobId) : undefined;
  
  // State to track whether we're creating a new inspection or viewing/editing existing
  const [isNewInspection, setIsNewInspection] = useState(true);

  // Fetch job details if jobId is provided
  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
    enabled: !!jobId,
  });

  // Fetch existing inspection for this job if available
  const { data: inspections, isLoading: inspectionsLoading } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/vehicle-inspections", { jobId }],
    enabled: !!jobId,
  });

  // Determine if there's an existing inspection
  useEffect(() => {
    if (inspections && inspections.length > 0) {
      setIsNewInspection(false);
    }
  }, [inspections]);

  // Get the first inspection if exists
  const existingInspection = inspections && inspections.length > 0 ? inspections[0] : undefined;

  return (
    <AppShell title="Vehicle Inspection">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-neutral-800">
            {isNewInspection ? "New Vehicle Inspection" : "View Vehicle Inspection"}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/jobs")}>
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Jobs
          </Button>
        </div>

        {(jobLoading || inspectionsLoading) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="p-6">
            <InspectionForm 
              job={job} 
              existingInspection={existingInspection}
              isNewInspection={isNewInspection}
            />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
