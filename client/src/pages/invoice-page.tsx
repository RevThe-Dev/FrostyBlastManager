import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlusIcon, ArrowLeftIcon, FileSearchIcon } from "lucide-react";
import { Invoice } from "@shared/schema";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function InvoicePage() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const invoiceId = params.id && !isNaN(parseInt(params.id)) ? parseInt(params.id) : undefined;
  
  // Immediately redirect if we have an invalid invoice ID
  useEffect(() => {
    if (params.id && isNaN(parseInt(params.id))) {
      console.log("Invalid invoice ID, redirecting to invoice list");
      navigate("/invoices");
    }
  }, [params.id, navigate]);
  
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all invoices for the list view
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !invoiceId, // Only fetch when not in detail view
  });

  // Fetch single invoice for detail view
  const { data: invoice, isLoading: isLoadingInvoice, error: invoiceError } = useQuery<Invoice & { lineItems: any[] }>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error("Invoice ID is required");
      
      console.log("Fetching invoice details for ID:", invoiceId);
      
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch invoice");
      }
      
      return res.json();
    },
    enabled: !!invoiceId, // Only fetch when in detail view
  });
  
  // Log for debugging
  console.log("Invoice ID:", invoiceId);
  console.log("Invoice data:", invoice);
  console.log("Invoice error:", invoiceError);

  // Filter invoices based on search term
  const filteredInvoices = invoices?.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell title="Invoices">
      {!invoiceId ? (
        // Invoice List View
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-neutral-800">Invoices</h2>
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-64">
                <FileSearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Fill in the invoice details below to create a new invoice. Select a job and add items.
                    </DialogDescription>
                  </DialogHeader>
                  <InvoiceForm onComplete={() => setShowNewInvoiceDialog(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Job Reference</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices && filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium text-primary">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>Job #{inv.jobId}</TableCell>
                      <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>£{inv.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      {searchTerm ? "No matching invoices found" : "No invoices found. Create your first invoice."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      ) : (
        // Invoice Detail View
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-800">
              Invoice {invoice?.invoiceNumber}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Invoices
            </Button>
          </div>
          
          <Card className="p-6">
            {invoice ? (
              <InvoiceForm 
                existingInvoice={invoice} 
                onComplete={() => navigate("/invoices")}
              />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p>Loading invoice details...</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Paid</Badge>;
  } else if (status === "overdue") {
    return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">Overdue</Badge>;
  } else if (status === "pending") {
    return <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100">Pending</Badge>;
  } else {
    return <Badge className="bg-neutral-100 text-neutral-600 hover:bg-neutral-100">Draft</Badge>;
  }
}
