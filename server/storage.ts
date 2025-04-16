import { 
  users, type User, type InsertUser,
  customers, type Customer, type InsertCustomer,
  jobs, type Job, type InsertJob,
  vehicleInspections, type VehicleInspection, type InsertVehicleInspection,
  invoices, type Invoice, type InsertInvoice,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem
} from "@shared/schema";
import session from "express-session";
import type { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pool } from "./db";

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Storage interface with all CRUD operations
export interface IStorage {
  // Session store
  sessionStore: Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Customer operations
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  getAllCustomers(): Promise<Customer[]>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobByJobId(jobId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, jobData: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  getAllJobs(): Promise<Job[]>;
  getJobsByCustomerId(customerId: number): Promise<Job[]>;
  getJobsByStatus(status: string): Promise<Job[]>;
  
  // Vehicle inspection operations
  getVehicleInspection(id: number): Promise<VehicleInspection | undefined>;
  getVehicleInspectionByJobId(jobId: number): Promise<VehicleInspection | undefined>;
  createVehicleInspection(inspection: InsertVehicleInspection): Promise<VehicleInspection>;
  updateVehicleInspection(id: number, inspectionData: Partial<InsertVehicleInspection>): Promise<VehicleInspection | undefined>;
  deleteVehicleInspection(id: number): Promise<boolean>;
  getAllVehicleInspections(): Promise<VehicleInspection[]>;
  
  // Invoice operations
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getAllInvoices(): Promise<Invoice[]>;
  getInvoicesByCustomerId(customerId: number): Promise<Invoice[]>;
  getInvoicesByJobId(jobId: number): Promise<Invoice[]>;
  getInvoicesByStatus(status: string): Promise<Invoice[]>;
  
  // Invoice item operations
  getInvoiceItem(id: number): Promise<InvoiceItem | undefined>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  getInvoiceItemsByInvoiceId(invoiceId: number): Promise<InvoiceItem[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Customer operations
  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(insertCustomer).returning();
    return result[0];
  }
  
  async updateCustomer(id: number, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }
  
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    try {
      const result = await db.select().from(jobs).where(eq(jobs.id, id));
      if (result[0]) {
        // Add vehicle fields for schema compatibility
        return {
          ...result[0],
          vehicleMake: "",
          vehicleModel: "",
          registrationNumber: ""
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getJob:", error);
      return undefined;
    }
  }
  
  async getJobByJobId(jobId: string): Promise<Job | undefined> {
    try {
      const result = await db.select().from(jobs).where(eq(jobs.jobId, jobId));
      if (result[0]) {
        // Add vehicle fields for schema compatibility
        return {
          ...result[0],
          vehicleMake: "",
          vehicleModel: "",
          registrationNumber: ""
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in getJobByJobId:", error);
      return undefined;
    }
  }
  
  async createJob(insertJob: InsertJob): Promise<Job> {
    try {
      // Filter out vehicle fields that aren't in the DB schema yet
      const { vehicleMake = "", vehicleModel = "", registrationNumber = "", ...jobData } = insertJob as any;
      
      const result = await db.insert(jobs).values(jobData).returning();
      
      // Return the result with the vehicle fields added back
      return {
        ...result[0],
        vehicleMake,
        vehicleModel,
        registrationNumber
      };
    } catch (error) {
      console.error("Error in createJob:", error);
      throw error;
    }
  }
  
  async updateJob(id: number, jobData: Partial<InsertJob>): Promise<Job | undefined> {
    try {
      // Filter out vehicle fields that aren't in the DB schema yet
      const { vehicleMake = "", vehicleModel = "", registrationNumber = "", ...filteredJobData } = jobData as any;
      
      const result = await db.update(jobs)
        .set(filteredJobData)
        .where(eq(jobs.id, id))
        .returning();
        
      if (result[0]) {
        // Return the result with the vehicle fields added back
        return {
          ...result[0],
          vehicleMake,
          vehicleModel,
          registrationNumber
        };
      }
      return undefined;
    } catch (error) {
      console.error("Error in updateJob:", error);
      return undefined;
    }
  }
  
  async deleteJob(id: number): Promise<boolean> {
    await db.delete(jobs).where(eq(jobs.id, id));
    return true;
  }
  
  async getAllJobs(): Promise<Job[]> {
    try {
      const jobResults = await db.select().from(jobs);
      // Add vehicle fields as empty values to avoid client-side errors
      return jobResults.map(job => ({
        ...job,
        vehicleMake: "",
        vehicleModel: "",
        registrationNumber: ""
      }));
    } catch (error) {
      console.error("Error in getAllJobs:", error);
      return [];
    }
  }
  
  async getJobsByCustomerId(customerId: number): Promise<Job[]> {
    try {
      const jobResults = await db.select().from(jobs).where(eq(jobs.customerId, customerId));
      // Add vehicle fields as empty values to avoid client-side errors
      return jobResults.map(job => ({
        ...job,
        vehicleMake: "",
        vehicleModel: "",
        registrationNumber: ""
      }));
    } catch (error) {
      console.error("Error in getJobsByCustomerId:", error);
      return [];
    }
  }
  
  async getJobsByStatus(status: string): Promise<Job[]> {
    try {
      const jobResults = await db.select().from(jobs).where(eq(jobs.status, status));
      // Add vehicle fields as empty values to avoid client-side errors
      return jobResults.map(job => ({
        ...job,
        vehicleMake: "",
        vehicleModel: "",
        registrationNumber: ""
      }));
    } catch (error) {
      console.error("Error in getJobsByStatus:", error);
      return [];
    }
  }
  
  // Vehicle inspection operations
  async getVehicleInspection(id: number): Promise<VehicleInspection | undefined> {
    const result = await db.select().from(vehicleInspections).where(eq(vehicleInspections.id, id));
    return result[0];
  }
  
  async getVehicleInspectionByJobId(jobId: number): Promise<VehicleInspection | undefined> {
    const result = await db.select().from(vehicleInspections).where(eq(vehicleInspections.jobId, jobId));
    return result[0];
  }
  
  async createVehicleInspection(insertInspection: InsertVehicleInspection): Promise<VehicleInspection> {
    const result = await db.insert(vehicleInspections).values(insertInspection).returning();
    return result[0];
  }
  
  async updateVehicleInspection(id: number, inspectionData: Partial<InsertVehicleInspection>): Promise<VehicleInspection | undefined> {
    const result = await db.update(vehicleInspections)
      .set(inspectionData)
      .where(eq(vehicleInspections.id, id))
      .returning();
    return result[0];
  }
  
  async deleteVehicleInspection(id: number): Promise<boolean> {
    await db.delete(vehicleInspections).where(eq(vehicleInspections.id, id));
    return true;
  }
  
  async getAllVehicleInspections(): Promise<VehicleInspection[]> {
    return await db.select().from(vehicleInspections);
  }
  
  // Invoice operations
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }
  
  async getInvoiceByInvoiceNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return result[0];
  }
  
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }
  
  async updateInvoice(id: number, invoiceData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }
  
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }
  
  async getInvoicesByCustomerId(customerId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.customerId, customerId));
  }
  
  async getInvoicesByJobId(jobId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.jobId, jobId));
  }
  
  async getInvoicesByStatus(status: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.status, status));
  }
  
  // Invoice item operations
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const result = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    
    if (!result[0]) return undefined;
    
    // Process item to ensure numeric values
    const processedItem = {
      ...result[0],
      quantity: Number(result[0].quantity) || 1,
      unitPrice: Number(result[0].unitPrice) || 0,
      total: Number(result[0].total) || 0,
      quantityType: 'number',
      unitPriceType: 'number',
      totalType: 'number'
    };
    
    return processedItem;
  }
  
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    // Ensure numeric values are properly parsed
    const itemWithParsedNumericValues = {
      ...insertItem,
      quantity: Number(insertItem.quantity) || 1,
      unitPrice: Number(insertItem.unitPrice) || 0,
      total: Number(insertItem.total) || 0
    };
    
    console.log("Creating invoice item with parsed numeric values:", itemWithParsedNumericValues);
    
    const result = await db.insert(invoiceItems).values(itemWithParsedNumericValues).returning();
    return result[0];
  }
  
  async updateInvoiceItem(id: number, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    // Ensure numeric values are properly parsed
    const processedItemData: Partial<InsertInvoiceItem> = { ...itemData };
    
    // Only process fields that exist in the update data
    if (itemData.quantity !== undefined) {
      processedItemData.quantity = Number(itemData.quantity) || 1;
    }
    
    if (itemData.unitPrice !== undefined) {
      processedItemData.unitPrice = Number(itemData.unitPrice) || 0;
    }
    
    if (itemData.total !== undefined) {
      processedItemData.total = Number(itemData.total) || 0;
    }
    
    console.log("Updating invoice item with parsed numeric values:", processedItemData);
    
    const result = await db.update(invoiceItems)
      .set(processedItemData)
      .where(eq(invoiceItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return true;
  }
  
  async getInvoiceItemsByInvoiceId(invoiceId: number): Promise<InvoiceItem[]> {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    
    // Process all items to ensure numeric values
    const processedItems = items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: Number(item.total) || 0,
      quantityType: 'number',
      unitPriceType: 'number',
      totalType: 'number'
    }));
    
    console.log("Found", items.length, "line items for invoice", invoiceId);
    console.log("Line items details:", processedItems);
    
    return processedItems;
  }
}

export const storage = new DatabaseStorage();