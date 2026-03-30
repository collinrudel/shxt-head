import { Card } from 'shxthead-shared';
import { getTopPileRun } from './cardComparison';

export function checkForBurn(discardPile: Card[]): boolean {
  const run = getTopPileRun(discardPile);
  return run !== null && run.count >= 4;
}
