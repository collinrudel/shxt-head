import { ClientGameState } from '@shared/types';
import Card from './Card';

interface PileAreaProps {
  gameState: ClientGameState;
}

export default function PileArea({ gameState }: PileAreaProps) {
  const { drawPileCount, discardPile } = gameState;
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex items-end gap-8 justify-center">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] tracking-widest text-white/30 uppercase font-semibold">Draw</p>
        <div className="relative">
          {drawPileCount > 1 && (
            <div className="absolute top-0.5 left-0.5 w-12 h-16 bg-indigo-900 border border-blue-700/60 rounded-xl" />
          )}
          {drawPileCount > 0 ? (
            <div className="relative">
              <Card faceDown size="md" />
            </div>
          ) : (
            <div className="w-12 h-16 rounded-xl border border-dashed border-white/15 flex items-center justify-center">
              <span className="text-white/20 text-lg">∅</span>
            </div>
          )}
        </div>
        <span className="text-xs text-green-200/60">{drawPileCount} left</span>
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[10px] tracking-widest text-white/30 uppercase font-semibold">Pile</p>
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
            <div className="w-12 h-16 rounded-xl border border-dashed border-white/15 flex items-center justify-center">
              <span className="text-white/20 text-xl">+</span>
            </div>
          )}
        </div>
        <span className="text-xs text-green-200/60">
          {discardPile.length > 0 ? `${discardPile.length} card${discardPile.length !== 1 ? 's' : ''}` : 'empty'}
        </span>
      </div>
    </div>
  );
}
