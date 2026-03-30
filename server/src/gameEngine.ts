import { Card, GamePhase, GameState, Player, Rank, SwapInstruction } from 'shxthead-shared';
import { canPlay, getTopPileRun, isSameRank } from './rules/cardComparison';
import { checkForBurn } from './rules/burnDetection';
import { applySpecialEffect } from './rules/specialCards';
import { advanceTurn, drawToThree, getSlamEligiblePlayerIds } from './rules/turnAdvance';
import { createDeck, dealCards, shuffleDeck } from './deck';
import { Room } from './roomManager';

export type BurnReason = 'four_of_kind' | 'ten_played';

export type GameEvent =
  | { type: 'cards_burned'; payload: { cards: Card[]; reason: BurnReason } }
  | { type: 'pile_picked_up'; payload: { playerId: string; cardCount: number } }
  | { type: 'player_won'; payload: { playerId: string } }
  | { type: 'blind_flip'; payload: { playerId: string; card: Card; success: boolean } };

export interface ProcessResult {
  room: Room;
  events: GameEvent[];
  error?: string;
}

function findPlayerIndex(state: GameState, playerId: string): number {
  return state.players.findIndex(p => p.id === playerId);
}

function removeCardsFromPlayer(player: Player, cardIds: string[]): { player: Player; removed: Card[] } {
  const removed: Card[] = [];
  const idSet = new Set(cardIds);

  const filterOut = (cards: Card[]): Card[] =>
    cards.filter(c => {
      if (idSet.has(c.id)) { removed.push(c); return false; }
      return true;
    });

  return {
    player: {
      ...player,
      cards: {
        hand: filterOut(player.cards.hand),
        faceUp: filterOut(player.cards.faceUp),
        faceDown: filterOut(player.cards.faceDown),
      },
    },
    removed,
  };
}

function pickupPile(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex]!;
  const pileCards = [...state.discardPile];
  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = {
    ...player,
    cards: { ...player.cards, hand: [...player.cards.hand, ...pileCards] },
  };
  return { ...state, discardPile: [], players: updatedPlayers, mustPlayLower: false };
}

function checkWin(state: GameState, playerId: string): { state: GameState; won: boolean } {
  const pi = findPlayerIndex(state, playerId);
  if (pi === -1) return { state, won: false };
  const p = state.players[pi]!;
  const won =
    p.cards.hand.length === 0 &&
    p.cards.faceUp.length === 0 &&
    p.cards.faceDown.length === 0;
  if (!won) return { state, won: false };

  const updatedPlayers = [...state.players];
  updatedPlayers[pi] = { ...p, hasWon: true };
  return {
    state: { ...state, players: updatedPlayers, phase: GamePhase.GameOver, winnerId: playerId },
    won: true,
  };
}

function applyCardPlay(
  state: GameState,
  playerIndex: number,
  cards: Card[]
): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const rank = cards[0]!.rank;

  // Place cards on discard pile
  state = { ...state, discardPile: [...state.discardPile, ...cards] };

  // Apply special effect for this rank
  const { state: afterSpecial, skipNormalAdvance, burnTriggered } = applySpecialEffect(state, rank);
  state = afterSpecial;

  // Clear mustPlayLower when a player acts, UNLESS:
  //   - rank 5: passes the obligation to the next player unchanged
  //   - rank 7: applySpecialEffect already set it to true (re-activating it)
  // All other ranks (including 2, 10, J, Q, K, A, etc.) satisfy/clear the constraint.
  if (rank !== Rank.Five && rank !== Rank.Seven) {
    state = { ...state, mustPlayLower: false };
  }

  if (burnTriggered) {
    events.push({ type: 'cards_burned', payload: { cards, reason: 'ten_played' } });
  }

  // Draw back to 3 if playing from hand and draw pile has cards
  if (state.players[playerIndex]!.cards.hand.length < 3 && state.drawPile.length > 0) {
    state = drawToThree(state, state.players[playerIndex]!.id);
  }

  // Check for 4-of-a-kind burn (only if 10 didn't already burn)
  if (!burnTriggered && checkForBurn(state.discardPile)) {
    const burned = [...state.discardPile];
    state = {
      ...state,
      burnedCards: [...state.burnedCards, ...burned],
      discardPile: [],
      mustPlayLower: false,
    };
    events.push({ type: 'cards_burned', payload: { cards: burned, reason: 'four_of_kind' } });
    // After a 4-of-a-kind burn, same player plays again
    return { state, events };
  }

  if (!skipNormalAdvance) {
    state = advanceTurn(state);
  }

  return { state, events };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function startGame(room: Room): Room {
  const deck = shuffleDeck(createDeck(room.config.numDecks));
  const { playerCards, remainingDeck } = dealCards(deck, room.gameState.players.length);

  const players: Player[] = room.gameState.players.map((p, i) => ({
    ...p,
    cards: playerCards[i]!,
    isReady: false,
    swapConfirmed: false,
    hasWon: false,
  }));

  return {
    ...room,
    gameState: {
      ...room.gameState,
      phase: GamePhase.Swap,
      players,
      currentPlayerIndex: 0,
      turnDirection: 1,
      drawPile: remainingDeck,
      discardPile: [],
      burnedCards: [],
      mustPlayLower: false,
      winnerId: null,
    },
  };
}

export function confirmSwap(room: Room, playerId: string, swaps: SwapInstruction[]): Room {
  const pi = findPlayerIndex(room.gameState, playerId);
  if (pi === -1) return room;

  let player = room.gameState.players[pi]!;

  // Apply each swap: exchange a hand card with a face-up card
  for (const swap of swaps) {
    const handCard = player.cards.hand.find(c => c.id === swap.handCardId);
    const faceUpCard = player.cards.faceUp.find(c => c.id === swap.faceUpCardId);
    if (!handCard || !faceUpCard) continue;

    player = {
      ...player,
      cards: {
        ...player.cards,
        hand: player.cards.hand.map(c => (c.id === swap.handCardId ? faceUpCard : c)),
        faceUp: player.cards.faceUp.map(c => (c.id === swap.faceUpCardId ? handCard : c)),
      },
    };
  }

  player = { ...player, swapConfirmed: true };
  const updatedPlayers = [...room.gameState.players];
  updatedPlayers[pi] = player;

  let state: GameState = { ...room.gameState, players: updatedPlayers };

  // If all players confirmed swaps, transition to Playing
  if (updatedPlayers.every(p => p.swapConfirmed)) {
    state = { ...state, phase: GamePhase.Playing };
  }

  return { ...room, gameState: state };
}

export function processPlayCards(room: Room, playerId: string, cardIds: string[]): ProcessResult {
  let state = room.gameState;
  const events: GameEvent[] = [];

  const pi = findPlayerIndex(state, playerId);
  if (pi === -1) return { room, events, error: 'Player not found' };

  const isCurrentPlayer = state.players[state.currentPlayerIndex]!.id === playerId;
  if (!isCurrentPlayer) return { room, events, error: 'Not your turn' };

  const { player, removed } = removeCardsFromPlayer(state.players[pi]!, cardIds);

  if (removed.length === 0) return { room, events, error: 'Cards not found' };
  if (!isSameRank(removed)) return { room, events, error: 'Must play cards of the same rank' };

  // Update player in state
  const updatedPlayers = [...state.players];
  updatedPlayers[pi] = player;
  state = { ...state, players: updatedPlayers };

  // Validate the play — if invalid, player picks up the pile (penalty)
  if (!canPlay(removed, state.discardPile, state.mustPlayLower)) {
    const pileCount = state.discardPile.length;
    state = pickupPile(state, pi);
    // Also put the attempted cards in the player's hand
    const updatedP = [...state.players];
    updatedP[pi] = {
      ...updatedP[pi]!,
      cards: { ...updatedP[pi]!.cards, hand: [...updatedP[pi]!.cards.hand, ...removed] },
    };
    state = { ...state, players: updatedP };
    state = advanceTurn(state);
    events.push({ type: 'pile_picked_up', payload: { playerId, cardCount: pileCount + removed.length } });
    return { room: { ...room, gameState: state }, events };
  }

  const { state: afterPlay, events: playEvents } = applyCardPlay(state, pi, removed);
  state = afterPlay;
  events.push(...playEvents);

  const { state: afterWin, won } = checkWin(state, playerId);
  state = afterWin;
  if (won) events.push({ type: 'player_won', payload: { playerId } });

  return { room: { ...room, gameState: state }, events };
}

export function processPickupPile(room: Room, playerId: string): ProcessResult {
  let state = room.gameState;
  const events: GameEvent[] = [];

  const pi = findPlayerIndex(state, playerId);
  if (pi === -1) return { room, events, error: 'Player not found' };

  const isCurrentPlayer = state.players[state.currentPlayerIndex]!.id === playerId;
  if (!isCurrentPlayer) return { room, events, error: 'Not your turn' };

  const pileCount = state.discardPile.length;
  state = pickupPile(state, pi);
  state = advanceTurn(state);

  events.push({ type: 'pile_picked_up', payload: { playerId, cardCount: pileCount } });

  return { room: { ...room, gameState: state }, events };
}

export function processPlayFaceDown(room: Room, playerId: string, cardId: string): ProcessResult {
  let state = room.gameState;
  const events: GameEvent[] = [];

  const pi = findPlayerIndex(state, playerId);
  if (pi === -1) return { room, events, error: 'Player not found' };

  const isCurrentPlayer = state.players[state.currentPlayerIndex]!.id === playerId;
  if (!isCurrentPlayer) return { room, events, error: 'Not your turn' };

  const player = state.players[pi]!;
  const card = player.cards.faceDown.find(c => c.id === cardId);
  if (!card) return { room, events, error: 'Card not found' };

  // Remove card from face-down
  const updatedPlayers = [...state.players];
  updatedPlayers[pi] = {
    ...player,
    cards: {
      ...player.cards,
      faceDown: player.cards.faceDown.filter(c => c.id !== cardId),
    },
  };
  state = { ...state, players: updatedPlayers };

  const canBePlayed = canPlay([card], state.discardPile, state.mustPlayLower);
  events.push({ type: 'blind_flip', payload: { playerId, card, success: canBePlayed } });

  if (!canBePlayed) {
    // Card goes to hand; player also picks up the pile
    const pileCount = state.discardPile.length;
    state = pickupPile(state, pi);
    const withCard = [...state.players];
    withCard[pi] = {
      ...withCard[pi]!,
      cards: { ...withCard[pi]!.cards, hand: [...withCard[pi]!.cards.hand, card] },
    };
    state = { ...state, players: withCard };
    state = advanceTurn(state);
    events.push({ type: 'pile_picked_up', payload: { playerId, cardCount: pileCount } });
    return { room: { ...room, gameState: state }, events };
  }

  const { state: afterPlay, events: playEvents } = applyCardPlay(state, pi, [card]);
  state = afterPlay;
  events.push(...playEvents);

  const { state: afterWin, won } = checkWin(state, playerId);
  state = afterWin;
  if (won) events.push({ type: 'player_won', payload: { playerId } });

  return { room: { ...room, gameState: state }, events };
}

export function processSlam(room: Room, playerId: string, cardIds: string[]): ProcessResult {
  let state = room.gameState;
  const events: GameEvent[] = [];

  const pi = findPlayerIndex(state, playerId);
  if (pi === -1) return { room, events, error: 'Player not found' };

  // Slammer must NOT be the current player
  const isCurrentPlayer = state.players[state.currentPlayerIndex]!.id === playerId;
  if (isCurrentPlayer) return { room, events, error: 'Cannot slam on your own turn' };

  const { player, removed } = removeCardsFromPlayer(state.players[pi]!, cardIds);

  if (removed.length === 0) return { room, events, error: 'Cards not found' };
  if (!isSameRank(removed)) return { room, events, error: 'Must slam with cards of the same rank' };

  const run = getTopPileRun(state.discardPile);
  if (!run) return { room, events, error: 'No cards on pile to slam on' };

  const needed = 4 - run.count;
  if (removed.length !== needed || removed[0]!.rank !== run.rank) {
    return { room, events, error: `Slam must complete exactly 4 of a kind (need ${needed} × ${run.rank})` };
  }

  // Verify this player is slam-eligible
  const eligible = getSlamEligiblePlayerIds(state);
  if (!eligible.includes(playerId)) {
    return { room, events, error: 'You are not eligible to slam' };
  }

  // Apply slam cards to the pile
  const updatedPlayers = [...state.players];
  updatedPlayers[pi] = player;
  state = { ...state, players: updatedPlayers };

  state = { ...state, discardPile: [...state.discardPile, ...removed] };

  // Burn the pile (4-of-a-kind)
  const burned = [...state.discardPile];
  state = {
    ...state,
    burnedCards: [...state.burnedCards, ...burned],
    discardPile: [],
    mustPlayLower: false,
  };
  events.push({ type: 'cards_burned', payload: { cards: burned, reason: 'four_of_kind' } });

  // Slammer becomes current player (they play again to start new pile)
  state = { ...state, currentPlayerIndex: pi };

  // Check win (unlikely but possible if they used their last cards)
  const { state: afterWin, won } = checkWin(state, playerId);
  state = afterWin;
  if (won) events.push({ type: 'player_won', payload: { playerId } });

  return { room: { ...room, gameState: state }, events };
}
