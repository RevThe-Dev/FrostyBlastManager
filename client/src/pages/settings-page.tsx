import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Loader2, 
  Save, 
  Globe, 
  Mail, 
  BellRing, 
  Shield, 
  Building, 
  Palette, 
  User, 
  Sun, 
  Moon, 
  SmartphoneIcon 
} from "lucide-react";

const companyFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional(),
  website: z.string().url("Please enter a valid URL").optional(),
  vatNumber: z.string().optional(),
  logo: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  newJobNotifications: z.boolean().default(true),
  invoiceNotifications: z.boolean().default(true),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings, updateSettings } = useCompanySettings();
  const [activeTab, setActiveTab] = useState("companyProfile");

  // Company profile form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: settings,
  });
  
  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      companyForm.reset(settings);
    }
  }, [settings, companyForm]);

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notifications form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      newJobNotifications: true,
      invoiceNotifications: true,
    },
  });

  // Company settings mutation - using global company settings context
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      // Use the updateSettings function from the company settings hook
      updateSettings(data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Company profile has been updated successfully. Changes will be reflected across the application.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update company profile: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      // This would be an API call in a real implementation
      // await apiRequest("PUT", "/api/user/password", data);
      return new Promise<void>((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update password: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      // This would be an API call in a real implementation
      // await apiRequest("PUT", "/api/settings/notifications", data);
      return new Promise<void>((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Notification preferences have been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update notification settings: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onSubmitCompany = (data: CompanyFormValues) => {
    updateCompanyMutation.mutate(data);
  };

  const onSubmitSecurity = (data: SecurityFormValues) => {
    updateSecurityMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-neutral-800">System Settings</h2>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <TabsTrigger value="companyProfile" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Company Profile</span>
              <span className="sm:hidden">Company</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <BellRing className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="userProfile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>My Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Profile Tab */}
          <TabsContent value="companyProfile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details. This information will appear on invoices and other documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...companyForm}>
                  <form id="company-form" onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ""}
                              rows={3} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-neutral-500" />
                                <Input {...field} value={field.value || ""} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="vatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  form="company-form" 
                  disabled={updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending ? (
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
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-primary">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 rounded-md bg-primary p-4 text-white">Theme Preview</div>
                      <h3 className="font-medium">Default Theme</h3>
                      <p className="text-sm text-neutral-500">Current theme</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="opacity-50 hover:opacity-100 transition-opacity">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 rounded-md bg-blue-600 p-4 text-white">Theme Preview</div>
                      <h3 className="font-medium">Blue Theme</h3>
                      <p className="text-sm text-neutral-500">Coming soon</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="opacity-50 hover:opacity-100 transition-opacity">
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 rounded-md bg-green-600 p-4 text-white">Theme Preview</div>
                      <h3 className="font-medium">Green Theme</h3>
                      <p className="text-sm text-neutral-500">Coming soon</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-md font-medium mb-3">Color Mode</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="justify-start" disabled>
                      <Sun className="h-4 w-4 mr-2" />
                      Light Mode
                    </Button>
                    <Button variant="outline" className="justify-start" disabled>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark Mode (Coming Soon)
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-neutral-500">More appearance options are coming soon.</p>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about various events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form id="notification-form" onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Notification Channels</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="pt-6">
                          <CardContent className="pb-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-5 w-5 text-neutral-500" />
                                <div>
                                  <h4 className="font-medium">Email Notifications</h4>
                                  <p className="text-sm text-neutral-500">Get notified via email</p>
                                </div>
                              </div>
                              <FormField
                                control={notificationForm.control}
                                name="emailNotifications"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="pt-6">
                          <CardContent className="pb-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <SmartphoneIcon className="h-5 w-5 text-neutral-500" />
                                <div>
                                  <h4 className="font-medium">SMS Notifications</h4>
                                  <p className="text-sm text-neutral-500">Get notified via SMS</p>
                                </div>
                              </div>
                              <FormField
                                control={notificationForm.control}
                                name="smsNotifications"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Separator />
                      
                      <h3 className="text-md font-medium">Notification Types</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">New Job Assignments</h4>
                            <p className="text-sm text-neutral-500">Get notified when a new job is created</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="newJobNotifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Invoice Updates</h4>
                            <p className="text-sm text-neutral-500">Get notified about invoice status changes</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="invoiceNotifications"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  form="notification-form" 
                  disabled={updateNotificationsMutation.isPending}
                >
                  {updateNotificationsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Update your password and manage security settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form id="security-form" onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  type="submit" 
                  form="security-form" 
                  disabled={updateSecurityMutation.isPending}
                >
                  {updateSecurityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* User Profile Tab */}
          <TabsContent value="userProfile">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  View and update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary text-white">
                      {user?.fullName.split(' ').map(name => name[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{user?.fullName}</h3>
                    <p className="text-neutral-500">{user?.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Username</h4>
                    <p>{user?.username}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Email</h4>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Role</h4>
                    <p className="capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-1">Member Since</h4>
                    <p>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-neutral-500">To update your personal information, please contact your administrator.</p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}