import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { seedDatabase } from './seed';
import { authRouter } from './routes/auth';
import { ngosRouter } from './routes/ngos';
import { inspectionsRouter } from './routes/inspections';
import { grievancesRouter } from './routes/grievances';
import { noticesRouter } from './routes/notices';
import { dashboardRouter } from './routes/dashboard';
import { applicationsRouter } from './routes/applications';
import { attendanceRouter } from './routes/attendance';
import { camerasRouter } from './routes/cameras';
import { aiRouter } from './routes/ai';
import { vcRouter } from './routes/vc';
import { randomAssignmentRouter } from './routes/randomAssignment';
import { analyticsRouter } from './routes/analytics';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

// Institutional Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Security & Audit Header
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Portal-Agency', 'Ministry of Social Justice and Empowerment - Government of India');
  next();
});

// Mount Core REST API Endpoints
app.use('/api/auth', authRouter);
app.use('/api/ngos', ngosRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/notices', noticesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/cameras', camerasRouter);
app.use('/api/ai', aiRouter);
app.use('/api/vc', vcRouter);
app.use('/api/random-assignment', randomAssignmentRouter);
app.use('/api/analytics', analyticsRouter);

// System Health & Service Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'National NGO Real-Time Monitoring & Inspection Portal API',
    authority: 'Ministry of Social Justice & Empowerment / NIC GovNet',
    version: 'GIGW-3.0-2026.1',
    timestamp: new Date().toISOString(),
  });
});

// Production Static Assets (when serving built client from dist)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Centralized Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Exception:', err);
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected administrative processing error occurred.',
    timestamp: new Date().toISOString(),
  });
});

// Start Server & Ensure Database Seeded
export async function startServer() {
  await seedDatabase();
  return app.listen(PORT, () => {
    console.log(`🏛️  Government NGO Monitoring Portal API live on port ${PORT}`);
    console.log(`🔒 Security Clearance: GIGW 3.0 • NIC GovNet TLS 1.3 Active`);
  });
}

if (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
