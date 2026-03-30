import { Card, Rank } from 'shxthead-shared';
import { TRANSPARENT_RANKS } from 'shxthead-shared';

// Walks backwards through the pile, skipping transparent cards (2s and 5s),
// to find the card that determines what must be beaten.
export function getEffectiveTopCard(discardPile: Card[]): Card | null {
  for (let i = discardPile.length - 1; i >= 0; i--) {
    if (!TRANSPARENT_RANKS.has(discardPile[i]!.rank)) {
      return discardPile[i]!;
    }
  }
  return null; // pile is empty or all transparent — anything can be played
}

export function isSameRank(cards: Card[]): boolean {
  if (cards.length === 0) return false;
  const first = cards[0]!.rank;
  return cards.every(c => c.rank === first);
}

export function canPlay(cards: Card[], discardPile: Card[], mustPlayLower: boolean): boolean {
  if (cards.length === 0) return false;
  if (!isSameRank(cards)) return false;

  const rank = cards[0]!.rank;

  // 2, 5, and 10 are always playable regardless of what's on the pile
  if (rank === Rank.Two || rank === Rank.Five || rank === Rank.Ten) return true;

  const effectiveTop = getEffectiveTopCard(discardPile);

  // Pile is empty or all-transparent → anything can be played
  if (effectiveTop === null) return true;

  if (mustPlayLower) {
    // After a 7: must play 7 or lower
    return cards[0]!.value <= 7;
  }

  return cards[0]!.value >= effectiveTop.value;
}

// Returns info about the consecutive same-rank run at the top of the pile.
// Used for slam eligibility and burn detection.
export function getTopPileRun(discardPile: Card[]): { rank: Rank; count: number } | null {
  if (discardPile.length === 0) return null;
  const topRank = discardPile[discardPile.length - 1]!.rank;
  let count = 0;
  for (let i = discardPile.length - 1; i >= 0; i--) {
    if (discardPile[i]!.rank === topRank) {
      count++;
    } else {
      break;
    }
  }
  return { rank: topRank, count };
}
