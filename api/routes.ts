import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDocumentSchema, insertActivitySchema, insertIngestionSchema } from "@shared/schema";
import { ZodError } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SESSION_SECRET = process.env.SESSION_SECRET || "supersecretkey";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: SESSION_MAX_AGE
    }),
    cookie: {
      maxAge: SESSION_MAX_AGE
    }
  }));

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin role required" });
    }
    
    return next();
  };

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Don't return passwords
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Validate input, but allow partial updates
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deleting yourself
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      let documents;
      // Admins can see all documents, others can only see their own
      if (user?.role === "admin") {
        documents = await storage.listDocuments();
      } else {
        documents = await storage.listDocuments(userId);
      }
      
      return res.status(200).json(documents);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const document = await storage.createDocument(documentData);
      
      // Create activity for upload
      await storage.createActivity({
        type: "upload",
        documentId: document.id,
        userId: req.session.userId,
        details: `${document.name} was uploaded`
      });
      
      return res.status(201).json(document);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      // Check permissions: Admin can access any document, others only their own
      if (user?.role !== "admin" && document.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to access this document" });
      }
      
      return res.status(200).json(document);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      // Check permissions: Admin or owner can edit
      if (user?.role !== "admin" && document.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to edit this document" });
      }
      
      const updatedDocument = await storage.updateDocument(documentId, req.body);
      
      // Create activity for edit
      await storage.createActivity({
        type: "edit",
        documentId,
        userId: req.session.userId,
        details: `${document.name} was edited`
      });
      
      return res.status(200).json(updatedDocument);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      // Check permissions: Admin or owner can delete
      if (user?.role !== "admin" && document.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to delete this document" });
      }
      
      const documentName = document.name;
      const deleted = await storage.deleteDocument(documentId);
      
      // Create activity for delete
      await storage.createActivity({
        type: "delete",
        userId: req.session.userId,
        details: `${documentName} was deleted`
      });
      
      return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/documents/:id/star", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { starred } = req.body;
      
      if (starred === undefined) {
        return res.status(400).json({ message: "Starred status is required" });
      }
      
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      // Check permissions: Admin or owner can star/unstar
      if (user?.role !== "admin" && document.userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to star/unstar this document" });
      }
      
      const updatedDocument = await storage.starDocument(documentId, starred);
      
      return res.status(200).json(updatedDocument);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.listActivities(limit);
      
      return res.status(200).json(activities);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ingestion routes
  app.post("/api/ingestions", isAuthenticated, async (req, res) => {
    try {
      const ingestionData = insertIngestionSchema.parse({
        ...req.body,
        userId: req.session.userId,
        status: "pending"
      });
      
      const ingestion = await storage.createIngestion(ingestionData);
      
      // Simulate ingestion process starting
      setTimeout(async () => {
        await storage.updateIngestionStatus(ingestion.id, "processing", "Starting ingestion process...");
        
        // Simulate completion after some time
        setTimeout(async () => {
          await storage.updateIngestionStatus(ingestion.id, "completed", "Document successfully ingested");
          
          // Create activity
          await storage.createActivity({
            type: "ingestion",
            documentId: ingestion.documentId,
            userId: ingestion.userId,
            details: "Document was successfully ingested"
          });
        }, 5000);
      }, 1000);
      
      return res.status(201).json(ingestion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ingestions", isAuthenticated, async (req, res) => {
    try {
      const ingestions = await storage.listIngestions();
      return res.status(200).json(ingestions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/ingestions/:id", isAuthenticated, async (req, res) => {
    try {
      const ingestionId = parseInt(req.params.id);
      const ingestion = await storage.getIngestion(ingestionId);
      
      if (!ingestion) {
        return res.status(404).json({ message: "Ingestion not found" });
      }
      
      return res.status(200).json(ingestion);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Q&A routes
  app.post("/api/qa/query", isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      
      // Create activity for search
      await storage.createActivity({
        type: "query",
        userId: req.session.userId,
        details: `"${query}" was queried`
      });
      
      // Simulate Q&A response
      const response = {
        answer: "This is a simulated response to your query: " + query,
        sources: [
          { documentId: 1, title: "Annual Report 2023.pdf", relevance: 0.92 },
          { documentId: 3, title: "Q1 Financial Summary.xlsx", relevance: 0.78 }
        ]
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
