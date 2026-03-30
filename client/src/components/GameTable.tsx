import { ClientGameState } from '@shared/types';
import PlayerSlot from './PlayerSlot';
import PileArea from './PileArea';
import TurnIndicator from './TurnIndicator';
import MyPlayerArea from './MyPlayerArea';

interface GameTableProps {
  gameState: ClientGameState;
}

export default function GameTable({ gameState }: GameTableProps) {
  const { players, myPlayerId } = gameState;
  const opponents = players.filter(p => p.id !== myPlayerId);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Opponents row */}
      <div className="flex justify-center gap-4 px-2 pt-3 pb-2 bg-felt-dark/80 overflow-x-auto flex-shrink-0">
        {opponents.length === 0 ? (
          <p className="text-xs text-green-600">No opponents yet</p>
        ) : (
          opponents.map(p => (
            <PlayerSlot key={p.id} player={p} gameState={gameState} compact />
          ))
        )}
      </div>

      {/* Center: piles + turn indicator */}
      <div className="flex flex-col items-center justify-center flex-1 gap-3 py-2">
        <TurnIndicator gameState={gameState} />
        <PileArea gameState={gameState} />
      </div>

      {/* My area at bottom */}
      <div className="flex-shrink-0 border-t border-felt-light/30 pt-2 pb-safe">
        <MyPlayerArea gameState={gameState} />
      </div>
    </div>
  );
}
