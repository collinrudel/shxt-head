import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';
import { Card as CardType, SwapInstruction } from '@shared/types';
import Card from '@/components/Card';

export default function SwapPage() {
  const navigate = useNavigate();
  const actions = useGameActions();
  const { gameState, addToast } = useGameStore();
  const myPlayerId = gameState?.myPlayerId;

  const [selectedHandId, setSelectedHandId] = useState<string | null>(null);
  const [swaps, setSwaps] = useState<SwapInstruction[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!gameState) navigate('/');
  }, [gameState, navigate]);

  if (!gameState) return null;

  const me = gameState.players.find(p => p.id === myPlayerId);
  if (!me?.myCards) return null;

  // Build the current card state with swaps applied (for preview), sorted 2→A
  let previewHand = [...me.myCards.hand].sort((a, b) => a.value - b.value);
  let previewFaceUp = [...me.myCards.faceUp].sort((a, b) => a.value - b.value);
  for (const swap of swaps) {
    const hi = previewHand.findIndex(c => c.id === swap.handCardId);
    const fi = previewFaceUp.findIndex(c => c.id === swap.faceUpCardId);
    if (hi !== -1 && fi !== -1) {
      [previewHand[hi], previewFaceUp[fi]] = [previewFaceUp[fi]!, previewHand[hi]!];
    }
  }

  const handleHandClick = (card: CardType) => {
    if (confirmed) return;
    setSelectedHandId(prev => (prev === card.id ? null : card.id));
  };

  const handleFaceUpClick = (card: CardType) => {
    if (confirmed || !selectedHandId) return;

    // Check if already swapped
    const existingSwapIndex = swaps.findIndex(
      s => s.handCardId === selectedHandId || s.faceUpCardId === card.id
    );

    if (existingSwapIndex !== -1) {
      // Remove existing swap involving these cards
      setSwaps(prev => prev.filter((_, i) => i !== existingSwapIndex));
    } else {
      setSwaps(prev => [...prev, { handCardId: selectedHandId!, faceUpCardId: card.id }]);
    }
    setSelectedHandId(null);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    actions.confirmSwap(swaps);
    addToast('Confirmed! Waiting for other players...', 'info');
  };

  const mySwappedHandIds = new Set(swaps.map(s => s.handCardId));
  const mySwappedFaceUpIds = new Set(swaps.map(s => s.faceUpCardId));

  const waitingFor = gameState.players.filter(p => !p.swapConfirmed).map(p => p.name);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-black text-center mb-1">
          <span className="text-yellow-400">Swap Phase</span>
        </h2>
        <p className="text-center text-sm text-green-300 mb-6">
          {confirmed
            ? `Waiting for: ${waitingFor.join(', ')}`
            : selectedHandId
            ? 'Now tap a face-up card to swap with'
            : 'Tap a hand card, then a face-up card to swap them'}
        </p>

        {/* Face-up cards */}
        <div className="mb-6">
          <p className="text-xs text-green-400 mb-2 text-center">Face-up cards</p>
          <div className="flex justify-center gap-3">
            {previewFaceUp.map(card => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handleFaceUpClick(card)}
                selected={mySwappedFaceUpIds.has(card.id)}
                disabled={confirmed}
                size="lg"
              />
            ))}
          </div>
        </div>

        <div className="text-center text-green-400 text-2xl mb-6">↕</div>

        {/* Hand cards */}
        <div className="mb-8">
          <p className="text-xs text-green-400 mb-2 text-center">Your hand</p>
          <div className="flex justify-center gap-3">
            {previewHand.map(card => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handleHandClick(card)}
                selected={selectedHandId === card.id || mySwappedHandIds.has(card.id)}
                disabled={confirmed}
                size="lg"
              />
            ))}
          </div>
        </div>

        {/* Face-down cards (shown as backs) */}
        <div className="mb-8">
          <p className="text-xs text-green-400 mb-2 text-center">Face-down cards (hidden)</p>
          <div className="flex justify-center gap-3">
            {me.myCards.faceDown.map(card => (
              <Card key={card.id} faceDown size="lg" />
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={confirmed}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-4 rounded-xl text-lg transition-colors"
        >
          {confirmed ? 'Confirmed — waiting...' : `Confirm (${swaps.length} swap${swaps.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
