import { z } from "zod";

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
  avatar: z.string().optional(),
  role: z.enum(["admin", "user"]).default("user"),
  createdAt: z.date().nullable().optional()
});

// Insert user schema (for registration)
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  path: z.string(),
  userId: z.number().optional(),
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
  starred: z.boolean().default(false)
});

// Insert document schema
export const insertDocumentSchema = documentSchema.omit({ id: true, createdAt: true, updatedAt: true });

// Activity schema
export const activitySchema = z.object({
  id: z.number(),
  userId: z.number(),
  action: z.string(),
  type: z.string(),
  documentId: z.number().optional(),
  documentName: z.string().optional(),
  createdAt: z.date().nullable().optional(),
  user: userSchema.nullable().optional()
});

// Insert activity schema
export const insertActivitySchema = activitySchema.omit({ id: true, createdAt: true, user: true });

// Ingestion schema
export const ingestionSchema = z.object({
  id: z.number(),
  documentId: z.number(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  logs: z.string().nullable().optional(),
  createdAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional()
});

// Insert ingestion schema
export const insertIngestionSchema = ingestionSchema.omit({ id: true, createdAt: true, completedAt: true });

// Export types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Document = z.infer<typeof documentSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Ingestion = z.infer<typeof ingestionSchema>;
export type InsertIngestion = z.infer<typeof insertIngestionSchema>;
