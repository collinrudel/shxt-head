import { GameState, Player, Rank } from 'shxthead-shared';
import { getTopPileRun } from './cardComparison';

export function advanceTurn(state: GameState): GameState {
  const { players, currentPlayerIndex, turnDirection } = state;
  const total = players.length;

  let next = (currentPlayerIndex + turnDirection + total) % total;
  let attempts = 0;

  while (players[next]!.hasWon && attempts < total) {
    next = (next + turnDirection + total) % total;
    attempts++;
  }

  return {
    ...state,
    currentPlayerIndex: next,
    // mustPlayLower is intentionally NOT cleared here.
    // It persists until the next player takes their action (play or pickup).
    // Clearing here caused the 7 constraint to vanish before the affected player acted.
  };
}

export function drawToThree(state: GameState, playerId: string): GameState {
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return state;

  const player = state.players[playerIndex]!;
  const newHand = [...player.cards.hand];
  const newDrawPile = [...state.drawPile];

  while (newHand.length < 3 && newDrawPile.length > 0) {
    newHand.push(newDrawPile.shift()!);
  }

  const updatedPlayers = [...state.players];
  updatedPlayers[playerIndex] = {
    ...player,
    cards: { ...player.cards, hand: newHand },
  };

  return { ...state, players: updatedPlayers, drawPile: newDrawPile };
}

// Returns player IDs who can slam right now (complete a 4-of-a-kind with the current top pile run).
export function getSlamEligiblePlayerIds(state: GameState): string[] {
  const run = getTopPileRun(state.discardPile);
  if (!run) return [];

  const needed = 4 - run.count;
  if (needed <= 0) return [];

  const currentPlayerId = state.players[state.currentPlayerIndex]!.id;

  return state.players
    .filter((p: Player) => p.id !== currentPlayerId && !p.hasWon)
    .filter((p: Player) => {
      const allCards = [...p.cards.hand, ...p.cards.faceUp, ...p.cards.faceDown];
      const matchCount = allCards.filter(c => c.rank === run.rank).length;
      return matchCount >= needed;
    })
    .map((p: Player) => p.id);
}
