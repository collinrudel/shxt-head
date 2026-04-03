import { Router } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../db';
import { hashPassword, verifyPassword, signToken } from '../auth';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/guest', (req, res) => {
  const { username } = req.body as { username?: string };

  let name = username?.trim();
  if (!name) {
    name = 'Guest_' + randomUUID().slice(0, 4).toUpperCase();
  } else if (name.length < 2 || name.length > 20) {
    res.status(400).json({ error: 'Name must be 2–20 characters' });
    return;
  } else if (!/^[a-zA-Z0-9_ ]+$/.test(name)) {
    res.status(400).json({ error: 'Name can only contain letters, numbers, underscores, and spaces' });
    return;
  }

  const userId = randomUUID();
  const token = signToken(userId, true);
  res.json({ user: { id: userId, username: name, isGuest: true }, token });
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: 'Username must be 2–20 characters' });
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true, trophies: true, wins: true },
    });

    const token = signToken(user.id);
    res.json({ user, token });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = signToken(user.id);
    res.json({ user: { id: user.id, username: user.username, trophies: user.trophies, wins: user.wins }, token });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, trophies: true, wins: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
