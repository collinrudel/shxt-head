import { Server, Socket } from 'socket.io';
import { ClientRoomState, GamePhase, RoomConfig } from 'shxthead-shared';
import { RoomManager } from '../roomManager';

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
    })),
  };
}

export function registerRoomHandlers(io: Server, socket: Socket, roomManager: RoomManager): void {
  socket.on('room:create', (payload: { playerName: string; config: RoomConfig }, cb) => {
    try {
      const room = roomManager.createRoom(socket.id, payload.playerName, payload.config);
      socket.join(room.id);
      cb({ ok: true, data: { roomId: room.id } });
      const state = toClientRoomState(room);
      if (state) socket.emit('room:updated', state);
    } catch (err) {
      cb({ ok: false, error: 'Failed to create room' });
    }
  });

  socket.on('room:join', (payload: { roomId: string; playerName: string }, cb) => {
    const { room, error } = roomManager.joinRoom(
      payload.roomId.toUpperCase(),
      socket.id,
      payload.playerName
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
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;

    socket.leave(room.id);
    const updatedRoom = roomManager.leaveRoom(room.id, socket.id);
    if (updatedRoom) {
      const state = toClientRoomState(updatedRoom);
      if (state) io.to(room.id).emit('room:updated', state);
    }
  });

  socket.on('lobby:ready', (payload: { ready: boolean }) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.gameState.phase !== GamePhase.Lobby) return;

    const pi = room.gameState.players.findIndex(p => p.id === socket.id);
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
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room || room.hostId !== socket.id) return;
    if (room.gameState.phase !== GamePhase.Lobby) return;

    const updated = roomManager.updateConfig(room.id, payload.config);
    if (updated) {
      const state = toClientRoomState(updated);
      if (state) io.to(room.id).emit('room:updated', state);
    }
  });

  socket.on('disconnect', () => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;
    const updatedRoom = roomManager.leaveRoom(room.id, socket.id);
    if (updatedRoom) {
      const state = toClientRoomState(updatedRoom);
      if (state) io.to(room.id).emit('room:updated', state);
    }
  });
}
