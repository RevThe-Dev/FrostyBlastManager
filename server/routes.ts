import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import multer from "multer";
import { 
  insertCustomerSchema, 
  insertJobSchema, 
  insertVehicleInspectionSchema, 
  insertInvoiceSchema, 
  insertInvoiceItemSchema,
  type VehicleInspection
} from "@shared/schema";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

// Configure storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Setup email transport (using ethereal for development)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
    pass: process.env.EMAIL_PASS || 'etherealpass'
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Add a route to create a default admin user if needed
  app.get("/api/setup-admin", async (req, res, next) => {
    try {
      // Don't serve HTML for API endpoints
      res.setHeader('Content-Type', 'application/json');
      
      const { hashPassword } = await import("./auth");
      
      // Check if admin exists
      const existingAdmin = await storage.getUserByUsername("admin");
      
      if (existingAdmin) {
        return res.status(200).json({ message: "Admin user already exists" });
      }
      
      // Create admin user
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin"),
        email: "admin@frostys.com",
        fullName: "Administrator",
        role: "admin"
      });
      
      res.status(201).json({ message: "Admin user created successfully", admin });
    } catch (error) {
      console.error("Error creating admin:", error);
      next(error);
    }
  });

  // CUSTOMER ROUTES
  app.get("/api/customers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/customers", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const customerId = parseInt(req.params.id);
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      
      const updatedCustomer = await storage.updateCustomer(customerId, validatedData);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(updatedCustomer);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/customers/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const customerId = parseInt(req.params.id);
      const success = await storage.deleteCustomer(customerId);
      
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // JOB ROUTES
  app.get("/api/jobs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Filter by status if provided
      const status = req.query.status as string | undefined;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      let jobs;
      if (status) {
        jobs = await storage.getJobsByStatus(status);
      } else if (customerId) {
        jobs = await storage.getJobsByCustomerId(customerId);
      } else {
        jobs = await storage.getAllJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/jobs", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Convert date strings to Date objects
      const formattedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        createdBy: req.user!.id
      };
      
      const validatedData = insertJobSchema.parse(formattedData);
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/jobs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const jobId = parseInt(req.params.id);
      
      // Convert date strings to Date objects
      const formattedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const validatedData = insertJobSchema.partial().parse(formattedData);
      
      const updatedJob = await storage.updateJob(jobId, validatedData);
      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(updatedJob);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/jobs/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const jobId = parseInt(req.params.id);
      const success = await storage.deleteJob(jobId);
      
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // VEHICLE INSPECTION ROUTES
  app.get("/api/vehicle-inspections", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      console.log("GET /api/vehicle-inspections query params:", req.query);
      
      let inspections: VehicleInspection[] = [];
      
      // Check if jobId is provided
      if (req.query.jobId) {
        const jobIdStr = req.query.jobId as string;
        
        // Validate jobId
        if (!jobIdStr || jobIdStr === 'undefined' || jobIdStr === 'null') {
          console.log("Invalid jobId parameter:", jobIdStr);
          return res.json([]);
        }
        
        const jobId = parseInt(jobIdStr);
        
        if (isNaN(jobId)) {
          console.log("JobId is not a number:", jobIdStr);
          return res.json([]);
        }
        
        console.log("Looking for vehicle inspection with jobId:", jobId);
        
        try {
          const inspection = await storage.getVehicleInspectionByJobId(jobId);
          
          if (inspection) {
            console.log("Found inspection for jobId:", jobId);
            inspections = [inspection];
          } else {
            console.log("No inspection found for jobId:", jobId);
            inspections = [];
          }
        } catch (err) {
          console.error("Error finding inspection by jobId:", err);
          return res.json([]);
        }
      } else {
        console.log("Getting all inspections");
        inspections = await storage.getAllVehicleInspections();
      }
      
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching vehicle inspections:", error);
      next(error);
    }
  });

  app.get("/api/vehicle-inspections/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const inspectionId = parseInt(req.params.id);
      const inspection = await storage.getVehicleInspection(inspectionId);
      
      if (!inspection) {
        return res.status(404).json({ message: "Vehicle inspection not found" });
      }
      
      res.json(inspection);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vehicle-inspections", upload.array("photos", 4), async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Process photos if uploaded
      const files = req.files as Express.Multer.File[] | undefined;
      const photos = files ? files.map(file => ({
        filename: file.originalname,
        data: file.buffer.toString('base64'),
        contentType: file.mimetype
      })) : undefined;
      
      // Parse and validate the request body
      // Convert string values to appropriate types
      const inspectionData = {
        ...req.body,
        mileage: parseInt(req.body.mileage),
        fuelLevel: parseInt(req.body.fuelLevel),
        photos: photos || [],
        inspectedBy: req.user!.id,
        jobId: parseInt(req.body.jobId),
        // Add customerId if provided in the request
        ...(req.body.customerId && { customerId: parseInt(req.body.customerId) })
      };
      
      const validatedData = insertVehicleInspectionSchema.parse(inspectionData);
      
      const inspection = await storage.createVehicleInspection(validatedData);
      res.status(201).json(inspection);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/vehicle-inspections/:id", upload.array("photos", 4), async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const inspectionId = parseInt(req.params.id);
      
      // Process photos if uploaded
      const files = req.files as Express.Multer.File[] | undefined;
      const photos = files ? files.map(file => ({
        filename: file.originalname,
        data: file.buffer.toString('base64'),
        contentType: file.mimetype
      })) : undefined;
      
      // Parse and validate the request body
      const inspectionData = {
        ...req.body,
        mileage: req.body.mileage ? parseInt(req.body.mileage) : undefined,
        fuelLevel: req.body.fuelLevel ? parseInt(req.body.fuelLevel) : undefined,
        photos: photos,
        jobId: req.body.jobId ? parseInt(req.body.jobId) : undefined,
        // Add customerId if provided in the request
        ...(req.body.customerId && { customerId: parseInt(req.body.customerId) })
      };
      
      const validatedData = insertVehicleInspectionSchema.partial().parse(inspectionData);
      
      const updatedInspection = await storage.updateVehicleInspection(inspectionId, validatedData);
      if (!updatedInspection) {
        return res.status(404).json({ message: "Vehicle inspection not found" });
      }
      
      res.json(updatedInspection);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/vehicle-inspections/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const inspectionId = parseInt(req.params.id);
      const success = await storage.deleteVehicleInspection(inspectionId);
      
      if (!success) {
        return res.status(404).json({ message: "Vehicle inspection not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // INVOICE ROUTES
  app.get("/api/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const status = req.query.status as string | undefined;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const jobId = req.query.jobId ? parseInt(req.query.jobId as string) : undefined;
      
      let invoices;
      if (status) {
        invoices = await storage.getInvoicesByStatus(status);
      } else if (customerId) {
        invoices = await storage.getInvoicesByCustomerId(customerId);
      } else if (jobId) {
        invoices = await storage.getInvoicesByJobId(jobId);
      } else {
        invoices = await storage.getAllInvoices();
      }
      
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Check if id is a valid number
      const invoiceIdStr = req.params.id;
      if (!invoiceIdStr || invoiceIdStr === "undefined" || invoiceIdStr === "NaN") {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoiceId = parseInt(invoiceIdStr);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invoice ID must be a number" });
      }
      
      console.log("Looking up invoice with ID:", invoiceId);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Get line items
      const lineItems = await storage.getInvoiceItemsByInvoiceId(invoiceId);
      console.log(`Found ${lineItems.length} line items for invoice ${invoiceId}`);
      
      // Enhanced debugging for line items
      console.log("Line items details:", lineItems.map(item => ({
        id: item.id,
        invoiceId: item.invoiceId,
        description: item.description,
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        unitPrice: item.unitPrice,
        unitPriceType: typeof item.unitPrice,
        total: item.total,
        totalType: typeof item.total
      })));
      
      // Ensure numeric types in the response
      const processedLineItems = lineItems.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total)
      }));
      
      res.json({
        ...invoice,
        lineItems: processedLineItems
      });
    } catch (error) {
      console.error("Error getting invoice:", error);
      next(error);
    }
  });

  app.post("/api/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      console.log("Creating invoice with data:", req.body);
      
      const { lineItems, ...invoiceData } = req.body;
      
      // Validate required fields
      if (!invoiceData.jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }
      
      if (!invoiceData.customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }
      
      if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return res.status(400).json({ message: "At least one line item is required" });
      }
      
      // Generate invoice number if not provided
      if (!invoiceData.invoiceNumber) {
        invoiceData.invoiceNumber = `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      }
      
      // Validate and create invoice - ensure all fields are properly typed
      try {
        const validatedInvoiceData = insertInvoiceSchema.parse({
          ...invoiceData,
          amount: parseFloat(String(invoiceData.amount || '0')),
          tax: parseFloat(String(invoiceData.tax || '0')),
          total: parseFloat(String(invoiceData.total || '0')),
          createdBy: req.user!.id,
          jobId: parseInt(String(invoiceData.jobId)),
          customerId: parseInt(String(invoiceData.customerId)),
          issueDate: invoiceData.issueDate ? new Date(invoiceData.issueDate) : new Date(),
          dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        
        console.log("Validated invoice data:", validatedInvoiceData);
        
        const invoice = await storage.createInvoice(validatedInvoiceData);
        console.log("Created invoice:", invoice);
        
        // Validate and create line items
        const createdLineItems = [];
        if (Array.isArray(lineItems)) {
          for (const item of lineItems) {
            try {
              const validatedItemData = insertInvoiceItemSchema.parse({
                ...item,
                quantity: parseInt(String(item.quantity || 1)),
                unitPrice: parseFloat(String(item.unitPrice || 0)),
                total: parseFloat(String(item.total || 0)),
                invoiceId: invoice.id
              });
              
              console.log("Creating line item:", validatedItemData);
              const lineItem = await storage.createInvoiceItem(validatedItemData);
              createdLineItems.push(lineItem);
            } catch (itemError) {
              console.error("Error creating line item:", itemError);
              // Continue with other line items even if one fails
            }
          }
        }
        
        res.status(201).json({
          ...invoice,
          lineItems: createdLineItems
        });
      } catch (validationError) {
        console.error("Invoice validation error:", validationError);
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error' 
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      next(error);
    }
  });

  app.put("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const invoiceId = parseInt(req.params.id);
      const { lineItems, ...invoiceData } = req.body;
      
      // Validate and update invoice - ensure all fields are properly typed
      const validatedInvoiceData = insertInvoiceSchema.partial().parse({
        ...invoiceData,
        amount: invoiceData.amount ? parseFloat(invoiceData.amount) : undefined,
        tax: invoiceData.tax ? parseFloat(invoiceData.tax) : undefined,
        total: invoiceData.total ? parseFloat(invoiceData.total) : undefined,
        jobId: invoiceData.jobId ? parseInt(invoiceData.jobId) : undefined,
        customerId: invoiceData.customerId ? parseInt(invoiceData.customerId) : undefined
      });
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, validatedInvoiceData);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Update line items if provided
      if (Array.isArray(lineItems)) {
        // Delete existing line items
        const existingItems = await storage.getInvoiceItemsByInvoiceId(invoiceId);
        for (const item of existingItems) {
          await storage.deleteInvoiceItem(item.id);
        }
        
        // Create new line items
        const updatedLineItems = [];
        for (const item of lineItems) {
          const validatedItemData = insertInvoiceItemSchema.parse({
            ...item,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.total),
            invoiceId
          });
          
          const lineItem = await storage.createInvoiceItem(validatedItemData);
          updatedLineItems.push(lineItem);
        }
        
        res.json({
          ...updatedInvoice,
          lineItems: updatedLineItems
        });
      } else {
        const existingLineItems = await storage.getInvoiceItemsByInvoiceId(invoiceId);
        res.json({
          ...updatedInvoice,
          lineItems: existingLineItems
        });
      }
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const invoiceId = parseInt(req.params.id);
      
      // Delete line items first
      const lineItems = await storage.getInvoiceItemsByInvoiceId(invoiceId);
      for (const item of lineItems) {
        await storage.deleteInvoiceItem(item.id);
      }
      
      // Then delete the invoice
      const success = await storage.deleteInvoice(invoiceId);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // EMAIL INVOICE ROUTE
  app.post("/api/invoices/:id/email", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const invoiceId = parseInt(req.params.id);
      const { recipient, subject, message } = req.body;
      
      // Validate parameters
      if (!recipient || !subject) {
        return res.status(400).json({ message: "Recipient and subject are required" });
      }
      
      // Get invoice with line items
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const lineItems = await storage.getInvoiceItemsByInvoiceId(invoiceId);
      
      // Get customer information
      const customer = await storage.getCustomer(invoice.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Simplified email for demo - in a production app this would generate a PDF
      const emailContent = `
        <h1>Invoice #${invoice.invoiceNumber}</h1>
        <p>Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
        <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <hr>
        <h2>Customer</h2>
        <p>${customer.name}<br>${customer.address || ''}</p>
        <hr>
        <h2>Line Items</h2>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
          ${lineItems.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>£${item.unitPrice.toFixed(2)}</td>
              <td>£${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <hr>
        <p>Subtotal: £${invoice.amount.toFixed(2)}</p>
        <p>Tax: £${invoice.tax.toFixed(2)}</p>
        <p><strong>Total: £${invoice.total.toFixed(2)}</strong></p>
        <hr>
        <p>${message || invoice.notes || ''}</p>
      `;
      
      // Send email
      await transporter.sendMail({
        from: `"Frosty's Ice Blasting Solutions" <${process.env.EMAIL_USER || 'invoices@frostys.com'}>`,
        to: recipient,
        subject: subject,
        html: emailContent
      });
      
      res.json({ message: "Invoice email sent successfully" });
    } catch (error) {
      next(error);
    }
  });

  // STAFF ROUTES (for admin users only)
  app.get("/api/staff", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/staff", async (req, res, next) => {
    try {
      // Public registration endpoint - authentication not required
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user with approved=false by default
      const userData = {
        ...req.body,
        password: hashedPassword,
        approved: req.isAuthenticated() && req.user!.role === 'admin' ? true : false // Auto-approve if admin is creating it
      };
      
      const user = await storage.createUser(userData);
      res.status(201).json({ 
        ...user, 
        message: "Staff account created successfully. New accounts require admin approval before they can be used." 
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/staff/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const userId = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/staff/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Don't allow deleting oneself
      const userId = parseInt(req.params.id);
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Test route for invoice creation
  app.get("/api/test-create-invoice", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Get first job and customer for testing
      const jobs = await storage.getAllJobs();
      if (jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }
      
      const job = jobs[0];
      const customer = await storage.getCustomer(job.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Create invoice data
      const invoiceData = {
        invoiceNumber: `INV-TEST-${Math.floor(Math.random() * 10000)}`,
        jobId: job.id,
        customerId: customer.id,
        amount: 100.00,
        tax: 20.00,
        total: 120.00,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "Test invoice created via API",
        paymentTerms: "30 days",
        paymentMethod: "Bank Transfer",
        status: "draft",
        createdBy: req.user!.id
      };
      
      // Create line items
      const lineItems = [
        {
          description: "Test Service Item",
          quantity: 1,
          unitPrice: 100.00,
          total: 100.00
        }
      ];
      
      // Create invoice
      const invoice = await storage.createInvoice(invoiceData);
      
      // Create line item
      const lineItem = await storage.createInvoiceItem({
        invoiceId: invoice.id,
        description: lineItems[0].description,
        quantity: lineItems[0].quantity,
        unitPrice: lineItems[0].unitPrice,
        total: lineItems[0].total
      });
      
      res.status(201).json({
        ...invoice,
        lineItems: [lineItem]
      });
    } catch (error) {
      console.error("Error creating test invoice:", error);
      next(error);
    }
  });
  
  // COMPANY SETTINGS API
  // Path to the company settings file
  const settingsFilePath = path.join(process.cwd(), 'company-settings.json');
  
  // Default company settings
  const defaultSettings = {
    companyName: "Frosty's Ice Blasting Solutions LTD",
    address: "123 Snowflake Street, Frostville, FV1 2IB",
    phone: "+44 1234 567890",
    email: "info@frostysblasting.co.uk",
    website: "https://www.frostysblasting.co.uk",
    vatNumber: "GB123456789",
  };
  
  // Helper function to read settings
  const readSettings = () => {
    try {
      if (fs.existsSync(settingsFilePath)) {
        const data = fs.readFileSync(settingsFilePath, 'utf8');
        return JSON.parse(data);
      }
      return defaultSettings;
    } catch (error) {
      console.error('Error reading company settings:', error);
      return defaultSettings;
    }
  };
  
  // Helper function to write settings
  const writeSettings = (settings: any) => {
    try {
      fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing company settings:', error);
      return false;
    }
  };
  
  // Ensure settings file exists
  if (!fs.existsSync(settingsFilePath)) {
    writeSettings(defaultSettings);
  }
  
  // GET company settings
  app.get('/api/company-settings', (req, res) => {
    try {
      const settings = readSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error retrieving company settings:', error);
      res.status(500).json({ error: 'Failed to retrieve company settings' });
    }
  });
  
  // Update company settings
  app.put('/api/company-settings', (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      // Only admins should be able to update company settings
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can update company settings' });
      }
      
      const newSettings = {
        ...readSettings(), // Load existing settings
        ...req.body,       // Apply updates
      };
      
      const success = writeSettings(newSettings);
      
      if (success) {
        res.json(newSettings);
      } else {
        res.status(500).json({ error: 'Failed to update company settings' });
      }
    } catch (error) {
      console.error('Error updating company settings:', error);
      res.status(500).json({ error: 'Failed to update company settings' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
