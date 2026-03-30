import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ClientToServerEvents, ServerToClientEvents } from 'shxthead-shared';
import { RoomManager } from './roomManager';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';
import { socketAuth } from './middleware/authMiddleware';
import { presenceManager } from './presenceManager';
import authRouter from './handlers/authHandlers';
import friendRouter from './handlers/friendHandlers';
import pushRouter from './handlers/pushHandlers';
import prisma from './db';

const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: isProd
    ? { origin: false }
    : { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/friends', friendRouter);
app.use('/api/push', pushRouter);

// Serve static client build in production
if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Authenticate all socket connections
io.use(socketAuth);

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;

  // Track presence
  presenceManager.connect(userId, socket.id);

  // Notify friends this user came online (guests have no friends)
  if (!socket.data.isGuest) notifyFriendsPresence(userId, true);

  registerRoomHandlers(io, socket, roomManager);
  registerGameHandlers(io, socket, roomManager);

  socket.on('disconnect', async () => {
    await presenceManager.disconnect(userId);
    if (!socket.data.isGuest) notifyFriendsPresence(userId, false);

    // Handle room cleanup on disconnect
    const room = roomManager.getRoomByPlayerId(userId);
    if (room) {
      const updatedRoom = roomManager.leaveRoom(room.id, userId);
      if (updatedRoom) {
        io.to(room.id).emit('room:updated', {
          id: updatedRoom.id,
          hostId: updatedRoom.hostId,
          config: updatedRoom.config,
          phase: updatedRoom.gameState.phase,
          players: updatedRoom.gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            isReady: p.isReady,
          })),
        });
      }
    }
  });
});

async function notifyFriendsPresence(userId: string, isOnline: boolean): Promise<void> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const lastSeenAt = user?.lastSeenAt?.toISOString() ?? new Date().toISOString();

    for (const f of friendships) {
      const friendId = f.requesterId === userId ? f.addresseeId : f.requesterId;
      const friendSocketId = presenceManager.getSocketId(friendId);
      if (friendSocketId) {
        io.to(friendSocketId).emit('friends:presence_update', { userId, isOnline, lastSeenAt });
      }
    }
  } catch {
    // non-critical, don't crash
  }
}

httpServer.listen(PORT, () => {
  console.log(`ShxtHead server running on port ${PORT}`);
});
