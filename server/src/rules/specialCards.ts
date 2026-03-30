import { GameState, Rank } from 'shxthead-shared';

export interface SpecialEffectResult {
  state: GameState;
  skipNormalAdvance: boolean;
  burnTriggered: boolean;
}

export function applySpecialEffect(state: GameState, rank: Rank): SpecialEffectResult {
  let skipNormalAdvance = false;
  let burnTriggered = false;

  switch (rank) {
    case Rank.Two:
      // Transparent — resets effective top. No state change needed beyond placing the card.
      break;

    case Rank.Five:
      // Transparent — next player must beat whatever was under the 5.
      break;

    case Rank.Seven:
      // Next player must play lower than 7.
      state = { ...state, mustPlayLower: true };
      break;

    case Rank.Ten:
      // Burn the pile immediately; same player plays again.
      state = {
        ...state,
        burnedCards: [...state.burnedCards, ...state.discardPile],
        discardPile: [],
        mustPlayLower: false,
      };
      skipNormalAdvance = true;
      burnTriggered = true;
      break;

    case Rank.Jack:
      // Reverse turn direction.
      state = { ...state, turnDirection: state.turnDirection === 1 ? -1 : 1 };
      break;
  }

  return { state, skipNormalAdvance, burnTriggered };
}
