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
import { decideBotMove, decideBotSwaps } from '../aiPlayer';
import prisma from '../db';

function emitStateUpdate(io: Server, room: Room): void {
  for (const player of room.gameState.players) {
    if (player.isBot) continue;
    const clientState = buildClientState(room.gameState, player.id);
    const socketId = presenceManager.getSocketId(player.id);
    if (socketId) {
      io.to(socketId).emit('game:state_update', clientState);
    }
  }
}

async function awardTrophy(io: Server, room: Room, winnerId: string): Promise<void> {
  const winnerPlayer = room.gameState.players.find(p => p.id === winnerId);
  if (!winnerPlayer || winnerPlayer.isBot) return;

  const socketId = presenceManager.getSocketId(winnerId);
  const winnerSocket = socketId ? io.sockets.sockets.get(socketId) : undefined;
  if (winnerSocket?.data.isGuest) return;

  const playerCount = room.gameState.players.length;
  try {
    const updated = await prisma.user.update({
      where: { id: winnerId },
      data: { trophies: { increment: playerCount }, wins: { increment: 1 } },
      select: { trophies: true },
    });
    if (socketId) {
      io.to(socketId).emit('game:trophies_awarded', {
        trophies: playerCount,
        newTotal: updated.trophies,
      });
    }
  } catch {
    // non-critical — user may not exist in DB (e.g. guest with edge case)
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
        // Fire-and-forget trophy award
        awardTrophy(io, room, event.payload.playerId).catch(() => {});
        break;
      case 'blind_flip':
        io.to(room.id).emit('game:blind_flip', event.payload);
        break;
    }
  }
}

function scheduleBotTurnIfNeeded(io: Server, room: Room, roomManager: RoomManager): void {
  if (room.gameState.phase !== GamePhase.Playing) return;
  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer?.isBot) return;

  const delay = 900 + Math.random() * 500;
  setTimeout(() => {
    executeBotTurn(io, room.id, currentPlayer.id, roomManager);
  }, delay);
}

function executeBotTurn(io: Server, roomId: string, botId: string, roomManager: RoomManager): void {
  const room = roomManager.getRoom(roomId);
  if (!room || room.gameState.phase !== GamePhase.Playing) return;

  const currentPlayer = room.gameState.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== botId) return;

  const action = decideBotMove(room.gameState, botId);
  let result: ReturnType<typeof processPlayCards> | undefined;

  if (action.type === 'play') {
    result = processPlayCards(room, botId, action.cardIds);
  } else if (action.type === 'pickup') {
    result = processPickupPile(room, botId);
  } else if (action.type === 'faceDown') {
    result = processPlayFaceDown(room, botId, action.cardId);
  }

  if (!result || result.error) return;

  roomManager.updateRoom(result.room);
  broadcastEvents(io, result.room, result.events);
  emitStateUpdate(io, result.room);
  scheduleBotTurnIfNeeded(io, result.room, roomManager);
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

    let updated = confirmSwap(room, userId, payload.swaps);

    // Auto-confirm any unconfirmed bots
    for (const player of updated.gameState.players) {
      if (player.isBot && !player.swapConfirmed) {
        const botSwaps = decideBotSwaps(player.cards.hand, player.cards.faceUp);
        updated = confirmSwap(updated, player.id, botSwaps);
      }
    }

    roomManager.updateRoom(updated);
    emitStateUpdate(io, updated);

    // If all swaps confirmed and now Playing, schedule bot turn if needed
    if (updated.gameState.phase === GamePhase.Playing) {
      scheduleBotTurnIfNeeded(io, updated, roomManager);
    }
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
    scheduleBotTurnIfNeeded(io, updated, roomManager);
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
    scheduleBotTurnIfNeeded(io, updated, roomManager);
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
    scheduleBotTurnIfNeeded(io, updated, roomManager);
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
    scheduleBotTurnIfNeeded(io, updated, roomManager);
  });
}
