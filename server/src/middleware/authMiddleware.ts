import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { verifyToken } from '../auth';

// Extend Express Request to carry userId
declare global {
  namespace Express {
    interface Request {
      userId: string;
      isGuest?: boolean;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const { userId, isGuest } = verifyToken(header.slice(7));
    req.userId = userId;
    req.isGuest = isGuest;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function socketAuth(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }
  try {
    const { userId, isGuest } = verifyToken(token);
    socket.data.userId = userId;
    socket.data.isGuest = isGuest ?? false;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}
