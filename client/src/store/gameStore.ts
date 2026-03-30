import { create } from 'zustand';
import { ClientGameState, ClientRoomState } from '@shared/types';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

interface GameStore {
  // Room state (lobby phase)
  roomState: ClientRoomState | null;
  setRoomState: (state: ClientRoomState) => void;

  // Game state (playing)
  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState) => void;

  // Local player identity
  myPlayerId: string | null;
  myName: string | null;
  setMyIdentity: (id: string, name: string) => void;

  // Current room ID (persisted for reconnect)
  currentRoomId: string | null;
  setCurrentRoomId: (id: string | null) => void;

  // UI state
  selectedCardIds: string[];
  toggleCardSelection: (cardId: string, allowMultiple: boolean) => void;
  clearSelection: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Reset
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),

  gameState: null,
  setGameState: (state) => set({ gameState: state, selectedCardIds: [] }),

  myPlayerId: null,
  myName: null,
  setMyIdentity: (id, name) => set({ myPlayerId: id, myName: name }),

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
      // Multi-select: only allowed if same rank as already selected cards
      const gameState = store.gameState;
      if (!gameState || current.length === 0) {
        return { selectedCardIds: [cardId] };
      }
      const myCards = gameState.players.find(p => p.id === store.myPlayerId)?.myCards;
      if (!myCards) return { selectedCardIds: [cardId] };

      const allMyCards = [...myCards.hand, ...myCards.faceUp, ...myCards.faceDown];
      const selectedCard = allMyCards.find(c => c.id === cardId);
      const firstSelected = allMyCards.find(c => c.id === current[0]);
      if (!selectedCard || !firstSelected) return { selectedCardIds: [cardId] };

      if (selectedCard.rank !== firstSelected.rank) {
        // Different rank: start fresh selection
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
      setTimeout(() => {
        store.removeToast(id);
      }, 4000);
      return { toasts: [...store.toasts, toast] };
    }),
  removeToast: (id) =>
    set((store) => ({ toasts: store.toasts.filter(t => t.id !== id) })),

  reset: () =>
    set({
      roomState: null,
      gameState: null,
      currentRoomId: null,
      selectedCardIds: [],
      toasts: [],
    }),
}));
