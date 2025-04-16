import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Mail, Phone, BadgeCheck, Calendar, ArrowUpToLine } from "lucide-react";

const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: "",
      jobTitle: user?.role === "admin" ? "Administrator" : "Staff Member"
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/user/${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    
    const nameParts = user.fullName.split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <AppShell title="Your Profile">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-neutral-800">Your Profile</h2>
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Information Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                View and update your profile information
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                <Form {...profileForm}>
                  <form id="profile-form" onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg bg-primary text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-lg">{user?.fullName}</h3>
                      <p className="text-neutral-500">{user?.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Email</p>
                        <p>{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Phone</p>
                        <p>{profileForm.getValues().phone || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <BadgeCheck className="h-4 w-4 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Role</p>
                        <p className="capitalize">{user?.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-3 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-500">Member Since</p>
                        <p>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="profile-form" 
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Account Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Recent Activity</h3>
                <ul className="space-y-3">
                  <li className="text-sm">
                    <div className="flex">
                      <ArrowUpToLine className="h-4 w-4 mr-2 text-green-500" />
                      <span>Logged in</span>
                    </div>
                    <p className="text-xs text-neutral-500 ml-6">
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </p>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Account Information</h3>
                <p className="text-sm">Username: <span className="font-medium">{user?.username}</span></p>
                <p className="text-sm mt-1">Last password change: <span className="font-medium">Never</span></p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="text-sm px-0" onClick={() => window.location.href = "/settings"}>
                Go to Settings for more options
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}