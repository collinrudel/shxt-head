import { ClientGameState, ClientPlayer } from '@shared/types';
import Card from './Card';

interface PlayerSlotProps {
  player: ClientPlayer;
  gameState: ClientGameState;
  compact?: boolean;
}

export default function PlayerSlot({ player, gameState, compact }: PlayerSlotProps) {
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === player.id;
  const canSlam = gameState.slamEligiblePlayerIds.includes(player.id);

  if (player.hasWon) {
    return (
      <div className="flex flex-col items-center gap-1 opacity-60">
        <div className="text-2xl">🏆</div>
        <span className="text-xs text-yellow-400 font-bold">{player.name}</span>
        <span className="text-xs text-green-300">Won!</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-1 transition-all ${
        isCurrentTurn ? 'scale-105' : ''
      }`}
    >
      {/* Name badge */}
      <div
        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          isCurrentTurn
            ? 'bg-yellow-400 text-black'
            : canSlam
            ? 'bg-orange-500 text-white'
            : 'bg-felt-light text-green-100'
        }`}
      >
        {player.name}
        {canSlam && ' ⚡'}
      </div>

      {/* Card stacks — face-down row */}
      <div className="flex gap-0.5">
        {Array.from({ length: player.faceDownCount }).map((_, i) => (
          <Card key={i} faceDown size={compact ? 'sm' : 'sm'} />
        ))}
        {player.faceDownCount === 0 && player.faceUpCards.length === 0 && player.handCount === 0 && (
          <span className="text-xs text-green-500">No cards</span>
        )}
      </div>

      {/* Face-up cards — visible to all */}
      {player.faceUpCards.length > 0 && (
        <div className="flex gap-0.5">
          {player.faceUpCards.map(card => (
            <Card key={card.id} card={card} size="sm" />
          ))}
        </div>
      )}

      {/* Hand count */}
      {player.handCount > 0 && (
        <span className="text-xs text-green-300">
          {player.handCount} in hand
        </span>
      )}
    </div>
  );
}
