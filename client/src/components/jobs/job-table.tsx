import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Customer, Job } from "@shared/schema";
import { SearchIcon, Eye, Clipboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface JobTableProps {
  filter?: string;
}

export function JobTable({ filter }: JobTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  let filteredJobs = jobs;
  
  // Apply status filter if provided
  if (filter) {
    filteredJobs = jobs?.filter(job => job.status === filter);
  }
  
  // Apply search filter
  if (searchTerm && filteredJobs) {
    filteredJobs = filteredJobs.filter(job => 
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative w-full md:w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search jobs..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="font-medium">{filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Jobs` : "All Jobs"}</h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Job ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">Title</th>
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
                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                      Loading jobs...
                    </td>
                  </tr>
                ) : filteredJobs && filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                        {job.jobId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {job.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {getCustomerName(job.customerId)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {new Date(job.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-800">
                        {job.location || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link href={`/vehicle-inspections/${job.id}`}>
                            <Button variant="outline" size="sm">
                              <Clipboard className="h-4 w-4 mr-1" />
                              Inspect
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                      {searchTerm 
                        ? "No matching jobs found" 
                        : filter 
                          ? `No ${filter} jobs found` 
                          : "No jobs found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function JobStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Completed</Badge>;
    case "in-progress":
      return <Badge className="bg-yellow-100 text-amber-600 hover:bg-yellow-100">In Progress</Badge>;
    case "canceled":
      return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">Canceled</Badge>;
    default:
      return <Badge className="bg-blue-100 text-primary hover:bg-blue-100">Scheduled</Badge>;
  }
}
