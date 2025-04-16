import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Job, Invoice, Customer } from "@shared/schema";
import { CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch data for reports
  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });
  
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  
  // Calculate statistics
  const totalJobs = jobs?.length || 0;
  const completedJobs = jobs?.filter(job => job.status === "completed").length || 0;
  const pendingInvoices = invoices?.filter(invoice => invoice.status === "pending").length || 0;
  const totalRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0;
  
  // Data for job status chart
  const jobStatusData = [
    { name: "Scheduled", value: jobs?.filter(job => job.status === "scheduled").length || 0 },
    { name: "In Progress", value: jobs?.filter(job => job.status === "in-progress").length || 0 },
    { name: "Completed", value: completedJobs },
    { name: "Canceled", value: jobs?.filter(job => job.status === "canceled").length || 0 }
  ];
  
  // Data for monthly revenue (sample data - would be calculated from real invoices)
  const monthlyRevenueData = [
    { name: "Jan", revenue: 4200 },
    { name: "Feb", revenue: 5800 },
    { name: "Mar", revenue: 6000 },
    { name: "Apr", revenue: 8100 },
    { name: "May", revenue: 7400 },
    { name: "Jun", revenue: 9600 },
    { name: "Jul", revenue: 8500 },
    { name: "Aug", revenue: 7300 },
    { name: "Sep", revenue: 9100 },
    { name: "Oct", revenue: 10400 },
    { name: "Nov", revenue: 11200 },
    { name: "Dec", revenue: 9800 },
  ];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#FFBB28', '#00C49F', '#FF8042'];
  
  return (
    <AppShell title="Reports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-800">Business Reports</h2>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {completedJobs} completed ({totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Active Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
              <p className="text-xs text-neutral-500 mt-1">
                Total registered customers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Pending Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingInvoices}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {invoices?.length || 0} total invoices
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{totalRevenue.toLocaleString('en-UK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-neutral-500 mt-1">
                All time revenue
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyRevenueData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`£${value}`, 'Revenue']}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3498db" name="Monthly Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={jobStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {jobStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Jobs']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Customer Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', customers: 5 },
                          { month: 'Feb', customers: 8 },
                          { month: 'Mar', customers: 10 },
                          { month: 'Apr', customers: 14 },
                          { month: 'May', customers: 15 },
                          { month: 'Jun', customers: 18 },
                          { month: 'Jul', customers: 20 },
                          { month: 'Aug', customers: 22 },
                          { month: 'Sep', customers: 25 },
                          { month: 'Oct', customers: 28 },
                          { month: 'Nov', customers: 30 },
                          { month: 'Dec', customers: 32 }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="customers"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          name="Customers"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Job Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-neutral-600">Detailed job reports are being developed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-neutral-600">Detailed invoice reports are being developed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-neutral-600">Customer insights are being developed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}