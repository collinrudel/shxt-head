import { useState } from 'react';
import { ClientGameState, Card as CardType } from '@shared/types';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';
import Card from './Card';

interface MyPlayerAreaProps {
  gameState: ClientGameState;
}

function getPlayerPhase(gameState: ClientGameState): 'hand' | 'faceUp' | 'faceDown' {
  const me = gameState.players.find(p => p.id === gameState.myPlayerId);
  if (!me?.myCards) return 'hand';
  if (me.myCards.hand.length > 0) return 'hand';
  if (gameState.drawPileCount > 0) return 'hand'; // will draw back up
  if (me.myCards.faceUp.length > 0) return 'faceUp';
  return 'faceDown';
}

export default function MyPlayerArea({ gameState }: MyPlayerAreaProps) {
  const { selectedCardIds, toggleCardSelection, clearSelection } = useGameStore();
  const actions = useGameActions();
  const [pendingFaceDown, setPendingFaceDown] = useState<CardType | null>(null);

  const me = gameState.players.find(p => p.id === gameState.myPlayerId);
  if (!me?.myCards) return null;

  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === gameState.myPlayerId;
  const canSlam = gameState.slamEligiblePlayerIds.includes(gameState.myPlayerId);
  const phase = getPlayerPhase(gameState);

  const handleCardClick = (card: CardType, source: 'hand' | 'faceUp' | 'faceDown') => {
    if (source === 'faceDown') {
      if (!isMyTurn) return;
      // Show confirmation
      setPendingFaceDown(card);
      return;
    }

    if (!isMyTurn && !canSlam) return;

    if (canSlam && !isMyTurn) {
      // In slam mode: toggle selection
      toggleCardSelection(card.id, true);
      return;
    }

    if (isMyTurn && (phase === 'hand' || phase === 'faceUp')) {
      toggleCardSelection(card.id, true);
    }
  };

  const handlePlay = () => {
    if (selectedCardIds.length === 0) return;
    actions.playCards(selectedCardIds);
    clearSelection();
  };

  const handleSlam = () => {
    if (selectedCardIds.length === 0) return;
    actions.slam(selectedCardIds);
    clearSelection();
  };

  const handlePickup = () => {
    actions.pickupPile();
    clearSelection();
  };

  const handleFaceDownConfirm = () => {
    if (!pendingFaceDown) return;
    actions.playFaceDown(pendingFaceDown.id);
    setPendingFaceDown(null);
  };

  const { hand, faceUp, faceDown } = me.myCards;

  return (
    <div className="relative">
      {/* Face-down blind play confirmation modal */}
      {pendingFaceDown && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-felt rounded-2xl p-6 w-full max-w-xs text-center">
            <p className="text-white font-bold mb-2">Play blind card?</p>
            <p className="text-green-300 text-sm mb-6">You cannot see this card. If it can't be played, you pick up the pile.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingFaceDown(null)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleFaceDownConfirm}
                className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-bold"
              >
                Play it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 px-2">
        {/* Face-down row */}
        <div>
          <p className="text-xs text-green-500 text-center mb-1">
            Face-down {phase === 'faceDown' ? '(tap to play blind)' : ''}
          </p>
          <div className="flex justify-center gap-2">
            {faceDown.map(card => (
              <Card
                key={card.id}
                faceDown
                size="md"
                onClick={() => handleCardClick(card, 'faceDown')}
                disabled={!isMyTurn || phase !== 'faceDown'}
                dimmed={phase !== 'faceDown'}
              />
            ))}
            {faceDown.length === 0 && (
              <span className="text-xs text-green-700">empty</span>
            )}
          </div>
        </div>

        {/* Face-up row */}
        <div>
          <p className="text-xs text-green-500 text-center mb-1">
            Face-up {phase === 'faceUp' ? '(tap to play)' : ''}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {faceUp.map(card => (
              <Card
                key={card.id}
                card={card}
                size="md"
                selected={selectedCardIds.includes(card.id)}
                onClick={() => handleCardClick(card, 'faceUp')}
                disabled={(!isMyTurn && !canSlam) || phase !== 'faceUp'}
                dimmed={phase !== 'faceUp'}
              />
            ))}
            {faceUp.length === 0 && (
              <span className="text-xs text-green-700">empty</span>
            )}
          </div>
        </div>

        {/* Hand */}
        <div>
          <p className="text-xs text-green-500 text-center mb-1">
            Hand {phase === 'hand' ? '(select to play)' : ''}
          </p>
          <div className="flex justify-center gap-1 flex-wrap">
            {hand.map(card => (
              <Card
                key={card.id}
                card={card}
                size="md"
                selected={selectedCardIds.includes(card.id)}
                onClick={() => handleCardClick(card, 'hand')}
                disabled={(!isMyTurn && !canSlam) || phase !== 'hand'}
                dimmed={phase !== 'hand'}
              />
            ))}
            {hand.length === 0 && (
              <span className="text-xs text-green-700">empty</span>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex gap-2 pt-1">
          {canSlam && !isMyTurn ? (
            <>
              <button
                onClick={() => clearSelection()}
                className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSlam}
                disabled={selectedCardIds.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm"
              >
                ⚡ Slam!
              </button>
            </>
          ) : isMyTurn ? (
            <>
              <button
                onClick={handlePickup}
                disabled={gameState.discardPile.length === 0}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white py-3 rounded-xl font-bold text-sm"
              >
                Pick Up
              </button>
              <button
                onClick={handlePlay}
                disabled={selectedCardIds.length === 0 || phase === 'faceDown'}
                className="flex-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black py-3 px-6 rounded-xl font-bold text-sm"
              >
                Play {selectedCardIds.length > 0 ? `(${selectedCardIds.length})` : 'Cards'}
              </button>
            </>
          ) : (
            <div className="flex-1 text-center text-sm text-green-500 py-3">
              Waiting for your turn...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
