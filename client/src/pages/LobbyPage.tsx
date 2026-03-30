import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';
import { RoomConfig } from '@shared/types';

export default function LobbyPage() {
  const navigate = useNavigate();
  const actions = useGameActions();
  const { roomState, myPlayerId, addToast } = useGameStore();

  useEffect(() => {
    if (!roomState) navigate('/');
  }, [roomState, navigate]);

  if (!roomState) return null;

  const isHost = roomState.hostId === myPlayerId;
  const myPlayer = roomState.players.find(p => p.id === myPlayerId);
  const allReady = roomState.players.length >= 2 && roomState.players.every(p => p.isReady);
  const shareUrl = `${window.location.origin}/join/${roomState.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast('Link copied!', 'success');
    });
  };

  const handleDecks = (n: 1 | 2 | 3) => {
    const newConfig: RoomConfig = { ...roomState.config, numDecks: n };
    actions.updateConfig(newConfig);
  };

  const handleStart = async () => {
    try {
      actions.startGame();
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to start game', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-black text-center mb-6">
          <span className="text-white">Shxt</span><span className="text-yellow-400">Head</span>
          <span className="text-green-300 text-base font-normal ml-2">Lobby</span>
        </h2>

        {/* Room code + share */}
        <div className="bg-felt rounded-2xl p-4 mb-4">
          <p className="text-xs text-green-300 text-center mb-1">Room Code</p>
          <p className="text-4xl font-black text-center tracking-[0.3em] text-yellow-400 mb-3">
            {roomState.id}
          </p>
          <button
            onClick={handleCopyLink}
            className="w-full bg-felt-light hover:bg-green-700 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Copy Invite Link
          </button>
        </div>

        {/* Players list */}
        <div className="bg-felt rounded-2xl p-4 mb-4">
          <p className="text-xs text-green-300 mb-3">
            Players ({roomState.players.length}/{roomState.config.maxPlayers})
          </p>
          <div className="flex flex-col gap-2">
            {roomState.players.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{p.name}</span>
                  {p.id === roomState.hostId && (
                    <span className="text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">HOST</span>
                  )}
                </div>
                <span className={`text-xs font-bold ${p.isReady ? 'text-green-400' : 'text-gray-400'}`}>
                  {p.isReady ? 'READY' : 'NOT READY'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deck config (host only) */}
        {isHost && (
          <div className="bg-felt rounded-2xl p-4 mb-4">
            <p className="text-xs text-green-300 mb-3">Number of Decks</p>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => handleDecks(n)}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                    roomState.config.numDecks === n
                      ? 'bg-yellow-400 text-black'
                      : 'bg-felt-light text-white hover:bg-green-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-green-400 mt-2 text-center">
              {roomState.config.numDecks === 1 ? '52 cards — up to 5 players' :
               roomState.config.numDecks === 2 ? '104 cards — up to 11 players' :
               '156 cards — large groups'}
            </p>
          </div>
        )}

        {/* Ready + Start buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => actions.setReady(!myPlayer?.isReady)}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
              myPlayer?.isReady
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-green-500 hover:bg-green-400 text-white'
            }`}
          >
            {myPlayer?.isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!allReady}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl text-lg transition-colors"
            >
              {allReady ? 'Start Game' : `Waiting for players (${roomState.players.filter(p => p.isReady).length}/${roomState.players.length} ready)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
