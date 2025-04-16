import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertInvoiceSchema, Invoice, Job, Customer, InvoiceItem, VehicleInspection } from "@shared/schema";
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
import { Loader2, Plus, Send, Download, Eye, Trash2, FileText } from "lucide-react";
import { LineItem } from "@/components/invoices/line-item";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

// Invoice schema for validation
const invoiceFormSchema = insertInvoiceSchema.extend({
  dueDate: z.string().min(1, "Due date is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  lineItems: z.array(
    z.object({
      description: z.string().min(1, "Description is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Unit price must be at least 0"),
      total: z.number().optional(),
    })
  ).min(1, "At least one line item is required"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  existingInvoice?: Invoice;
  onComplete?: () => void;
}

export function InvoiceForm({ existingInvoice, onComplete }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailDetails, setEmailDetails] = useState({
    recipient: "",
    subject: "",
    message: ""
  });
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([{
    id: 0,
    invoiceId: 0,
    description: "",
    quantity: 1,
    unitPrice: 0,
    total: 0
  }]);
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>(existingInvoice?.jobId);
  const { toast } = useToast();
  
  // Fetch vehicle inspection for the selected job
  const { data: vehicleInspections, isLoading: isLoadingInspection } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/vehicle-inspections", selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return [];
      
      console.log("Fetching vehicle inspections for job ID:", selectedJobId);
      
      const res = await fetch(`/api/vehicle-inspections?jobId=${selectedJobId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.error("Failed to fetch vehicle inspection:", res.statusText);
        throw new Error('Failed to fetch vehicle inspection');
      }
      
      const data = await res.json();
      console.log("Vehicle inspection data received:", data);
      return data;
    },
    enabled: !!selectedJobId
  });
  
  // Extract the first vehicle inspection if available
  const vehicleInspection = vehicleInspections && vehicleInspections.length > 0 ? vehicleInspections[0] : undefined;
  
  console.log("Selected job ID:", selectedJobId);
  console.log("Vehicle inspection:", vehicleInspection);
  
  // Fetch jobs for dropdown
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Fetch customers for dropdown
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Format dates for form
  const formatDateForInput = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Calculate subtotal, tax, and total
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  // Generate a new invoice number
  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    
    return `INV-${year}${month}-${random}`;
  };
  
  // Initialize form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: existingInvoice?.invoiceNumber || generateInvoiceNumber(),
      jobId: existingInvoice?.jobId || 0,
      customerId: existingInvoice?.customerId || 0,
      amount: existingInvoice?.amount || 0,
      tax: existingInvoice?.tax || 0,
      total: existingInvoice?.total || 0,
      issueDate: formatDateForInput(existingInvoice?.issueDate) || formatDateForInput(new Date()),
      dueDate: formatDateForInput(existingInvoice?.dueDate) || formatDateForInput(new Date(Date.now() + 30*24*60*60*1000)), // 30 days from now
      notes: existingInvoice?.notes || "Thank you for your business. Payment is due within 30 days.",
      paymentTerms: existingInvoice?.paymentTerms || "30",
      paymentMethod: existingInvoice?.paymentMethod || "bank-transfer",
      status: existingInvoice?.status || "draft",
      createdBy: existingInvoice?.createdBy || 0, // Will be set on the server
      lineItems: lineItems as any[] || [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    },
  });
  
  // Set the selected job ID from existingInvoice on component mount
  useEffect(() => {
    if (existingInvoice?.jobId && existingInvoice.jobId > 0) {
      console.log("Setting selected job ID from existingInvoice:", existingInvoice.jobId);
      setSelectedJobId(existingInvoice.jobId);
    }
  }, [existingInvoice]);
  
  // Fetch invoice details if editing an existing invoice
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (existingInvoice && form) {
        try {
          console.log("Fetching invoice details for existing invoice:", existingInvoice.id);
          
          const res = await fetch(`/api/invoices/${existingInvoice.id}`, {
            credentials: 'include'
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log("Received invoice data:", data);
            
            // Update line items from server data
            if (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) {
              console.log("Setting line items from server data:", data.lineItems);
              
              // Fix numeric types for line items coming from the server
              const processedLineItems = data.lineItems.map((item: any) => {
                return {
                  ...item,
                  // Ensure numeric values are properly typed
                  quantity: Number(item.quantity) || 1,
                  unitPrice: Number(item.unitPrice) || 0,
                  total: Number(item.total) || 0
                };
              });
              
              console.log("Processed line items with fixed numeric types:", processedLineItems);
              setLineItems(processedLineItems);
              
              // Update calculations based on properly typed line items
              const subtotal = processedLineItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
              const taxRate = 0.2; // 20% VAT
              const tax = subtotal * taxRate;
              const total = subtotal + tax;
              
              setCalculations({
                subtotal,
                tax,
                total
              });
            } else {
              console.log("No line items found in server response");
            }
            
            // Set the selected job ID to trigger fetching vehicle inspection
            if (data.jobId) {
              console.log("Setting selected job ID from invoice:", data.jobId);
              setSelectedJobId(data.jobId);
              form.setValue("jobId", data.jobId);
            }
            
            // Update customer ID if needed
            if (data.customerId) {
              form.setValue("customerId", data.customerId);
            }
          }
        } catch (error) {
          console.error("Error fetching invoice details:", error);
        }
      }
    };
    
    fetchInvoiceDetails();
  }, [existingInvoice, form]);
  
  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      // Convert string dates to Date objects before sending
      const formattedData = {
        ...data,
        amount: calculations.subtotal,
        tax: calculations.tax,
        total: calculations.total,
        jobId: parseInt(data.jobId.toString()),
        customerId: parseInt(data.customerId.toString()),
        // Don't convert dates to Date objects here - they should be strings
        // The server will parse these properly
        lineItems: lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      };
      
      console.log("Submitting invoice data:", formattedData);
      
      try {
        const res = await apiRequest("POST", "/api/invoices", formattedData);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || res.statusText);
        }
        return res.json();
      } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      console.error("Invoice creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues & { id: number }) => {
      const { id, ...invoiceData } = data;
      const res = await apiRequest("PUT", `/api/invoices/${id}`, {
        ...invoiceData,
        amount: calculations.subtotal,
        tax: calculations.tax,
        total: calculations.total,
        jobId: parseInt(invoiceData.jobId.toString()),
        customerId: parseInt(invoiceData.customerId.toString())
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Email invoice mutation
  const emailInvoiceMutation = useMutation({
    mutationFn: async ({ id, emailData }: { id: number, emailData: typeof emailDetails }) => {
      const res = await apiRequest("POST", `/api/invoices/${id}/email`, emailData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice sent successfully via email",
      });
      setShowEmailDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send email: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingInvoice) {
        // Update existing invoice
        await updateInvoiceMutation.mutateAsync({ 
          ...data, 
          id: existingInvoice.id,
          lineItems: lineItems as any[]
        });
      } else {
        // Create new invoice
        console.log("Creating new invoice with data:", {
          ...data,
          lineItems: lineItems
        });
        
        // Validate required fields
        if (!data.jobId) {
          console.error("Missing jobId");
          toast({
            title: "Error",
            description: "Please select a job reference",
            variant: "destructive",
          });
          return;
        }
        
        if (!data.customerId) {
          console.error("Missing customerId");
          toast({
            title: "Error",
            description: "Please select a customer",
            variant: "destructive",
          });
          return;
        }
        
        if (lineItems.length === 0 || !lineItems[0].description) {
          console.error("Missing line items");
          toast({
            title: "Error",
            description: "Please add at least one item to the invoice",
            variant: "destructive",
          });
          return;
        }
        
        // Prepare the invoice data with line items
        const invoiceData = {
          ...data,
          amount: calculations.subtotal,
          tax: calculations.tax,
          total: calculations.total,
          jobId: parseInt(data.jobId.toString()),
          customerId: parseInt(data.customerId.toString()),
          lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total
          }))
        };
        
        console.log("Submitting invoice directly:", invoiceData);
        
        // Use direct fetch for better debugging
        try {
          const response = await fetch('/api/invoices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(invoiceData)
          });
          
          // Handle response
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error:", errorText);
            throw new Error(errorText || response.statusText);
          }
          
          const result = await response.json();
          console.log("Invoice created successfully:", result);
          
          // Invalidate queries and show success message
          queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
          toast({
            title: "Success",
            description: "Invoice created successfully",
          });
          
          if (onComplete) onComplete();
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      toast({
        title: "Error",
        description: `Failed to ${existingInvoice ? 'update' : 'create'} invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLineItemChange = (index: number, item: Partial<InvoiceItem>) => {
    // Create a new array without mutating the original
    const newLineItems = lineItems.map((lineItem, i) => {
      if (i !== index) return lineItem;
      
      // For the changed item, create a completely new object with proper type casting
      // Ensure all numeric values are properly typed
      const newQuantity = item.quantity !== undefined ? 
                          (typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity)) || 1) : 
                          (typeof lineItem.quantity === 'number' ? lineItem.quantity : 1);
                          
      const newUnitPrice = item.unitPrice !== undefined ? 
                          (typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(String(item.unitPrice)) || 0) : 
                          (typeof lineItem.unitPrice === 'number' ? lineItem.unitPrice : 0);
      
      return {
        ...lineItem,
        ...item,
        // Make sure we have all required fields with proper types
        description: item.description !== undefined ? item.description : (lineItem.description || ""),
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        total: item.total !== undefined ? 
              (typeof item.total === 'number' ? item.total : parseFloat(String(item.total)) || 0) : 
              newQuantity * newUnitPrice
      };
    });
    
    // Update line items state
    setLineItems(newLineItems);
    
    // Recalculate totals
    const subtotal = newLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxRate = 0.2; // 20% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    setCalculations({
      subtotal,
      tax,
      total
    });
  };
  
  const addLineItem = () => {
    // Create new line item
    const newLineItem = {
      id: 0, // Will be set on the server
      invoiceId: existingInvoice?.id || 0,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    
    // Add to existing items
    const newLineItems = [...lineItems, newLineItem];
    
    // Update line items
    setLineItems(newLineItems);
    
    // Recalculate totals
    const subtotal = newLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxRate = 0.2; // 20% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    setCalculations({
      subtotal,
      tax,
      total
    });
  };
  
  const removeLineItem = (index: number) => {
    // Create new array without the removed item
    const newLineItems = lineItems.filter((_, i) => i !== index);
    
    // Ensure at least one line item
    if (newLineItems.length === 0) {
      newLineItems.push({
        id: 0,
        invoiceId: existingInvoice?.id || 0,
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0
      });
    }
    
    // Update line items
    setLineItems(newLineItems);
    
    // Recalculate totals
    const subtotal = newLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxRate = 0.2; // 20% VAT
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    setCalculations({
      subtotal,
      tax,
      total
    });
  };
  
  const handleEmailInvoice = () => {
    if (!existingInvoice) return;
    
    // Find customer email
    const customer = customers?.find(c => c.id === existingInvoice.customerId);
    
    setEmailDetails({
      recipient: customer?.email || "",
      subject: `Invoice ${existingInvoice.invoiceNumber} from Frosty's Ice Blasting Solutions`,
      message: `Please find attached invoice ${existingInvoice.invoiceNumber} for your recent service.\n\nThank you for your business.\n\nFrosty's Ice Blasting Solutions`
    });
    
    setShowEmailDialog(true);
  };
  
  const sendEmail = () => {
    if (!existingInvoice) return;
    
    emailInvoiceMutation.mutate({
      id: existingInvoice.id,
      emailData: emailDetails
    });
  };
  
  // Update job selection to also update customer and vehicle inspection
  const handleJobChange = (jobId: string) => {
    const jobIdNum = parseInt(jobId);
    form.setValue("jobId", jobIdNum);
    setSelectedJobId(jobIdNum);
    
    // Find the job to get the customerId
    const job = jobs?.find(j => j.id === jobIdNum);
    if (job) {
      form.setValue("customerId", job.customerId);
      
      // Add a default line item for the ice blasting service
      if (lineItems.length === 1 && !lineItems[0].description) {
        setLineItems([
          {
            id: 0,
            invoiceId: 0,
            description: "Ice Blasting Service",
            quantity: 1,
            unitPrice: 150.00,
            total: 150.00
          }
        ]);
      }
    }
  };
  
  // Get customer name
  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? customer.name : `Customer #${customerId}`;
  };
  
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find(j => j.id === jobId);
    return job ? job.title : `Job #${jobId}`;
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Invoice Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-neutral-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Reference</FormLabel>
                      <Select
                        onValueChange={handleJobChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job reference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobs?.map((job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.jobId} - {getCustomerName(job.customerId)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
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
                
                <div className="form-item">
                  <FormLabel>Customer Email</FormLabel>
                  <Input
                    type="text"
                    value={customers?.find(c => c.id === form.getValues("customerId"))?.email || ""}
                    readOnly
                    className="bg-neutral-50"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <FormLabel>Customer Address</FormLabel>
                <Textarea
                  value={customers?.find(c => c.id === form.getValues("customerId"))?.address || ""}
                  readOnly
                  className="bg-neutral-50"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Line Item
                </Button>
              </div>
              
              <Card className="mb-4 overflow-hidden border border-neutral-200">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider w-[40%]">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider w-[15%]">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider w-[20%]">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider w-[15%]">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase tracking-wider w-[10%]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <LineItem
                            key={index}
                            item={item}
                            index={index}
                            onChange={handleLineItemChange}
                            onRemove={removeLineItem}
                            disabled={lineItems.length === 1}
                          />
                        ))}
                        {lineItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                              No items added yet. Use the "Add Line Item" button to add invoice items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes for the customer"
                        rows={3}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Right Column - Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="bg-neutral-50 p-4">
                <h3 className="text-lg font-medium">Invoice Summary</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal:</span>
                  <span className="font-medium">£{calculations.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">VAT (20%):</span>
                  <span className="font-medium">£{calculations.tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-neutral-300 pt-3 flex justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">£{calculations.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-neutral-50 p-4">
                <h3 className="text-lg font-medium">Payment Details</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment terms" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">Net 30</SelectItem>
                          <SelectItem value="15">Net 15</SelectItem>
                          <SelectItem value="7">Net 7</SelectItem>
                          <SelectItem value="0">Due on receipt</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit-card">Credit Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending Payment</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Vehicle Inspection Card */}
            <Card>
              <CardHeader className="bg-neutral-50 p-4">
                <h3 className="text-lg font-medium">Vehicle Inspection</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {vehicleInspection ? (
                  <>
                    <div className="space-y-4">
                      <div className="border border-neutral-200 p-3 rounded-md">
                        <div className="mb-2 border-b pb-1 border-neutral-200">
                          <span className="text-primary font-medium">Vehicle Details</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 text-sm">Make/Model:</span>
                            <span className="font-medium text-sm">
                              {vehicleInspection.vehicleMake} {vehicleInspection.vehicleModel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 text-sm">Registration:</span>
                            <span className="font-medium text-sm">{vehicleInspection.registrationNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 text-sm">Mileage:</span>
                            <span className="font-medium text-sm">{vehicleInspection.mileage} miles</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-neutral-200 p-3 rounded-md">
                        <div className="mb-2 border-b pb-1 border-neutral-200">
                          <span className="text-primary font-medium">Inspection Info</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-neutral-600 text-sm">Inspected By:</span>
                            <span className="font-medium text-sm">Staff #{vehicleInspection.inspectedBy}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600 text-sm">Date:</span>
                            <span className="font-medium text-sm">
                              {new Date(vehicleInspection.inspectionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => window.open(`/vehicle-inspections/${vehicleInspection.jobId}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Full Inspection
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 text-neutral-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>No vehicle inspection has been created for this job yet.</p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => form.getValues("jobId") ? window.open(`/vehicle-inspections/new?jobId=${form.getValues("jobId")}`, '_blank') : null}
                      disabled={!form.getValues("jobId")}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Create Vehicle Inspection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {existingInvoice && (
              <Card>
                <CardHeader className="bg-neutral-50 p-4">
                  <h3 className="text-lg font-medium">Actions</h3>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Button variant="outline" className="w-full" disabled={!existingInvoice}>
                    <Eye className="h-4 w-4 mr-2" /> Preview Invoice
                  </Button>
                  
                  <Button variant="outline" className="w-full" disabled={!existingInvoice}>
                    <Download className="h-4 w-4 mr-2" /> Save as PDF
                  </Button>
                  
                  <Button 
                    className="w-full" 
                    disabled={!existingInvoice}
                    onClick={handleEmailInvoice}
                  >
                    <Send className="h-4 w-4 mr-2" /> Email to Customer
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => onComplete ? onComplete() : null}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            disabled={isSubmitting}
            onClick={async () => {
              // Manual submit without using the form
              try {
                setIsSubmitting(true);
                const data = form.getValues();
                
                // Validate required fields
                if (!data.jobId) {
                  toast({
                    title: "Error",
                    description: "Please select a job reference",
                    variant: "destructive",
                  });
                  return;
                }
                
                if (!data.customerId) {
                  toast({
                    title: "Error",
                    description: "Please select a customer",
                    variant: "destructive",
                  });
                  return;
                }
                
                if (lineItems.length === 0 || !lineItems[0].description) {
                  toast({
                    title: "Error",
                    description: "Please add at least one item to the invoice",
                    variant: "destructive",
                  });
                  return;
                }
                
                // Prepare the invoice data
                const invoiceData = {
                  ...data,
                  amount: calculations.subtotal,
                  tax: calculations.tax,
                  total: calculations.total,
                  jobId: parseInt(data.jobId.toString()),
                  customerId: parseInt(data.customerId.toString()),
                  lineItems: lineItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total
                  }))
                };
                
                console.log("Manual submit invoice data:", invoiceData);
                
                // Send the data directly
                const response = await fetch('/api/invoices', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify(invoiceData)
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || response.statusText);
                }
                
                const result = await response.json();
                console.log("Invoice created successfully:", result);
                
                queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                toast({
                  title: "Success",
                  description: "Invoice created successfully",
                });
                
                if (onComplete) onComplete();
              } catch (error) {
                console.error("Manual submit error:", error);
                toast({
                  title: "Error",
                  description: `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  variant: "destructive",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {existingInvoice ? "Updating..." : "Creating..."}
              </>
            ) : (
              existingInvoice ? "Update Invoice" : "Create Invoice"
            )}
          </Button>
        </div>
      </form>
      
      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Invoice Email</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <FormLabel>Recipient</FormLabel>
              <Input
                type="email"
                value={emailDetails.recipient}
                onChange={(e) => setEmailDetails({ ...emailDetails, recipient: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Subject</FormLabel>
              <Input
                type="text"
                value={emailDetails.subject}
                onChange={(e) => setEmailDetails({ ...emailDetails, subject: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Message</FormLabel>
              <Textarea
                value={emailDetails.message}
                onChange={(e) => setEmailDetails({ ...emailDetails, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={sendEmail}
              disabled={emailInvoiceMutation.isPending || !emailDetails.recipient || !emailDetails.subject}
            >
              {emailInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
