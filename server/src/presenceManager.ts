import prisma from './db';

class PresenceManager {
  // userId → socketId
  private online = new Map<string, string>();

  connect(userId: string, socketId: string): void {
    this.online.set(userId, socketId);
  }

  async disconnect(userId: string): Promise<void> {
    this.online.delete(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    }).catch(() => {
      // ignore if user was deleted
    });
  }

  isOnline(userId: string): boolean {
    return this.online.has(userId);
  }

  getSocketId(userId: string): string | undefined {
    return this.online.get(userId);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.online.keys());
  }
}

export const presenceManager = new PresenceManager();
