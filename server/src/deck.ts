import { Card, PlayerCards, Rank, Suit } from 'shxthead-shared';
import { RANK_VALUES } from 'shxthead-shared';

export function createDeck(numDecks: number = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        cards.push({
          id: `${d}_${suit}_${rank}`,
          suit,
          rank,
          value: RANK_VALUES[rank],
        });
      }
    }
  }
  return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export interface DealResult {
  playerCards: PlayerCards[];
  remainingDeck: Card[];
}

export function dealCards(deck: Card[], playerCount: number): DealResult {
  const playerCards: PlayerCards[] = Array.from({ length: playerCount }, () => ({
    hand: [],
    faceUp: [],
    faceDown: [],
  }));

  const deckCopy = [...deck];

  // Deal 3 face-down cards to each player
  for (let i = 0; i < playerCount; i++) {
    playerCards[i]!.faceDown = deckCopy.splice(0, 3);
  }
  // Deal 3 face-up cards to each player
  for (let i = 0; i < playerCount; i++) {
    playerCards[i]!.faceUp = deckCopy.splice(0, 3);
  }
  // Deal 3 hand cards to each player
  for (let i = 0; i < playerCount; i++) {
    playerCards[i]!.hand = deckCopy.splice(0, 3);
  }

  return { playerCards, remainingDeck: deckCopy };
}
