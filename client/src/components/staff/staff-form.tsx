import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertUserSchema, User } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";

// Extend schema for validation and new staff creation
const staffFormSchema = insertUserSchema.extend({
  // Make password optional for updates
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If we're creating a new user (password is required) or if password is provided during update
  if ((data.password && !data.confirmPassword) || (!data.password && data.confirmPassword)) {
    return false;
  }
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  staff?: User;
  onComplete?: () => void;
}

export function StaffForm({ staff, onComplete }: StaffFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: staff?.username || "",
      password: "",
      confirmPassword: "",
      email: staff?.email || "",
      fullName: staff?.fullName || "",
      role: staff?.role || "staff",
    },
  });
  
  // Create staff mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      // Remove confirmPassword before sending to the API
      const { confirmPassword, ...staffData } = data;
      const res = await apiRequest("POST", "/api/staff", staffData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      toast({
        title: "Staff Registration Submitted",
        description: data.message || "Staff member created successfully. New accounts require admin approval before they can be used.",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (data: StaffFormValues & { id: number }) => {
      const { id, confirmPassword, ...staffData } = data;
      
      // If password is empty, remove it from the update data
      if (!staffData.password) {
        delete staffData.password;
      }
      
      const res = await apiRequest("PUT", `/api/staff/${id}`, staffData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      if (staff) {
        // Update existing staff
        await updateStaffMutation.mutateAsync({ ...data, id: staff.id });
      } else {
        // Create new staff
        await createStaffMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!staff && (
          <div className="bg-yellow-50 p-3 rounded-md mb-4 text-sm text-yellow-800 border border-yellow-200">
            <div className="font-medium mb-1 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              New accounts require approval
            </div>
            <p>After registration, your account will need to be approved by an administrator before you can log in and access the system.</p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter full name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="staff@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Enter username" 
                    readOnly={!!staff}
                    className={staff ? "bg-neutral-50" : ""}
                  />
                </FormControl>
                {staff && (
                  <FormDescription>
                    Username cannot be changed after creation
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{staff ? "New Password (Optional)" : "Password"}</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    placeholder={staff ? "Leave blank to keep current" : "Enter password"} 
                  />
                </FormControl>
                {staff && (
                  <FormDescription>
                    Leave blank to keep current password
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    placeholder="Confirm password" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Administrators have full access to manage staff, jobs, and system settings
              </FormDescription>
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
                {staff ? "Updating..." : "Creating..."}
              </>
            ) : (
              staff ? "Update Staff Member" : "Add Staff Member"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
