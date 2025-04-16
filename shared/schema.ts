import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USER SCHEMA
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs, { relationName: "user_jobs" }),
  vehicleInspections: many(vehicleInspections),
  invoices: many(invoices),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// CUSTOMER SCHEMA
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const customersRelations = relations(customers, ({ many }) => ({
  jobs: many(jobs),
  invoices: many(invoices),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
});

// JOB SCHEMA
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
  // Vehicle information
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  registrationNumber: text("registration_number"),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
    relationName: "user_jobs"
  }),
  vehicleInspection: one(vehicleInspections),
  invoices: many(invoices),
}));

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true
});

// VEHICLE INSPECTION SCHEMA
export const vehicleInspections = pgTable("vehicle_inspections", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  customerId: integer("customer_id"),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  registrationNumber: text("registration_number").notNull(),
  mileage: integer("mileage").notNull(),
  fuelLevel: integer("fuel_level").notNull(),
  damageDescription: text("damage_description"),
  photos: jsonb("photos"),
  customerName: text("customer_name").notNull(),
  customerSignature: text("customer_signature").notNull(),
  inspectedBy: integer("inspected_by").notNull(),
  inspectionDate: timestamp("inspection_date").defaultNow().notNull(),
});

export const vehicleInspectionsRelations = relations(vehicleInspections, ({ one }) => ({
  job: one(jobs, {
    fields: [vehicleInspections.jobId],
    references: [jobs.id],
  }),
  customer: one(customers, {
    fields: [vehicleInspections.customerId],
    references: [customers.id],
  }),
  inspector: one(users, {
    fields: [vehicleInspections.inspectedBy],
    references: [users.id],
  }),
}));

export const insertVehicleInspectionSchema = createInsertSchema(vehicleInspections).omit({
  id: true
});

// INVOICE SCHEMA
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  jobId: integer("job_id").notNull(),
  customerId: integer("customer_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  tax: doublePrecision("tax").notNull(),
  total: doublePrecision("total").notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  notes: text("notes"),
  paymentTerms: text("payment_terms").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("draft"),
  createdBy: integer("created_by").notNull(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  lineItems: many(invoiceItems),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true
});

// INVOICE LINE ITEMS SCHEMA
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  total: doublePrecision("total").notNull(),
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true
});

// EXPORT TYPES
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertVehicleInspection = z.infer<typeof insertVehicleInspectionSchema>;
export type VehicleInspection = typeof vehicleInspections.$inferSelect;

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
