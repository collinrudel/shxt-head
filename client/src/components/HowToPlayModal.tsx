export default function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a3a24] rounded-3xl w-full max-w-sm animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-black text-white">How to Play</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pb-8 flex flex-col gap-6">

          <Section title="Goal">
            <p>Be the first player to get rid of all your cards — hand, face-up, and face-down.</p>
          </Section>

          <Section title="Setup">
            <p>Each player starts with <strong>9 cards</strong>: 3 placed face-down on the table (secret, even from you), 3 placed face-up on top of those, and 3 held in your hand.</p>
            <p>Before the game begins, you get a chance to <strong>swap</strong> any hand cards with your face-up cards to build the best possible table.</p>
          </Section>

          <Section title="Taking a Turn">
            <ul>
              <li>Play one or more cards <strong>of the same rank</strong> onto the discard pile.</li>
              <li>Your card(s) must be <strong>equal to or higher</strong> in value than the top card on the pile.</li>
              <li>After playing, draw from the deck to keep at least 3 cards in your hand — until the deck runs out.</li>
              <li>If you <strong>can't play</strong> (or choose not to), pick up the entire discard pile into your hand.</li>
            </ul>
          </Section>

          <Section title="Card Phases">
            <p>You move through three phases as you run out of cards:</p>
            <ol>
              <li><strong>Hand</strong> — play normally from your hand.</li>
              <li><strong>Face-up</strong> — once your hand is empty and the deck is gone, play from your face-up cards.</li>
              <li><strong>Face-down</strong> — once your face-up cards are gone, tap a face-down card to flip and play it blind. If it can't be played, you pick up the pile.</li>
            </ol>
          </Section>

          <Section title="Special Cards">
            <div className="flex flex-col gap-2.5">
              <SpecialCard rank="2" effect="Play on anything. Resets the pile — the next player can play any card." />
              <SpecialCard rank="5" effect="Play on anything. See-through — the next player must beat whatever card was under the 5." />
              <SpecialCard rank="7" effect="The next player must play a 7 or lower." />
              <SpecialCard rank="10" effect="Burns the pile. All cards are gone for good, and you take another turn." />
              <SpecialCard rank="J" effect="Reverses the turn direction." />
            </div>
          </Section>

          <Section title="Slam">
            <p>If the top of the discard pile has <strong>3 of the same rank</strong>, any player — even out of turn — can Slam by playing the 4th matching card.</p>
            <p>A successful Slam burns the pile and the slammer takes a turn.</p>
          </Section>

          <Section title="Card Values">
            <p className="text-white/60 text-sm">Low → High: <span className="text-white font-semibold">3 · 4 · 6 · 8 · 9 · J · Q · K · A</span></p>
            <p className="text-white/60 text-sm mt-1">Special (always playable): <span className="text-yellow-400 font-semibold">2 · 5 · 7 · 10</span></p>
          </Section>

          <Section title="Tips">
            <ul>
              <li>Save your <strong>10s</strong> for when the pile gets too high to beat — burn it and reset.</li>
              <li>Put your highest cards face-up so they're easier to play later.</li>
              <li>A 2 can always save you — it plays on anything and lets the next player start fresh.</li>
            </ul>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-yellow-400/70 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-col gap-2 text-white/80 text-sm leading-relaxed [&_strong]:text-white [&_strong]:font-semibold [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul>li]:pl-3 [&_ul>li]:relative [&_ul>li]:before:content-['·'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-white/30 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol>li]:pl-5 [&_ol>li]:relative">
        {children}
      </div>
    </div>
  );
}

function SpecialCard({ rank, effect }: { rank: string; effect: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-8 h-10 rounded-lg bg-white flex items-center justify-center text-gray-900 font-extrabold text-sm flex-shrink-0 shadow-sm">
        {rank}
      </span>
      <p className="text-white/70 text-sm leading-relaxed pt-1">{effect}</p>
    </div>
  );
}
