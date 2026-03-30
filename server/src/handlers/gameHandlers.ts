import { Server, Socket } from 'socket.io';
import { GamePhase, SwapInstruction } from 'shxthead-shared';
import { Room, RoomManager } from '../roomManager';
import { buildClientState } from '../gameState';
import { presenceManager } from '../presenceManager';
import {
  startGame,
  confirmSwap,
  processPlayCards,
  processPickupPile,
  processPlayFaceDown,
  processSlam,
  GameEvent,
} from '../gameEngine';

function emitStateUpdate(io: Server, room: Room): void {
  for (const player of room.gameState.players) {
    const clientState = buildClientState(room.gameState, player.id);
    const socketId = presenceManager.getSocketId(player.id);
    if (socketId) {
      io.to(socketId).emit('game:state_update', clientState);
    }
  }
}

function broadcastEvents(io: Server, room: Room, events: GameEvent[]): void {
  for (const event of events) {
    switch (event.type) {
      case 'cards_burned':
        io.to(room.id).emit('game:cards_burned', event.payload);
        break;
      case 'pile_picked_up':
        io.to(room.id).emit('game:pile_picked_up', event.payload);
        break;
      case 'player_won':
        io.to(room.id).emit('game:player_won', event.payload);
        break;
      case 'blind_flip':
        io.to(room.id).emit('game:blind_flip', event.payload);
        break;
    }
  }
}

export function registerGameHandlers(io: Server, socket: Socket, roomManager: RoomManager): void {
  const userId = socket.data.userId as string;

  socket.on('lobby:start_game', () => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room) return;
    if (room.hostId !== userId) {
      socket.emit('game:error', { message: 'Only the host can start the game' });
      return;
    }
    if (room.gameState.phase !== GamePhase.Lobby) return;
    if (room.gameState.players.length < 2) {
      socket.emit('game:error', { message: 'Need at least 2 players' });
      return;
    }
    if (!room.gameState.players.every(p => p.isReady)) {
      socket.emit('game:error', { message: 'All players must be ready' });
      return;
    }

    const updated = startGame(room);
    roomManager.updateRoom(updated);
    emitStateUpdate(io, updated);
  });

  socket.on('swap:confirm', (payload: { swaps: SwapInstruction[] }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Swap) return;

    const updated = confirmSwap(room, userId, payload.swaps);
    roomManager.updateRoom(updated);
    emitStateUpdate(io, updated);
  });

  socket.on('game:play_cards', (payload: { cardIds: string[] }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Playing) return;

    const { room: updated, events, error } = processPlayCards(room, userId, payload.cardIds);
    if (error) {
      socket.emit('game:error', { message: error });
      return;
    }

    roomManager.updateRoom(updated);
    broadcastEvents(io, updated, events);
    emitStateUpdate(io, updated);
  });

  socket.on('game:pickup_pile', () => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Playing) return;

    const { room: updated, events, error } = processPickupPile(room, userId);
    if (error) {
      socket.emit('game:error', { message: error });
      return;
    }

    roomManager.updateRoom(updated);
    broadcastEvents(io, updated, events);
    emitStateUpdate(io, updated);
  });

  socket.on('game:play_facedown', (payload: { cardId: string }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Playing) return;

    const { room: updated, events, error } = processPlayFaceDown(room, userId, payload.cardId);
    if (error) {
      socket.emit('game:error', { message: error });
      return;
    }

    roomManager.updateRoom(updated);
    broadcastEvents(io, updated, events);
    emitStateUpdate(io, updated);
  });

  socket.on('game:slam', (payload: { cardIds: string[] }) => {
    const room = roomManager.getRoomByPlayerId(userId);
    if (!room || room.gameState.phase !== GamePhase.Playing) return;

    const { room: updated, events, error } = processSlam(room, userId, payload.cardIds);
    if (error) {
      socket.emit('game:error', { message: error });
      return;
    }

    roomManager.updateRoom(updated);
    broadcastEvents(io, updated, events);
    emitStateUpdate(io, updated);
  });
}
