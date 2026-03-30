import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import GameTable from '@/components/GameTable';
import GameOverScreen from '@/components/GameOverScreen';
import { GamePhase } from '@shared/types';

export default function GamePage() {
  const navigate = useNavigate();
  const gameState = useGameStore(s => s.gameState);

  useEffect(() => {
    if (!gameState) navigate('/');
  }, [gameState, navigate]);

  if (!gameState) return null;

  return (
    <div className="min-h-screen flex flex-col relative">
      <GameTable gameState={gameState} />
      {gameState.phase === GamePhase.GameOver && <GameOverScreen gameState={gameState} />}
    </div>
  );
}
