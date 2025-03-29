import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.VERCEL_URL
    : 'http://localhost:5173',
  credentials: true
}));

// Configure session
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  store: new MemoryStoreSession({
    checkPeriod: 86400, // 24 hours
    ttl: 86400 * 7, // 7 days
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));

// Parse JSON bodies
app.use(express.json());

// API routes
app.use('/api', router);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
