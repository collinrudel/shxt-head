import { useNavigate } from 'react-router-dom';
import { ClientGameState } from '@shared/types';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';

interface GameOverScreenProps {
  gameState: ClientGameState;
}

export default function GameOverScreen({ gameState }: GameOverScreenProps) {
  const navigate = useNavigate();
  const actions = useGameActions();
  const { roomState, reset } = useGameStore();
  const myPlayerId = gameState.myPlayerId;
  const isHost = roomState?.hostId === myPlayerId;
  const winner = gameState.players.find(p => p.id === gameState.winnerId);
  const iWon = gameState.winnerId === myPlayerId;

  const handlePlayAgain = () => {
    navigate('/lobby');
  };

  const handleLeave = () => {
    actions.leaveRoom();
    reset();
    navigate('/');
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-fade-in ${
      iWon
        ? 'bg-gradient-to-b from-yellow-900/95 via-felt-dark/98 to-felt-dark'
        : 'bg-gradient-to-b from-gray-900/95 via-felt-dark/98 to-felt-dark'
    }`}>
      <div className="text-center animate-scale-in">
        <div className={`text-8xl mb-6 ${iWon ? 'animate-bounce' : ''}`}>
          {iWon ? '🏆' : '😔'}
        </div>

        <h2 className="text-4xl font-black mb-2 tracking-tight">
          {iWon ? 'You Win!' : `${winner?.name ?? 'Someone'} Wins!`}
        </h2>

        <p className={`text-base mb-2 ${iWon ? 'text-yellow-400/80' : 'text-white/50'}`}>
          {iWon ? 'ShxtHead Champion' : 'The cards weren\'t kind.'}
        </p>

        <p className="text-white/30 text-sm mb-12">
          {iWon ? 'You got rid of all your cards first!' : 'Better luck next time!'}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          {isHost && (
            <button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-yellow-400/20"
            >
              Play Again
            </button>
          )}
          <button
            onClick={handleLeave}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-colors"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
