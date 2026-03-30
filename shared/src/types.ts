export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export enum GamePhase {
  Lobby = 'lobby',
  Swap = 'swap',
  Playing = 'playing',
  GameOver = 'game_over',
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface PlayerCards {
  hand: Card[];
  faceUp: Card[];
  faceDown: Card[];
}

export interface Player {
  id: string;
  name: string;
  cards: PlayerCards;
  isReady: boolean;
  swapConfirmed: boolean;
  hasWon: boolean;
}

export interface GameState {
  roomId: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  turnDirection: 1 | -1;
  drawPile: Card[];
  discardPile: Card[];
  burnedCards: Card[];
  mustPlayLower: boolean;
  winnerId: string | null;
}

export interface ClientPlayer {
  id: string;
  name: string;
  isReady: boolean;
  swapConfirmed: boolean;
  hasWon: boolean;
  handCount: number;
  faceUpCards: Card[];   // visible to all players
  faceDownCount: number;
  myCards?: PlayerCards;
}

export interface ClientGameState {
  roomId: string;
  phase: GamePhase;
  players: ClientPlayer[];
  currentPlayerIndex: number;
  turnDirection: 1 | -1;
  drawPileCount: number;
  discardPile: Card[];
  mustPlayLower: boolean;
  winnerId: string | null;
  myPlayerId: string;
  slamEligiblePlayerIds: string[];
}

export interface RoomConfig {
  numDecks: 1 | 2 | 3;
  maxPlayers: number;
}

export interface ClientRoomState {
  id: string;
  hostId: string;
  config: RoomConfig;
  phase: GamePhase;
  players: { id: string; name: string; isReady: boolean }[];
}

export interface SwapInstruction {
  handCardId: string;
  faceUpCardId: string;
}

export type AckCallback<T> = (response: { ok: boolean; error?: string; data?: T }) => void;

export interface ClientToServerEvents {
  'room:create': (payload: { playerName: string; config: RoomConfig }, cb: AckCallback<{ roomId: string }>) => void;
  'room:join': (payload: { roomId: string; playerName: string }, cb: AckCallback<void>) => void;
  'room:leave': () => void;
  'lobby:ready': (payload: { ready: boolean }) => void;
  'lobby:update_config': (payload: { config: RoomConfig }) => void;
  'lobby:start_game': () => void;
  'swap:confirm': (payload: { swaps: SwapInstruction[] }) => void;
  'game:play_cards': (payload: { cardIds: string[] }) => void;
  'game:slam': (payload: { cardIds: string[] }) => void;
  'game:pickup_pile': () => void;
  'game:play_facedown': (payload: { cardId: string }) => void;
}

export interface ServerToClientEvents {
  'room:updated': (state: ClientRoomState) => void;
  'room:error': (error: { message: string }) => void;
  'game:state_update': (state: ClientGameState) => void;
  'game:cards_burned': (payload: { cards: Card[]; reason: 'four_of_kind' | 'ten_played' }) => void;
  'game:pile_picked_up': (payload: { playerId: string; cardCount: number }) => void;
  'game:player_won': (payload: { playerId: string }) => void;
  'game:blind_flip': (payload: { playerId: string; card: Card; success: boolean }) => void;
  'game:error': (error: { message: string }) => void;
}
