import { ClientGameState } from '@shared/types';

interface TurnIndicatorProps {
  gameState: ClientGameState;
}

export default function TurnIndicator({ gameState }: TurnIndicatorProps) {
  const { players, currentPlayerIndex, myPlayerId, turnDirection } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const directionLabel = turnDirection === 1 ? '→' : '←';

  if (isMyTurn) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-bold text-sm shadow-lg shadow-yellow-400/40 animate-pulse scale-105">
          <span>Your Turn!</span>
        </div>
      </div>
    );
  }

  const initial = currentPlayer?.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/10 text-white/70 text-sm transition-all duration-300">
        <span className="w-5 h-5 rounded-full bg-felt-light flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {initial}
        </span>
        <span>{currentPlayer?.name ?? '...'}'s turn</span>
        <span className="text-white/30 text-xs">{directionLabel}</span>
      </div>
    </div>
  );
}
