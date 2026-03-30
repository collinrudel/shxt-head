import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '@/socket';
import { useGameStore } from '@/store/gameStore';

export function useSocketEvents() {
  const navigate = useNavigate();
  const { setRoomState, setGameState, addToast, gameState } = useGameStore();

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try {
      socket = getSocket();
    } catch {
      return;
    }

    socket.on('room:updated', (state) => {
      setRoomState(state);
    });

    socket.on('game:state_update', (state) => {
      setGameState(state);
      if (state.phase === 'swap') navigate('/swap');
      else if (state.phase === 'playing') navigate('/game');
      else if (state.phase === 'game_over') navigate('/game');
    });

    socket.on('game:error', ({ message }) => addToast(message, 'error'));
    socket.on('room:error', ({ message }) => addToast(message, 'error'));

    socket.on('game:cards_burned', ({ reason }) => {
      addToast(reason === 'ten_played' ? 'Pile burned by 10!' : '4 of a kind — pile burned!', 'success');
    });

    socket.on('game:pile_picked_up', ({ playerId, cardCount }) => {
      const name = gameState?.players.find(p => p.id === playerId)?.name ?? 'Someone';
      addToast(`${name} picked up ${cardCount} card${cardCount !== 1 ? 's' : ''}`, 'info');
    });

    socket.on('game:player_won', ({ playerId }) => {
      const name = gameState?.players.find(p => p.id === playerId)?.name ?? 'Someone';
      addToast(`${name} wins!`, 'success');
    });

    socket.on('game:blind_flip', ({ card, success }) => {
      if (!success) addToast(`Blind flip: ${card.rank} — can't play it!`, 'error');
    });

    socket.on('lobby:invited', ({ roomId, inviterName }) => {
      addToast(`${inviterName} invited you to a game! Tap to join.`, 'info');
      // Navigate to join page — user can tap the toast
      setTimeout(() => navigate(`/join/${roomId}`), 100);
    });

    return () => {
      socket.off('room:updated');
      socket.off('game:state_update');
      socket.off('game:error');
      socket.off('room:error');
      socket.off('game:cards_burned');
      socket.off('game:pile_picked_up');
      socket.off('game:player_won');
      socket.off('game:blind_flip');
      socket.off('lobby:invited');
    };
  }, [navigate, setRoomState, setGameState, addToast, gameState]);
}
