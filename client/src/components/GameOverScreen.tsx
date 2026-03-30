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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-felt rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">{iWon ? '🏆' : '😔'}</div>
        <h2 className="text-2xl font-black mb-2">
          {iWon ? 'You Win!' : `${winner?.name ?? 'Someone'} Wins!`}
        </h2>
        <p className="text-green-300 text-sm mb-8">
          {iWon ? 'You got rid of all your cards first!' : 'Better luck next time!'}
        </p>

        <div className="flex flex-col gap-3">
          {isHost && (
            <button
              onClick={handlePlayAgain}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-4 rounded-xl text-lg"
            >
              Play Again
            </button>
          )}
          <button
            onClick={handleLeave}
            className="w-full bg-felt-light hover:bg-green-700 text-white font-bold py-3 rounded-xl"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
