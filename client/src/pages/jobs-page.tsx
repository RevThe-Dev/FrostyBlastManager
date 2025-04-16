import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Customer, Job, insertJobSchema, insertCustomerSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusIcon, SearchIcon } from "lucide-react";

// Extend the insert schema for validation
const jobFormSchema = insertJobSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

// Customer form schema
const customerFormSchema = insertCustomerSchema.extend({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function JobsPage() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const { toast } = useToast();
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Customer form
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Customer creation mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowNewCustomerDialog(false);
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      // Set the customer ID in the job form
      form.setValue("customerId", newCustomer.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onCustomerSubmit = async (data: CustomerFormValues) => {
    setIsCreatingCustomer(true);
    try {
      await createCustomerMutation.mutateAsync(data);
      customerForm.reset();
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      // Convert string dates to Date objects before sending to the server
      const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      };
      
      const res = await apiRequest("POST", "/api/jobs", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setShowNewJobDialog(false);
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create job: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobId: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: "",
      description: "",
      location: "",
      startDate: new Date().toISOString().split('T')[0],
      status: "scheduled",
      customerId: undefined,
      createdBy: 0, // Will be set on the server
    },
  });

  function onSubmit(data: JobFormValues) {
    createJobMutation.mutate(data);
  }

  const filteredJobs = jobs?.filter(job => 
    job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };

  return (
    <AppShell title="Jobs Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-800">Jobs</h2>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search jobs..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job</DialogTitle>
                  <DialogDescription>
                    Fill in the job details below to create a new job.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="jobId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job ID</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1">
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {customers?.map((customer) => (
                                      <SelectItem key={customer.id} value={customer.id.toString()}>
                                        {customer.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowNewCustomerDialog(true)}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter job title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter job description"
                              rows={3}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="Enter job location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date" 
                                value={field.value || ""} 
                                onChange={(e) => field.onChange(e.target.value || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createJobMutation.isPending}>
                        {createJobMutation.isPending ? "Creating..." : "Create Job"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Customer Creation Dialog */}
        <NewCustomerDialog
          open={showNewCustomerDialog}
          onOpenChange={setShowNewCustomerDialog}
          form={customerForm}
          onSubmit={onCustomerSubmit}
          isCreating={isCreatingCustomer}
        />
        
        <Card>
          <CardHeader className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 className="font-medium">All Jobs</h3>
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
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/vehicle-inspections/${job.id}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1V7a1 1 0 00-1-1h-5m-4 0V3a1 1 0 011-1h2a1 1 0 011 1v3" />
                              </svg>
                              Inspect
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Open job details dialog
                                setSelectedJob(job);
                                setShowJobDetails(true);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                        {searchTerm ? "No matching jobs found" : "No jobs found. Get started by creating your first job."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected job.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Job ID</p>
                  <p className="font-medium">{selectedJob.jobId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">Status</p>
                  <StatusBadge status={selectedJob.status} />
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Title</p>
                <p>{selectedJob.title}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Customer</p>
                <p>{getCustomerName(selectedJob.customerId)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Description</p>
                <p className="text-sm text-neutral-600">{selectedJob.description || "No description provided"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Start Date</p>
                  <p>{new Date(selectedJob.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-500">End Date</p>
                  <p>{selectedJob.endDate ? new Date(selectedJob.endDate).toLocaleDateString() : "Not set"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Location</p>
                <p>{selectedJob.location || "No location specified"}</p>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-neutral-200">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `/vehicle-inspections/${selectedJob.id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1V7a1 1 0 00-1-1h-5m-4 0V3a1 1 0 011-1h2a1 1 0 011 1v3" />
                  </svg>
                  Vehicle Inspection
                </Button>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
  } else if (status === "canceled") {
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
        Canceled
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

// Customer Creation Dialog
function NewCustomerDialog({ 
  open, 
  onOpenChange, 
  form, 
  onSubmit, 
  isCreating 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  onSubmit: (data: any) => void;
  isCreating: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to use in this job.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Customer name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="customer@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Customer address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional notes about the customer"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
