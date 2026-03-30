import { create } from 'zustand';
import { ClientGameState, ClientRoomState } from '@shared/types';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

interface GameStore {
  roomState: ClientRoomState | null;
  setRoomState: (state: ClientRoomState) => void;

  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState) => void;

  currentRoomId: string | null;
  setCurrentRoomId: (id: string | null) => void;

  selectedCardIds: string[];
  toggleCardSelection: (cardId: string, allowMultiple: boolean) => void;
  clearSelection: () => void;

  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),

  gameState: null,
  setGameState: (state) => set({ gameState: state, selectedCardIds: [] }),

  currentRoomId: null,
  setCurrentRoomId: (id) => set({ currentRoomId: id }),

  selectedCardIds: [],
  toggleCardSelection: (cardId, allowMultiple) =>
    set((store) => {
      const current = store.selectedCardIds;
      if (current.includes(cardId)) {
        return { selectedCardIds: current.filter(id => id !== cardId) };
      }
      if (!allowMultiple) {
        return { selectedCardIds: [cardId] };
      }
      const gameState = store.gameState;
      if (!gameState || current.length === 0) {
        return { selectedCardIds: [cardId] };
      }
      const myPlayerId = gameState.myPlayerId;
      const myCards = gameState.players.find(p => p.id === myPlayerId)?.myCards;
      if (!myCards) return { selectedCardIds: [cardId] };

      const allMyCards = [...myCards.hand, ...myCards.faceUp, ...myCards.faceDown];
      const selectedCard = allMyCards.find(c => c.id === cardId);
      const firstSelected = allMyCards.find(c => c.id === current[0]);
      if (!selectedCard || !firstSelected) return { selectedCardIds: [cardId] };

      if (selectedCard.rank !== firstSelected.rank) {
        return { selectedCardIds: [cardId] };
      }
      return { selectedCardIds: [...current, cardId] };
    }),
  clearSelection: () => set({ selectedCardIds: [] }),

  toasts: [],
  addToast: (message, type = 'info') =>
    set((store) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, message, type };
      setTimeout(() => { store.removeToast(id); }, 4000);
      return { toasts: [...store.toasts, toast] };
    }),
  removeToast: (id) =>
    set((store) => ({ toasts: store.toasts.filter(t => t.id !== id) })),

  reset: () => set({ roomState: null, gameState: null, currentRoomId: null, selectedCardIds: [], toasts: [] }),
}));
