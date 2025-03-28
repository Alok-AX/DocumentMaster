import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize Express app
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '../dist/public');
  app.use(express.static(publicPath));
}

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Initialize routes - do this immediately instead of in an async function
let routesInitialized = false;
let routeInitializationPromise: Promise<any> | null = null;

function initializeRoutes() {
  if (!routesInitialized && !routeInitializationPromise) {
    routeInitializationPromise = registerRoutes(app).then(() => {
      routesInitialized = true;
    });
  }
  return routeInitializationPromise;
}

// Initialize routes immediately
initializeRoutes();

// Sample API endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Send response but don't throw an error afterward
  res.status(status).json({ message });
});

// Handle Vercel serverless function request
const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Wait for routes to be initialized
  if (!routesInitialized && routeInitializationPromise) {
    try {
      await routeInitializationPromise;
    } catch (error) {
      console.error("Error initializing routes:", error);
    }
  }

  // Process the request with Express
  return new Promise((resolve, reject) => {
    // @ts-ignore - Vercel's request/response are compatible with Express but TypeScript doesn't know
    app(req, res, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(undefined);
    });
  });
};

// Export the handler function for Vercel
export default handler;

// Start the server directly if not running as a Vercel function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
