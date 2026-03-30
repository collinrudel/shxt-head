import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, isGuest = false): string {
  return jwt.sign({ userId, ...(isGuest && { isGuest: true }) }, JWT_SECRET, {
    expiresIn: isGuest ? '24h' : '7d',
  });
}

export function verifyToken(token: string): { userId: string; isGuest?: boolean } {
  const payload = jwt.verify(token, JWT_SECRET) as { userId: string; isGuest?: boolean };
  return { userId: payload.userId, isGuest: payload.isGuest };
}
