import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'GOV_SECRET_KEY_NIC_PORTAL_2026_JWT_TOKEN';

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'OFFICER' | 'NGO' | 'USER';
  clearance_level: string;
  full_name: string;
  designation?: string;
  badge_number?: string;
  department?: string;
  assigned_district?: string;
  ngo_id?: string;
  status: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      clearance_level: user.clearance_level,
      ngo_id: user.ngo_id,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;

  if (!token) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Access denied: Valid security bearer token or session required.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Retrieve latest user state from database to ensure account is still active
    const user = queryOne<AuthenticatedUser>(
      `SELECT u.id, u.username, u.email, r.name as role, r.clearance_level,
              u.full_name, u.designation, u.badge_number, u.department,
              u.assigned_district, u.ngo_id, u.status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.status != 'SUSPENDED'`,
      [decoded.id]
    );

    if (!user) {
      res.status(401).json({
        error: 'SESSION_REVOKED',
        message: 'User account not found or security clearance suspended.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Security token has expired or signature verification failed.'
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = queryOne<AuthenticatedUser>(
      `SELECT u.id, u.username, u.email, r.name as role, r.clearance_level,
              u.full_name, u.designation, u.badge_number, u.department,
              u.assigned_district, u.ngo_id, u.status
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.status != 'SUSPENDED'`,
      [decoded.id]
    );
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid/expired tokens in optionalAuth to allow public access
  }
  next();
}

export function requireRole(allowedRoles: Array<'ADMIN' | 'OFFICER' | 'NGO' | 'USER'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'ACCESS_DENIED',
        message: `Forbidden: This resource requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`
      });
      return;
    }

    next();
  };
}

export const requireAuth = authenticateToken;
