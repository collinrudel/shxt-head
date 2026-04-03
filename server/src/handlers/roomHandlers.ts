import { Server, Socket } from 'socket.io';
import { ClientRoomState, GamePhase, RoomConfig } from 'shxthead-shared';
import { RoomManager } from '../roomManager';
import { presenceManager } from '../presenceManager';
import prisma from '../db';

function toClientRoomState(room: ReturnType<RoomManager['getRoom']>): ClientRoomState | null {
  if (!room) return null;
  return {
    id: room.id,
    hostId: room.hostId,
    config: room.config,
    phase: room.gameState.phase,
    players: room.gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      isReady: p.isReady,
      isBot: p.isBot,
    })),
  };
}

export function registerRoomHandlers(io: Server, socket: Socket, roomManager: RoomManager): void {
  const userId = socket.data.userId as string;

  socket.on('room:create', async (payload: { playerName: string; config: RoomConfig }, cb) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
      const playerName = user?.username ?? payload.playerName;
      const room = roomManager.createRoom(userId, playerName, payload.config);
      socket.join(room.id);
      cb({ ok: true, data: { roomId: room.id } });
      const state = toClientRoomState(room);
      if (state) socket.emit('room:updated', state);
    } catch {
      cb({ ok: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', async (payload: { roomId: string; playerName: string }, cb) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const playerName = user?.username ?? payload.playerName;

    const { room, error } = roomManager.joinRoom(
      payload.roomId.toUpperCase(),
      userId,
      playerName
    );

    if (error || !room) {
      cb({ ok: false, error: error ?? 'Failed to join room' });
      return;
    }

    socket.join(room.id);
    const state = toClientRoomState(room);
    if (state) io.to(room.id).emit('room:updated', state);
    cb({ ok: true });
  });

  socket.on('room:leave', () => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room) return;

    socket.leave(room.id);
    const updatedRoom = roomManager.leaveRoom(room.id, userId);
    if (updatedRoom) {
      const state = toClientRoomState(updatedRoom);
      if (state) io.to(room.id).emit('room:updated', state);
    }
  });

  socket.on('lobby:ready', (payload: { ready: boolean }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Lobby) return;

    const pi = room.gameState.players.findIndex(p => p.id === userId);
    if (pi === -1) return;

    const updatedPlayers = [...room.gameState.players];
    updatedPlayers[pi] = { ...updatedPlayers[pi]!, isReady: payload.ready };
    const updated = {
      ...room,
      gameState: { ...room.gameState, players: updatedPlayers },
    };
    roomManager.updateRoom(updated);
    const state = toClientRoomState(updated);
    if (state) io.to(room.id).emit('room:updated', state);
  });

  socket.on('lobby:update_config', (payload: { config: RoomConfig }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.hostId !== userId) return;
    if (room.gameState.phase !== GamePhase.Lobby) return;

    const updated = roomManager.updateConfig(room.id, payload.config);
    if (updated) {
      const state = toClientRoomState(updated);
      if (state) io.to(room.id).emit('room:updated', state);
    }
  });

  socket.on('room:create_solo', async (payload: { playerName: string; botCount: number; numDecks: 1 | 2 | 3 }, cb) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
      const playerName = user?.username ?? payload.playerName;
      const config = { numDecks: payload.numDecks, maxPlayers: 8 };
      let room = roomManager.createRoom(userId, playerName, config);
      socket.join(room.id);

      const botCount = Math.min(Math.max(1, payload.botCount), 6);
      for (let i = 1; i <= botCount; i++) {
        const updated = roomManager.addBotPlayer(room.id, `CPU ${i}`, `bot-${room.id}-${i}`);
        if (updated) room = updated;
      }

      cb({ ok: true, data: { roomId: room.id } });
      const state = toClientRoomState(room);
      if (state) socket.emit('room:updated', state);
    } catch {
      cb({ ok: false, error: 'Failed to create solo room' });
    }
  });

  socket.on('lobby:invite_friend', async (payload: { friendUserId: string }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room) return;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const inviterName = user?.username ?? 'Someone';

    const friendSocketId = presenceManager.getSocketId(payload.friendUserId);
    if (friendSocketId) {
      // Friend is online — send real-time socket notification
      io.to(friendSocketId).emit('lobby:invited', { roomId: room.id, inviterName });
    } else {
      // Friend is offline — send push notification
      try {
        const { sendGameInvitePush } = await import('./pushHandlers');
        await sendGameInvitePush(payload.friendUserId, inviterName, room.id);
      } catch {
        // non-critical
      }
    }
  });
}
