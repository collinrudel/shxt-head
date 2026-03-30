import { getSocket } from '@/socket';
import { RoomConfig, SwapInstruction } from '@shared/types';

export function useGameActions() {
  const socket = getSocket();

  return {
    createRoom: (playerName: string, config: RoomConfig) =>
      new Promise<{ roomId: string }>((resolve, reject) => {
        socket.emit('room:create', { playerName, config }, (res) => {
          if (res.ok && res.data) resolve(res.data);
          else reject(new Error(res.error ?? 'Failed to create room'));
        });
      }),

    joinRoom: (roomId: string, playerName: string) =>
      new Promise<void>((resolve, reject) => {
        socket.emit('room:join', { roomId, playerName }, (res) => {
          if (res.ok) resolve();
          else reject(new Error(res.error ?? 'Failed to join room'));
        });
      }),

    leaveRoom: () => socket.emit('room:leave'),
    setReady: (ready: boolean) => socket.emit('lobby:ready', { ready }),
    updateConfig: (config: RoomConfig) => socket.emit('lobby:update_config', { config }),
    startGame: () => socket.emit('lobby:start_game'),
    confirmSwap: (swaps: SwapInstruction[]) => socket.emit('swap:confirm', { swaps }),
    playCards: (cardIds: string[]) => socket.emit('game:play_cards', { cardIds }),
    slam: (cardIds: string[]) => socket.emit('game:slam', { cardIds }),
    pickupPile: () => socket.emit('game:pickup_pile'),
    playFaceDown: (cardId: string) => socket.emit('game:play_facedown', { cardId }),
    inviteFriend: (friendUserId: string) => socket.emit('lobby:invite_friend', { friendUserId }),
  };
}
