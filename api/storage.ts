import {
  User, type InsertUser,
  Document, type InsertDocument,
  Activity, type InsertActivity,
  Ingestion, type InsertIngestion
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  listDocuments(userId?: number): Promise<Document[]>;
  updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  starDocument(id: number, starred: boolean): Promise<Document | undefined>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  listActivities(limit?: number): Promise<Activity[]>;
  listUserActivities(userId: number, limit?: number): Promise<Activity[]>;

  // Ingestion operations
  createIngestion(ingestion: InsertIngestion): Promise<Ingestion>;
  updateIngestionStatus(id: number, status: "pending" | "processing" | "completed" | "failed", logs?: string): Promise<Ingestion | undefined>;
  listIngestions(): Promise<Ingestion[]>;
  getIngestion(id: number): Promise<Ingestion | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private activities: Map<number, Activity>;
  private ingestions: Map<number, Ingestion>;

  private currentUserId: number;
  private currentDocumentId: number;
  private currentActivityId: number;
  private currentIngestionId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.activities = new Map();
    this.ingestions = new Map();

    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentActivityId = 1;
    this.currentIngestionId = 1;

    // Add a default admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: now,
      updatedAt: now,
      starred: false
    };
    this.documents.set(id, document);
    return document;
  }

  async listDocuments(userId?: number): Promise<Document[]> {
    if (userId) {
      return Array.from(this.documents.values()).filter(
        (document) => document.userId === userId
      );
    }
    return Array.from(this.documents.values());
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const now = new Date();
    const updatedDocument = {
      ...document,
      ...data,
      updatedAt: now
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async starDocument(id: number, starred: boolean): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, starred };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  // Activity operations
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: now
    };
    this.activities.set(id, activity);
    return activity;
  }

  async listActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => (b.createdAt ?? new Date(0)).getTime() - (a.createdAt ?? new Date(0)).getTime());

    if (limit) {
      return activities.slice(0, limit);
    }
    return activities;
  }

  async listUserActivities(userId: number, limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => (b.createdAt ?? new Date(0)).getTime() - (a.createdAt ?? new Date(0)).getTime());

    if (limit) {
      return activities.slice(0, limit);
    }
    return activities;
  }

  // Ingestion operations
  async createIngestion(insertIngestion: InsertIngestion): Promise<Ingestion> {
    const id = this.currentIngestionId++;
    const now = new Date();
    const ingestion: Ingestion = {
      ...insertIngestion,
      id,
      createdAt: now,
      completedAt: null
    };
    this.ingestions.set(id, ingestion);
    return ingestion;
  }

  async updateIngestionStatus(
    id: number,
    status: "pending" | "processing" | "completed" | "failed",
    logs?: string
  ): Promise<Ingestion | undefined> {
    const ingestion = this.ingestions.get(id);
    if (!ingestion) return undefined;

    let completedAt = ingestion.completedAt;
    if (status === 'completed' || status === 'failed') {
      completedAt = new Date();
    }

    const updatedIngestion: Ingestion = {
      ...ingestion,
      status,
      logs: logs || ingestion.logs,
      completedAt
    };
    this.ingestions.set(id, updatedIngestion);
    return updatedIngestion;
  }

  async listIngestions(): Promise<Ingestion[]> {
    return Array.from(this.ingestions.values())
      .sort((a, b) => (b.createdAt ?? new Date(0)).getTime() - (a.createdAt ?? new Date(0)).getTime());
  }

  async getIngestion(id: number): Promise<Ingestion | undefined> {
    return this.ingestions.get(id);
  }
}

// Export a singleton instance of MemStorage
export const storage = new MemStorage();
