import { ClientGameState } from '@shared/types';

interface TurnIndicatorProps {
  gameState: ClientGameState;
}

export default function TurnIndicator({ gameState }: TurnIndicatorProps) {
  const { players, currentPlayerIndex, myPlayerId, turnDirection } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const directionLabel = turnDirection === 1 ? '→' : '←';

  return (
    <div className="text-center">
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
          isMyTurn
            ? 'bg-yellow-400 text-black animate-pulse-slow'
            : 'bg-felt text-green-200 border border-felt-light'
        }`}
      >
        <span>{directionLabel}</span>
        <span>{isMyTurn ? 'Your Turn!' : `${currentPlayer?.name ?? '...'}'s turn`}</span>
      </div>
    </div>
  );
}
