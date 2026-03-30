import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '@/socket';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameStore } from '@/store/gameStore';

export default function LandingPage() {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const actions = useGameActions();
  const { setMyIdentity, setCurrentRoomId, addToast } = useGameStore();

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(urlRoomId ?? '');
  const [mode, setMode] = useState<'create' | 'join'>(urlRoomId ? 'join' : 'create');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlRoomId) {
      setRoomCode(urlRoomId);
      setMode('join');
    }
  }, [urlRoomId]);

  const handleCreate = async () => {
    if (!name.trim()) { addToast('Enter your name', 'error'); return; }
    setLoading(true);
    try {
      const { roomId } = await actions.createRoom(name.trim(), { numDecks: 1, maxPlayers: 8 });
      setMyIdentity(socket.id!, name.trim());
      setCurrentRoomId(roomId);
      navigate('/lobby');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { addToast('Enter your name', 'error'); return; }
    if (!roomCode.trim()) { addToast('Enter a room code', 'error'); return; }
    setLoading(true);
    try {
      await actions.joinRoom(roomCode.trim().toUpperCase(), name.trim());
      setMyIdentity(socket.id!, name.trim());
      setCurrentRoomId(roomCode.trim().toUpperCase());
      navigate('/lobby');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to join room', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <h1 className="text-5xl font-black text-center mb-2 tracking-tight">
          <span className="text-white">Shxt</span>
          <span className="text-yellow-400">Head</span>
        </h1>
        <p className="text-center text-green-300 text-sm mb-8">The card game, online</p>

        {/* Name input */}
        <div className="mb-6">
          <label className="block text-sm text-green-200 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden mb-6 border border-felt-light">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'create' ? 'bg-yellow-400 text-black' : 'bg-felt text-green-200 hover:bg-felt-light'
            }`}
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'join' ? 'bg-yellow-400 text-black' : 'bg-felt text-green-200 hover:bg-felt-light'
            }`}
          >
            Join Game
          </button>
        </div>

        {/* Join: room code input */}
        {mode === 'join' && (
          <div className="mb-6">
            <label className="block text-sm text-green-200 mb-1">Room code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center text-2xl tracking-[0.3em] font-bold uppercase"
            />
          </div>
        )}

        {/* Action button */}
        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 disabled:opacity-50 text-black font-bold py-4 rounded-xl text-lg transition-colors"
        >
          {loading ? '...' : mode === 'create' ? 'Create Game' : 'Join Game'}
        </button>
      </div>
    </div>
  );
}
