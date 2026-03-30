import { Rank } from './types';

export const RANK_VALUES: Record<Rank, number> = {
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 11,
  [Rank.Queen]: 12,
  [Rank.King]: 13,
  [Rank.Ace]: 14,
};

// Cards that are skipped when finding the effective top card for comparison.
// Only 5 is transparent: next player must beat whatever was under the 5.
// 2 is NOT transparent: it resets the pile (value 2 becomes the new floor, any card can follow).
export const TRANSPARENT_RANKS = new Set<Rank>([Rank.Five]);
