import { Card, GameState, Rank, SwapInstruction } from 'shxthead-shared';
import { canPlay } from './rules/cardComparison';

export type BotAction =
  | { type: 'play'; cardIds: string[] }
  | { type: 'pickup' }
  | { type: 'faceDown'; cardId: string };

// Priority rank for face-up positions (higher = more desirable as face-up card)
const FACEUP_PRIORITY: Partial<Record<Rank, number>> = {
  [Rank.Ten]: 13,
  [Rank.Two]: 12,
  [Rank.Five]: 11,
  [Rank.Ace]: 10,
  [Rank.King]: 9,
  [Rank.Jack]: 8,
  [Rank.Queen]: 7,
  [Rank.Nine]: 6,
  [Rank.Eight]: 5,
  [Rank.Six]: 4,
  [Rank.Seven]: 3,
  [Rank.Four]: 2,
  [Rank.Three]: 1,
};

function faceUpPriority(card: Card): number {
  return FACEUP_PRIORITY[card.rank] ?? 0;
}

export function decideBotSwaps(hand: Card[], faceUp: Card[]): SwapInstruction[] {
  // Pool all 6 cards and sort by priority descending
  const all = [...hand, ...faceUp].sort((a, b) => faceUpPriority(b) - faceUpPriority(a));

  // Top 3 should be face-up
  const desiredFaceUp = new Set(all.slice(0, 3).map(c => c.id));

  // Build swaps: any hand card that should be face-up paired with a face-up card that should be in hand
  const handShouldBeFaceUp = hand.filter(c => desiredFaceUp.has(c.id));
  const faceUpShouldBeHand = faceUp.filter(c => !desiredFaceUp.has(c.id));

  const swaps: SwapInstruction[] = [];
  const count = Math.min(handShouldBeFaceUp.length, faceUpShouldBeHand.length);
  for (let i = 0; i < count; i++) {
    swaps.push({
      handCardId: handShouldBeFaceUp[i]!.id,
      faceUpCardId: faceUpShouldBeHand[i]!.id,
    });
  }
  return swaps;
}

function getPlayerPhase(state: GameState, playerId: string): 'hand' | 'faceUp' | 'faceDown' | null {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return null;
  if (state.drawPile.length > 0 || player.cards.hand.length > 0) return 'hand';
  if (player.cards.faceUp.length > 0) return 'faceUp';
  if (player.cards.faceDown.length > 0) return 'faceDown';
  return null;
}

export function decideBotMove(state: GameState, botId: string): BotAction {
  const player = state.players.find(p => p.id === botId);
  if (!player) return { type: 'pickup' };

  const phase = getPlayerPhase(state, botId);

  if (phase === 'faceDown') {
    return { type: 'faceDown', cardId: player.cards.faceDown[0]!.id };
  }

  const available = phase === 'hand' ? player.cards.hand : player.cards.faceUp;
  if (available.length === 0) return { type: 'pickup' };

  // Group cards by rank
  const byRank = new Map<Rank, Card[]>();
  for (const card of available) {
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }

  // Filter to playable groups
  const playableGroups: Card[][] = [];
  for (const group of byRank.values()) {
    if (canPlay(group, state.discardPile, state.mustPlayLower)) {
      playableGroups.push(group);
    }
  }

  if (playableGroups.length === 0) return { type: 'pickup' };

  // Scoring: prefer 10 (burns pile), then largest group, then lowest value, avoid 7 unless only option
  const non7 = playableGroups.filter(g => g[0]!.rank !== Rank.Seven);
  const candidates = non7.length > 0 ? non7 : playableGroups;

  // Always prefer 10 if available and pile is non-empty
  if (state.discardPile.length > 0) {
    const ten = candidates.find(g => g[0]!.rank === Rank.Ten);
    if (ten) return { type: 'play', cardIds: ten.map(c => c.id) };
  }

  // Pick largest group; break ties by lowest card value
  const best = candidates.reduce((prev, curr) => {
    if (curr.length > prev.length) return curr;
    if (curr.length === prev.length && curr[0]!.value < prev[0]!.value) return curr;
    return prev;
  });

  return { type: 'play', cardIds: best.map(c => c.id) };
}
