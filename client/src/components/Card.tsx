import { Card as CardType, Suit } from '@shared/types';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
  [Suit.Spades]: '♠',
};

const RED_SUITS = new Set([Suit.Hearts, Suit.Diamonds]);

const SIZE_CLASSES = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-12 h-16 text-sm',
  lg: 'w-16 h-22 text-base',
};

export default function Card({ card, faceDown, selected, onClick, disabled, size = 'md', dimmed }: CardProps) {
  const sizeClass = SIZE_CLASSES[size];
  const isRed = card && RED_SUITS.has(card.suit);

  if (faceDown || !card) {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`
          ${sizeClass} rounded-xl border border-blue-700/60 flex items-center justify-center
          bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950
          card-shadow select-none
          ${selected ? 'card-shadow-selected -translate-y-3' : ''}
          ${dimmed ? 'opacity-50' : ''}
          ${onClick && !disabled ? 'cursor-pointer active:scale-95 transition-transform' : ''}
        `}
        style={{ minHeight: size === 'lg' ? '5.5rem' : undefined }}
      >
        <span className="text-blue-500/50 text-base select-none">✦</span>
      </div>
    );
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${sizeClass} rounded-xl border border-gray-100 flex flex-col justify-between p-1
        bg-white select-none
        ${selected ? 'card-shadow-selected -translate-y-3' : 'card-shadow'}
        ${dimmed ? 'opacity-40' : ''}
        ${onClick && !disabled ? 'cursor-pointer active:scale-95 transition-transform' : ''}
      `}
      style={{ minHeight: size === 'lg' ? '5.5rem' : undefined }}
    >
      <div className={`font-extrabold leading-none text-left ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      <div className={`font-extrabold leading-none text-right rotate-180 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  );
}
