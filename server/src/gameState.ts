import { ClientGameState, ClientPlayer, GameState, Player } from 'shxthead-shared';
import { getSlamEligiblePlayerIds } from './rules/turnAdvance';

export function buildClientState(state: GameState, forPlayerId: string): ClientGameState {
  const slamEligiblePlayerIds = getSlamEligiblePlayerIds(state);

  const players: ClientPlayer[] = state.players.map((p: Player) => {
    const isMe = p.id === forPlayerId;
    return {
      id: p.id,
      name: p.name,
      isReady: p.isReady,
      swapConfirmed: p.swapConfirmed,
      hasWon: p.hasWon,
      handCount: p.cards.hand.length,
      faceUpCards: p.cards.faceUp,   // visible to everyone
      faceDownCount: p.cards.faceDown.length,
      myCards: isMe ? p.cards : undefined,
    };
  });

  return {
    roomId: state.roomId,
    phase: state.phase,
    players,
    currentPlayerIndex: state.currentPlayerIndex,
    turnDirection: state.turnDirection,
    drawPileCount: state.drawPile.length,
    discardPile: state.discardPile,
    mustPlayLower: state.mustPlayLower,
    winnerId: state.winnerId,
    myPlayerId: forPlayerId,
    slamEligiblePlayerIds,
  };
}
