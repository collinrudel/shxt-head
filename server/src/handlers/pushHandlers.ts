import { Router } from 'express';
import webpush from 'web-push';
import prisma from '../db';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Configure VAPID — keys are set via env vars
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@shxthead.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

// POST /api/push/subscribe
router.post('/subscribe', requireAuth, async (req, res) => {
  const subscription = req.body as object;
  if (!subscription) {
    res.status(400).json({ error: 'Subscription required' });
    return;
  }

  try {
    // Delete any existing subscription for this user and re-create
    // (simplest approach since JSON fields can't be used as unique keys in Prisma)
    await prisma.pushSubscription.deleteMany({ where: { userId: req.userId } });
    await prisma.pushSubscription.create({
      data: { userId: req.userId, subscription: subscription as never },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/push/subscribe
router.delete('/subscribe', requireAuth, async (req, res) => {
  try {
    await prisma.pushSubscription.deleteMany({ where: { userId: req.userId } });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

// Exported helper called from roomHandlers for offline invites
export async function sendGameInvitePush(
  targetUserId: string,
  inviterName: string,
  roomId: string
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: targetUserId },
  });

  const payload = JSON.stringify({
    title: `${inviterName} invited you to ShxtHead`,
    body: 'Tap to join the game!',
    data: { roomId, url: `/join/${roomId}` },
  });

  await Promise.allSettled(
    subs.map((sub: { id: string; subscription: unknown }) =>
      webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload)
        .catch(async (err: { statusCode?: number }) => {
          // Remove stale subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        })
    )
  );
}
