import { Router } from 'express';
import prisma from '../db';
import { requireAuth } from '../middleware/authMiddleware';
import { presenceManager } from '../presenceManager';

const router = Router();
router.use(requireAuth);

// GET /api/friends — accepted friends with online status
router.get('/', async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
      },
      include: {
        requester: { select: { id: true, username: true, lastSeenAt: true } },
        addressee: { select: { id: true, username: true, lastSeenAt: true } },
      },
    });

    const friends = friendships.map(f => {
      const friend = f.requesterId === req.userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        userId: friend.id,
        username: friend.username,
        isOnline: presenceManager.isOnline(friend.id),
        lastSeenAt: friend.lastSeenAt.toISOString(),
      };
    });

    res.json({ friends });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/friends/requests — pending incoming requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { addresseeId: req.userId, status: 'PENDING' },
      include: {
        requester: { select: { id: true, username: true } },
      },
    });

    res.json({
      requests: requests.map(r => ({
        friendshipId: r.id,
        userId: r.requester.id,
        username: r.requester.username,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/friends/search?q= — find users by username prefix
router.get('/search', async (req, res) => {
  const q = (req.query.q as string ?? '').trim();
  if (!q || q.length < 2) {
    res.json({ users: [] });
    return;
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { startsWith: q, mode: 'insensitive' },
        id: { not: req.userId },
      },
      select: { id: true, username: true },
      take: 10,
    });

    const userIds = users.map((u: { id: string; username: string }) => u.id);

    // Filter out existing friends and pending requests
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        AND: [
          { OR: [{ requesterId: req.userId }, { addresseeId: req.userId }] },
          { OR: [{ addresseeId: { in: userIds } }, { requesterId: { in: userIds } }] },
        ],
      },
    });
    const alreadyLinked = new Set(
      existingFriendships.flatMap((f: { requesterId: string; addresseeId: string }) => [f.requesterId, f.addresseeId])
    );

    res.json({
      users: users
        .filter((u: { id: string; username: string }) => !alreadyLinked.has(u.id))
        .map((u: { id: string; username: string }) => ({ userId: u.id, username: u.username })),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/request — send a friend request by username
router.post('/request', async (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  try {
    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (target.id === req.userId) {
      res.status(400).json({ error: 'Cannot add yourself' });
      return;
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: req.userId },
        ],
      },
    });
    if (existing) {
      res.status(409).json({ error: 'Friend request already exists or you are already friends' });
      return;
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.userId, addresseeId: target.id },
    });

    res.json({ friendshipId: friendship.id });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/accept/:friendshipId
router.post('/accept/:friendshipId', async (req, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: req.params.friendshipId },
    });

    if (!friendship || friendship.addresseeId !== req.userId) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    if (friendship.status !== 'PENDING') {
      res.status(400).json({ error: 'Request already handled' });
      return;
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/friends/:friendshipId — remove friend or decline request
router.delete('/:friendshipId', async (req, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: req.params.friendshipId },
    });

    if (!friendship) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (friendship.requesterId !== req.userId && friendship.addresseeId !== req.userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
