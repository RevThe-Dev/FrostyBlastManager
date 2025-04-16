import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  SearchIcon, 
  PlusIcon, 
  UserIcon, 
  MailIcon, 
  Pencil, 
  Trash2, 
  ShieldIcon,
  Clock 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";
import { StaffForm } from "@/components/staff/staff-form";
import { PendingUsers } from "@/components/staff/pending-users";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription 
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewStaffDialog, setShowNewStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("staff");
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";
  
  // Fetch staff members
  const { data: staffMembers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/staff"],
    enabled: isAdmin, // Only fetch if user is admin
  });
  
  // Fetch pending users that need approval
  const { data: pendingUsers, isLoading: isPendingLoading } = useQuery<User[]>({
    queryKey: ["/api/users/pending"],
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: number) => {
      await apiRequest("DELETE", `/api/staff/${staffId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Staff member deleted",
        description: "The staff member has been successfully removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter staff based on search term
  const filteredStaff = staffMembers?.filter(staff => 
    staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStaff = (staff: User) => {
    setEditingStaff(staff);
  };

  const handleDeleteStaff = (staffId: number) => {
    deleteStaffMutation.mutate(staffId);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  if (!isAdmin) {
    return (
      <AppShell title="Staff Management">
        <div className="flex flex-col items-center justify-center h-64">
          <ShieldIcon className="h-12 w-12 text-neutral-300 mb-4" />
          <h2 className="text-xl font-medium text-neutral-800 mb-2">Access Restricted</h2>
          <p className="text-neutral-600">You need administrator permissions to view this page.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Staff Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-800">Staff Management</h2>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search staff..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={showNewStaffDialog} onOpenChange={setShowNewStaffDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                  <DialogDescription>
                    Create a new account for staff access
                  </DialogDescription>
                </DialogHeader>
                <StaffForm 
                  onComplete={() => setShowNewStaffDialog(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Tabs for switching between staff and pending approvals */}
        <Tabs defaultValue="staff" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Staff Members
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Approvals
              {pendingUsers && pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-2 py-0 text-xs">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Edit Staff Dialog */}
          <Dialog 
            open={!!editingStaff} 
            onOpenChange={(open) => !open && setEditingStaff(null)}
          >
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Staff Member</DialogTitle>
                <DialogDescription>
                  Update staff details and permissions
                </DialogDescription>
              </DialogHeader>
              {editingStaff && (
                <StaffForm 
                  staff={editingStaff} 
                  onComplete={() => setEditingStaff(null)} 
                />
              )}
            </DialogContent>
          </Dialog>
          
          {/* Staff Members Tab */}
          <TabsContent value="staff">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-10">
                  <p>Loading staff members...</p>
                </div>
              ) : filteredStaff && filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <Card key={staff.id} className="overflow-hidden">
                    <CardHeader className="bg-neutral-50 p-4 flex flex-row justify-between items-center">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-primary text-white">
                            {getInitials(staff.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-lg">{staff.fullName}</h3>
                          <p className="text-sm text-neutral-600">@{staff.username}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditStaff(staff)}
                          disabled={staff.id === currentUser?.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={staff.id === currentUser?.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {staff.fullName} from your staff list.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeleteStaff(staff.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <MailIcon className="h-4 w-4 mr-2 text-neutral-500" />
                        <a 
                          href={`mailto:${staff.email}`} 
                          className="text-sm text-primary hover:underline"
                        >
                          {staff.email}
                        </a>
                      </div>
                      <div className="flex items-center mb-2">
                        <UserIcon className="h-4 w-4 mr-2 text-neutral-500" />
                        <span className="text-sm">
                          Role: <Badge variant={staff.role === "admin" ? "default" : "outline"}>
                            {staff.role === "admin" ? "Administrator" : "Staff"}
                          </Badge>
                        </span>
                      </div>
                      <div className="text-sm text-neutral-600 mt-2">
                        <p>Created: {new Date(staff.createdAt).toLocaleDateString()}</p>
                      </div>
                      {staff.id === currentUser?.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <p className="text-sm text-neutral-600 italic">This is your account</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex justify-center py-10">
                  <p className="text-neutral-600">
                    {searchTerm 
                      ? "No staff members match your search" 
                      : "No staff members found. Add staff members to give them access to the system."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Pending Approvals Tab */}
          <TabsContent value="pending">
            <PendingUsers />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}