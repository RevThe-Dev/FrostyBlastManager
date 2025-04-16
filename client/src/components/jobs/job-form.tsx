import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertJobSchema, insertCustomerSchema, Job, Customer } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Loader2, Plus, User } from "lucide-react";

// Extend schema for validation
const jobFormSchema = insertJobSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  job?: Job;
  onComplete?: () => void;
}

// Customer form schema
const customerFormSchema = insertCustomerSchema.extend({});
type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function JobForm({ job, onComplete }: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const { toast } = useToast();
  
  // Setup customer form
  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: ""
    }
  });
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: (newCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      // Set the newly created customer as the selected customer in the job form
      form.setValue("customerId", newCustomer.id);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      setShowNewCustomerDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle customer form submission
  const onCustomerSubmit = async (data: CustomerFormValues) => {
    setIsCreatingCustomer(true);
    try {
      await createCustomerMutation.mutateAsync(data);
    } finally {
      setIsCreatingCustomer(false);
    }
  };
  
  // Fetch customers for dropdown
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Format dates for form
  const formatDateForInput = (dateString?: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Setup form with default values
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobId: job?.jobId || `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
      title: job?.title || "",
      description: job?.description || "",
      location: job?.location || "",
      startDate: formatDateForInput(job?.startDate) || formatDateForInput(new Date()),
      endDate: formatDateForInput(job?.endDate) || "",
      status: job?.status || "scheduled",
      customerId: job?.customerId || undefined,
      createdBy: job?.createdBy || 0, // Will be set on the server if creating new job
    },
  });
  
  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      // Convert string dates to Date objects
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
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create job: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: async (data: JobFormValues & { id: number }) => {
      const { id, ...jobData } = data;
      
      // Convert string dates to Date objects
      const formattedData = {
        ...jobData,
        startDate: jobData.startDate ? new Date(jobData.startDate) : null,
        endDate: jobData.endDate ? new Date(jobData.endDate) : null,
      };
      
      const res = await apiRequest("PUT", `/api/jobs/${id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update job: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);
    try {
      if (job) {
        // Update existing job
        await updateJobMutation.mutateAsync({ ...data, id: job.id });
      } else {
        // Create new job
        await createJobMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (customersLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job ID</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={!!job} />
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
                <div className="flex items-center justify-between">
                  <FormLabel>Customer</FormLabel>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNewCustomerDialog(true)} 
                    className="h-8 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Customer
                  </Button>
                </div>
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Customer Creation Dialog */}
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Fill in the customer details to create a new customer record.
                </DialogDescription>
              </DialogHeader>
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                  <FormField
                    control={customerForm.control}
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
                    control={customerForm.control}
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
                      control={customerForm.control}
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
                      control={customerForm.control}
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
                    control={customerForm.control}
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
                      onClick={() => setShowNewCustomerDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingCustomer}>
                      {isCreatingCustomer ? (
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onComplete && onComplete()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {job ? "Updating..." : "Creating..."}
              </>
            ) : (
              job ? "Update Job" : "Create Job"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
