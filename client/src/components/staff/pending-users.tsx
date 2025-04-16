import { useState } from "react";
import { User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PendingUsers() {
  const { toast } = useToast();
  const [userToReject, setUserToReject] = useState<User | null>(null);
  
  // Query pending users
  const { data: pendingUsers, isLoading, error } = useQuery({
    queryKey: ["/api/users/pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/pending");
      return res.json();
    },
  });
  
  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "User approved",
        description: "User account has been approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "User rejected",
        description: "User account has been rejected and removed",
      });
      setUserToReject(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject user: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleApprove = (user: User) => {
    approveMutation.mutate(user.id);
  };
  
  const handleReject = (user: User) => {
    rejectMutation.mutate(user.id);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Error loading pending users: {error.message}</p>
      </div>
    );
  }
  
  if (!pendingUsers || pendingUsers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Pending Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <p>No pending user approval requests</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          Pending Approval Requests
          <Badge variant="outline" className="ml-2">
            {pendingUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Date Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "destructive" : "default"}>
                    {user.role === "admin" ? "Administrator" : "Staff"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleApprove(user)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setUserToReject(user)}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!userToReject} onOpenChange={(open) => !open && setUserToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for {userToReject?.fullName}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => userToReject && handleReject(userToReject)}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Rejecting...
                </>
              ) : (
                "Reject Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}