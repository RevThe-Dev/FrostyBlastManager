import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVehicleInspectionSchema, Job, VehicleInspection, Invoice, Customer } from "@shared/schema";
import { useCompanySettings } from "@/hooks/use-company-settings";
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
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { PhotoUpload } from "@/components/vehicle/photo-upload";
import { SignaturePad } from "@/components/vehicle/signature-pad";
import { useSignature } from "@/hooks/use-signature";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the schema for validation
const inspectionFormSchema = insertVehicleInspectionSchema.extend({
  photos: z.any().optional(),
  customerSignature: z.string().min(1, "Customer signature is required"),
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

interface InspectionFormProps {
  job?: Job;
  existingInspection?: VehicleInspection;
  isNewInspection?: boolean;
}

export function InspectionForm({ job, existingInspection, isNewInspection = true }: InspectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
    job?.customerId ? job.customerId.toString() : undefined
  );
  const { toast } = useToast();
  const [photos, setPhotos] = useState<File[]>([]);
  const { signatureRef, signatureURL, clearSignature, saveSignature, isSignatureEmpty } = useSignature();
  const { settings } = useCompanySettings();
  
  // Fetch invoices linked to this job if job exists
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", { jobId: job?.id }],
    enabled: !!job?.id
  });
  
  // Fetch customers for dropdown
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Initialize form with default values
  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      jobId: job?.id || existingInspection?.jobId || 0,
      vehicleMake: existingInspection?.vehicleMake || "",
      vehicleModel: existingInspection?.vehicleModel || "",
      registrationNumber: existingInspection?.registrationNumber || "",
      mileage: existingInspection?.mileage || 0,
      fuelLevel: existingInspection?.fuelLevel || 50,
      damageDescription: existingInspection?.damageDescription ?? "",
      photos: existingInspection?.photos || [],
      customerName: existingInspection?.customerName || "",
      customerSignature: existingInspection?.customerSignature || "",
      inspectedBy: existingInspection?.inspectedBy || 0, // Will be set on the server
    },
  });
  
  // Create vehicle inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/vehicle-inspections", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-inspections"] });
      toast({
        title: "Success",
        description: "Vehicle inspection saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save inspection: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update vehicle inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: FormData }) => {
      const res = await fetch(`/api/vehicle-inspections/${id}`, {
        method: "PUT",
        body: data,
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-inspections"] });
      toast({
        title: "Success",
        description: "Vehicle inspection updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update inspection: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (values: InspectionFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Save the signature if not empty
      if (isSignatureEmpty() && !values.customerSignature) {
        toast({
          title: "Error",
          description: "Customer signature is required",
          variant: "destructive",
        });
        return;
      }
      
      // Get the signature data URL if there's a signature
      const signatureDataUrl = saveSignature() || values.customerSignature;
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add all fields to the FormData
      Object.entries(values).forEach(([key, value]) => {
        if (key !== 'photos' && key !== 'customerSignature') {
          formData.append(key, value.toString());
        }
      });
      
      // Add the signature
      formData.append('customerSignature', signatureDataUrl);
      
      // Add selected customer ID if available
      if (selectedCustomerId) {
        formData.append('customerId', selectedCustomerId);
      }
      
      // Add photos if any
      photos.forEach(photo => {
        formData.append('photos', photo);
      });
      
      if (existingInspection && !isNewInspection) {
        // Update existing inspection
        await updateInspectionMutation.mutateAsync({ 
          id: existingInspection.id, 
          data: formData 
        });
      } else {
        // Create new inspection
        await createInspectionMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePhotosChange = (newPhotos: File[]) => {
    setPhotos(newPhotos);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Job & Vehicle Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job ID</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={job?.jobId || `Job #${field.value}`} 
                          readOnly 
                          className="bg-neutral-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="form-item">
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    readOnly
                    className="bg-neutral-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="form-item">
                  <FormLabel>Customer</FormLabel>
                  {isNewInspection ? (
                    <Select
                      onValueChange={(value) => {
                        setSelectedCustomerId(value);
                        const selectedCustomer = customers?.find(c => c.id.toString() === value);
                        if (selectedCustomer) {
                          form.setValue('customerName', selectedCustomer.name);
                        }
                      }}
                      value={selectedCustomerId}
                      defaultValue={job?.customerId?.toString()}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      value={
                        job && job.customerId 
                          ? customers?.find(c => c.id === job.customerId)?.name || `Customer #${job.customerId}`
                          : existingInspection && existingInspection.customerId
                            ? customers?.find(c => c.id === existingInspection.customerId)?.name || `Customer #${existingInspection.customerId}`
                            : "N/A"
                      }
                      readOnly
                      className="bg-neutral-50"
                    />
                  )}
                </div>
                
                <div className="form-item">
                  <FormLabel>Location</FormLabel>
                  <Input
                    type="text"
                    value={job?.location || settings.address}
                    readOnly
                    className="bg-neutral-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Make</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter make" disabled={!isNewInspection} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter model" disabled={!isNewInspection} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Vehicle Condition</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="AB12 CDE" disabled={!isNewInspection} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Mileage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="Enter mileage" 
                          disabled={!isNewInspection}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="damageDescription"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Damage Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""}
                        placeholder="Describe any existing damage to the vehicle" 
                        rows={4}
                        disabled={!isNewInspection}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fuelLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Level</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-3">
                        <Slider
                          value={[field.value]}
                          min={0}
                          max={100}
                          step={12.5}
                          onValueChange={(value) => field.onChange(value[0])}
                          disabled={!isNewInspection}
                          className="flex-1"
                        />
                        <span className="text-sm text-neutral-600 w-12">{field.value}%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Photo Documentation</h3>
              
              <PhotoUpload 
                onPhotosChange={handlePhotosChange} 
                existingPhotos={existingInspection?.photos as any[]} 
                disabled={!isNewInspection}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Customer Acknowledgment</h3>
              
              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-2">
                  By signing below, the customer acknowledges the existing damage and condition of the vehicle as documented above and agrees that {settings.companyName} is not liable for any pre-existing damage.
                </p>
                
                <div className="bg-neutral-50 p-3 rounded-md border border-neutral-300">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter full name" 
                            disabled={!isNewInspection}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customerSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Signature</FormLabel>
                        <FormControl>
                          <SignaturePad 
                            ref={signatureRef}
                            existingSignature={field.value}
                            onChange={(value) => field.onChange(value)}
                            disabled={!isNewInspection}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {isNewInspection && (
                    <div className="flex justify-end mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={clearSignature}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isNewInspection && (
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Inspection"
              )}
            </Button>
          </div>
        )}
        
        {/* Related invoices section */}
        {!isNewInspection && invoices && invoices.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Related Invoices</h3>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="p-3 bg-neutral-50 rounded-md border border-neutral-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-neutral-500">
                      Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-neutral-500">
                      Amount: ${invoice.total.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')}
                  >
                    View Invoice
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
