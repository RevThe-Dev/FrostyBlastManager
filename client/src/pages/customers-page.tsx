import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, PlusIcon, MailIcon, PhoneIcon, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Customer } from "@shared/schema";
import { CustomerForm } from "@/components/customers/customer-form";
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

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  
  // Fetch customers
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      await apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter customers based on search term
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleDeleteCustomer = (customerId: number) => {
    deleteCustomerMutation.mutate(customerId);
  };

  return (
    <AppShell title="Customers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-800">Customers</h2>
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Enter the customer details below
                  </DialogDescription>
                </DialogHeader>
                <CustomerForm 
                  onComplete={() => setShowNewCustomerDialog(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Edit Customer Dialog */}
        <Dialog 
          open={!!editingCustomer} 
          onOpenChange={(open) => !open && setEditingCustomer(null)}
        >
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update the customer details below
              </DialogDescription>
            </DialogHeader>
            {editingCustomer && (
              <CustomerForm 
                customer={editingCustomer} 
                onComplete={() => setEditingCustomer(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
        
        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <p>Loading customers...</p>
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="overflow-hidden">
                <CardHeader className="bg-neutral-50 p-4 flex flex-row justify-between items-center">
                  <h3 className="font-medium text-lg">{customer.name}</h3>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {customer.name} from your customers list.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {customer.email && (
                    <div className="flex items-center mb-2">
                      <MailIcon className="h-4 w-4 mr-2 text-neutral-500" />
                      <a 
                        href={`mailto:${customer.email}`} 
                        className="text-sm text-primary hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center mb-2">
                      <PhoneIcon className="h-4 w-4 mr-2 text-neutral-500" />
                      <a 
                        href={`tel:${customer.phone}`} 
                        className="text-sm"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.address && (
                    <div className="text-sm text-neutral-600 mt-2">
                      <div className="ml-6">{customer.address}</div>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <p className="text-sm text-neutral-600">{customer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex justify-center py-10">
              <p className="text-neutral-600">
                {searchTerm 
                  ? "No customers match your search" 
                  : "No customers found. Add your first customer to get started."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
