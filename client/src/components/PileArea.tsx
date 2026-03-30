import { ClientGameState } from '@shared/types';
import Card from './Card';

interface PileAreaProps {
  gameState: ClientGameState;
}

export default function PileArea({ gameState }: PileAreaProps) {
  const { drawPileCount, discardPile } = gameState;
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-6 justify-center">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            {drawPileCount > 1 && (
              <div className="absolute top-0.5 left-0.5 w-12 h-16 bg-blue-900 border-2 border-green-700 rounded-lg" />
            )}
            {drawPileCount > 0 ? (
              <div className="relative">
                <Card faceDown size="md" />
              </div>
            ) : (
              <div className="w-12 h-16 rounded-lg border-2 border-dashed border-green-600 flex items-center justify-center">
                <span className="text-green-600 text-lg">∅</span>
              </div>
            )}
          </div>
          <span className="text-xs text-green-300">{drawPileCount} left</span>
        </div>

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-12 h-16">
            {discardPile.length > 1 && (
              <div className="absolute top-0.5 left-0.5">
                <Card card={discardPile[discardPile.length - 2]} size="md" dimmed />
              </div>
            )}
            {topCard ? (
              <div className="relative">
                <Card card={topCard} size="md" />
              </div>
            ) : (
              <div className="w-12 h-16 rounded-lg border-2 border-dashed border-green-600 flex items-center justify-center">
                <span className="text-green-600 text-xs text-center leading-tight">Play here</span>
              </div>
            )}
          </div>
          <span className="text-xs text-green-300">
            {discardPile.length > 0 ? `${discardPile.length} card${discardPile.length !== 1 ? 's' : ''}` : 'empty'}
          </span>
        </div>
      </div>
    </div>
  );
}
