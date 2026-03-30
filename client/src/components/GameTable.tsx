import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientGameState } from '@shared/types';
import PlayerSlot from './PlayerSlot';
import PileArea from './PileArea';
import TurnIndicator from './TurnIndicator';
import MyPlayerArea from './MyPlayerArea';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameStore } from '@/store/gameStore';

interface GameTableProps {
  gameState: ClientGameState;
}

export default function GameTable({ gameState }: GameTableProps) {
  const { players, myPlayerId } = gameState;
  const opponents = players.filter(p => p.id !== myPlayerId);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const navigate = useNavigate();
  const actions = useGameActions();
  const reset = useGameStore(s => s.reset);

  const handleLeave = () => {
    actions.leaveRoom();
    reset();
    navigate('/');
  };

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
      <div className="flex flex-col items-center justify-center flex-1 gap-3 py-2 relative">
        {/* Exit button */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="absolute top-2 left-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white/80 text-sm transition-all"
          aria-label="Leave game"
        >
          ✕
        </button>

        <TurnIndicator gameState={gameState} />
        <PileArea gameState={gameState} />
      </div>

      {/* My area at bottom */}
      <div className="flex-shrink-0 border-t border-felt-light/30 pt-2 pb-safe">
        <MyPlayerArea gameState={gameState} />
      </div>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-felt rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-black text-white text-lg mb-1">Leave the game?</h3>
            <p className="text-white/40 text-sm mb-6">Your cards will be removed and you won't be able to rejoin.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLeave}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3.5 rounded-2xl transition-colors"
              >
                Leave Game
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
