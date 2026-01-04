import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './models/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import photoRoutes from './routes/photos';
import eventRoutes from './routes/events';
import analysisRoutes from './routes/analysis';
import personRoutes from './routes/persons';
import shareRoutes from './routes/shares';
import exportRoutes from './routes/exports';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/photos', photoRoutes);
app.use('/events', eventRoutes);
app.use('/analysis', analysisRoutes);
app.use('/persons', personRoutes);
app.use('/shares', shareRoutes);
app.use('/exports', exportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Initialize database (skip if DATABASE_URL not set)
    if (process.env.DATABASE_URL) {
      await initializeDatabase();
      console.log('Database initialized');
    } else {
      console.log('DATABASE_URL not set, skipping database initialization');
      console.log('Set DATABASE_URL in .env to enable database features');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
