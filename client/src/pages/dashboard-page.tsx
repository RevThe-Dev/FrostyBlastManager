import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Job, Invoice, VehicleInspection } from "@shared/schema";
import { CalendarIcon, PlusIcon, ArrowUpIcon, TriangleAlert, ClockIcon, TrendingUpIcon, ClipboardListIcon, CarIcon, File, BarChartIcon } from "lucide-react";
import { JobForm } from "@/components/jobs/job-form";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showThisWeekOnly, setShowThisWeekOnly] = useState(false);
  
  // Fetch jobs, invoices, and vehicle inspections
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });
  
  const { data: inspections, isLoading: inspectionsLoading } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/vehicle-inspections"],
  });

  // Filter jobs by status and date if "This Week" is selected
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  
  const filteredJobs = showThisWeekOnly 
    ? jobs?.filter(job => {
        const jobDate = new Date(job.startDate);
        return jobDate >= startOfWeek && jobDate <= endOfWeek;
      })
    : jobs;
    
  const scheduledJobs = filteredJobs?.filter(job => job.status === "scheduled") || [];
  const inProgressJobs = filteredJobs?.filter(job => job.status === "in-progress") || [];
  const completedJobs = filteredJobs?.filter(job => job.status === "completed") || [];
  
  // Calculate dashboard metrics
  // Consider all vehicle inspections as pending for now (we could filter by some other criterion later)
  const pendingInspectionsCount = inspections?.length || 0;
  
  // Calculate unpaid invoices and total amount
  const unpaidInvoices = invoices?.filter(invoice => invoice.status === "draft" || invoice.status === "sent") || [];
  const unpaidAmount = unpaidInvoices.reduce((total, invoice) => total + (invoice.total || 0), 0);
  
  // Calculate this month's revenue
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthInvoices = invoices?.filter(invoice => {
    const invoiceDate = new Date(invoice.issueDate);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  }) || [];
  
  const thisMonthRevenue = thisMonthInvoices.reduce((total, invoice) => total + (invoice.status === "paid" ? invoice.total : 0), 0);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-neutral-800">Dashboard</h2>
          <div className="flex space-x-2">
            <Button 
              variant={showThisWeekOnly ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowThisWeekOnly(!showThisWeekOnly)}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>This Week</span>
            </Button>
            
            <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  <span>New Job</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                </DialogHeader>
                <JobForm 
                  onComplete={() => {
                    setShowJobDialog(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Scheduled Jobs" 
            value={jobsLoading ? "..." : scheduledJobs.length}
            icon={<ClipboardListIcon className="h-5 w-5" />}
            iconColor="text-primary"
            trend={{
              value: `${inProgressJobs.length} in progress`,
              positive: true,
              icon: <ArrowUpIcon className="h-3 w-3" />
            }}
          />
          
          <StatsCard 
            title="Pending Inspections" 
            value={inspectionsLoading ? "..." : pendingInspectionsCount}
            icon={<CarIcon className="h-5 w-5" />}
            iconColor="text-amber-600"
            trend={{
              value: `${completedJobs.length} jobs completed`,
              neutral: true,
              icon: <TriangleAlert className="h-3 w-3" />
            }}
          />
          
          <StatsCard 
            title="Unpaid Invoices" 
            value={invoicesLoading ? "..." : formatCurrency(unpaidAmount)}
            icon={<File className="h-5 w-5" />}
            iconColor="text-red-600"
            trend={{
              value: `${unpaidInvoices.length} invoices pending`,
              positive: false,
              icon: <ClockIcon className="h-3 w-3" />
            }}
          />
          
          <StatsCard 
            title="Revenue (This Month)" 
            value={invoicesLoading ? "..." : formatCurrency(thisMonthRevenue)}
            icon={<BarChartIcon className="h-5 w-5" />}
            iconColor="text-green-600"
            trend={{
              value: `${thisMonthInvoices.length} invoices this month`,
              positive: true,
              icon: <TrendingUpIcon className="h-3 w-3" />
            }}
          />
        </div>
        
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="px-4 py-3 border-b border-neutral-200">
            <h3 className="font-medium">Recent Jobs</h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Job ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {jobsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-600">
                        Loading jobs...
                      </td>
                    </tr>
                  ) : filteredJobs && filteredJobs.length > 0 ? (
                    filteredJobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                          {job.jobId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                          {/* In a real app, fetch customer name */}
                          Customer #{job.customerId}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                          {new Date(job.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                          {job.location || "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-neutral-600">
                        No jobs found. Get started by creating your first job.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 text-right">
              <Link href="/jobs" className="text-sm text-primary hover:text-primary-dark">
                View all jobs <span aria-hidden="true">→</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">
        Completed
      </span>
    );
  } else if (status === "in-progress") {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-amber-600">
        In Progress
      </span>
    );
  } else {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-primary">
        Scheduled
      </span>
    );
  }
}
