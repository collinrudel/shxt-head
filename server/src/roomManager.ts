import { GamePhase, GameState, RoomConfig } from 'shxthead-shared';

export interface Room {
  id: string;
  hostId: string;
  config: RoomConfig;
  gameState: GameState;
  createdAt: number;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    phase: GamePhase.Lobby,
    players: [],
    currentPlayerIndex: 0,
    turnDirection: 1,
    drawPile: [],
    discardPile: [],
    burnedCards: [],
    mustPlayLower: false,
    winnerId: null,
  };
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor() {
    // Clean up stale rooms every 30 minutes
    setInterval(() => this.cleanupStaleRooms(), 30 * 60 * 1000);
  }

  createRoom(hostId: string, playerName: string, config: RoomConfig): Room {
    let id = generateRoomCode();
    while (this.rooms.has(id)) {
      id = generateRoomCode();
    }

    const room: Room = {
      id,
      hostId,
      config,
      gameState: {
        ...createInitialGameState(id),
        players: [
          {
            id: hostId,
            name: playerName,
            cards: { hand: [], faceUp: [], faceDown: [] },
            isReady: false,
            swapConfirmed: false,
            hasWon: false,
          },
        ],
      },
      createdAt: Date.now(),
    };

    this.rooms.set(id, room);
    return room;
  }

  joinRoom(roomId: string, socketId: string, playerName: string): { room: Room; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) return { room: room as unknown as Room, error: 'Room not found' };
    if (room.gameState.phase !== GamePhase.Lobby) return { room, error: 'Game already in progress' };
    if (room.gameState.players.length >= room.config.maxPlayers) return { room, error: 'Room is full' };
    if (room.gameState.players.some(p => p.id === socketId)) return { room, error: 'Already in room' };

    const updatedRoom: Room = {
      ...room,
      gameState: {
        ...room.gameState,
        players: [
          ...room.gameState.players,
          {
            id: socketId,
            name: playerName,
            cards: { hand: [], faceUp: [], faceDown: [] },
            isReady: false,
            swapConfirmed: false,
            hasWon: false,
          },
        ],
      },
    };

    this.rooms.set(roomId, updatedRoom);
    return { room: updatedRoom };
  }

  leaveRoom(roomId: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const updatedPlayers = room.gameState.players.filter(p => p.id !== socketId);

    if (updatedPlayers.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    // Transfer host if host left
    const newHostId =
      room.hostId === socketId ? updatedPlayers[0]!.id : room.hostId;

    const updatedRoom: Room = {
      ...room,
      hostId: newHostId,
      gameState: { ...room.gameState, players: updatedPlayers },
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  updateRoom(room: Room): void {
    this.rooms.set(room.id, room);
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.gameState.players.some(p => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  addBotPlayer(roomId: string, botName: string, botId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const updatedRoom: Room = {
      ...room,
      gameState: {
        ...room.gameState,
        players: [
          ...room.gameState.players,
          {
            id: botId,
            name: botName,
            cards: { hand: [], faceUp: [], faceDown: [] },
            isReady: true,
            swapConfirmed: false,
            hasWon: false,
            isBot: true,
          },
        ],
      },
    };
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  updateConfig(roomId: string, config: RoomConfig): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;
    const updated = { ...room, config };
    this.rooms.set(roomId, updated);
    return updated;
  }

  private cleanupStaleRooms(): void {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, room] of this.rooms.entries()) {
      if (room.createdAt < twoHoursAgo) {
        this.rooms.delete(id);
      }
    }
  }
}
