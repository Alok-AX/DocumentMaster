import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertDocumentSchema, insertActivitySchema, insertIngestionSchema } from "@shared/schema";
import { ZodError } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from 'zod';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || "supersecretkey";
const SESSION_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

const router = express.Router();

const isAuthenticated: express.RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
};

const isAdmin: express.RequestHandler = async (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userId = req.session.userId;
  const user = await storage.getUser(userId);

  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};

const createActivity = async (userId: number | undefined, type: string, action: string, documentId?: number, documentName?: string) => {
  if (!userId) return;
  return storage.createActivity({
    type,
    userId,
    action,
    documentId,
    documentName
  });
};

// Auth routes
router.post("/api/auth/signup", async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

router.post("/api/auth/login", async (req, res) => {
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

router.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

router.get("/api/auth/me", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// User routes (admin only)
router.get("/api/users", isAdmin, async (req, res) => {
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

router.put("/api/users/:id", isAdmin, async (req, res) => {
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

router.delete("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const sessionUserId = req.session.userId;

    if (!sessionUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Don't allow deleting yourself
    if (userId === sessionUserId) {
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
router.get("/api/documents", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);

    let documents;
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

router.post("/api/documents", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const documentData = insertDocumentSchema.parse({
      ...req.body,
      userId
    });

    const document = await storage.createDocument(documentData);

    await createActivity(
      userId,
      "upload",
      "Document uploaded",
      document.id,
      document.name
    );

    return res.status(201).json(document);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input data", errors: error.errors });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/api/documents/:id", isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const user = await storage.getUser(userId);

    // Check permissions: Admin can access any document, others only their own
    if (user?.role !== "admin" && document.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to access this document" });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/documents/:id", isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const user = await storage.getUser(userId);

    if (user?.role !== "admin" && document.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to edit this document" });
    }

    const updatedDocument = await storage.updateDocument(documentId, req.body);

    await createActivity(
      userId,
      "edit",
      "Document edited",
      documentId,
      document.name
    );

    return res.status(200).json(updatedDocument);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const user = await storage.getUser(userId);

    if (user?.role !== "admin" && document.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this document" });
    }

    const documentName = document.name;
    const deleted = await storage.deleteDocument(documentId);

    await createActivity(
      userId,
      "delete",
      "Document deleted",
      documentId,
      documentName
    );

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/api/documents/:id/star", isAuthenticated, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { starred } = req.body;

    if (starred === undefined) {
      return res.status(400).json({ message: "Starred status is required" });
    }

    const document = await storage.getDocument(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const user = await storage.getUser(userId);

    if (user?.role !== "admin" && document.userId !== userId) {
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
router.get("/api/activities", isAuthenticated, async (req, res) => {
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
router.post("/api/ingestions", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ingestionData = insertIngestionSchema.parse({
      ...req.body,
      userId,
      status: "pending"
    });

    const ingestion = await storage.createIngestion(ingestionData);

    setTimeout(async () => {
      await storage.updateIngestionStatus(ingestion.id, "processing", "Starting ingestion process...");

      setTimeout(async () => {
        await storage.updateIngestionStatus(ingestion.id, "completed", "Document successfully ingested");

        await createActivity(
          userId,
          "ingestion",
          "Document ingested",
          ingestion.documentId
        );
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

router.get("/api/ingestions", isAuthenticated, async (req, res) => {
  try {
    const ingestions = await storage.listIngestions();
    return res.status(200).json(ingestions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/api/ingestions/:id", isAuthenticated, async (req, res) => {
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
router.post("/api/qa/query", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    await createActivity(
      userId,
      "query",
      "Query executed",
      undefined,
      query
    );

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

export { router };
