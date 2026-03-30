import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import SegmentedControl from '@/components/SegmentedControl';
import { getAvatarColor } from '@/pages/ProfilePage';

function Spinner() {
  return <span className="inline-block w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />;
}

export default function LandingPage() {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const actions = useGameActions();
  const { setCurrentRoomId, addToast } = useGameStore();
  const user = useAuthStore(s => s.user);

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
    setLoading(true);
    try {
      const { roomId } = await actions.createRoom(user?.username ?? '', { numDecks: 1, maxPlayers: 8 });
      setCurrentRoomId(roomId);
      navigate('/lobby');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) { addToast('Enter a room code', 'error'); return; }
    setLoading(true);
    try {
      await actions.joinRoom(roomCode.trim().toUpperCase(), user?.username ?? '');
      setCurrentRoomId(roomCode.trim().toUpperCase());
      navigate('/lobby');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to join room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const avatarColor = user ? getAvatarColor(user.username) : 'bg-felt-light';

  return (
    <div className="min-h-screen flex flex-col px-4 animate-fade-in">
      {/* Nav header */}
      <div className="flex items-center justify-between pt-safe pt-5 pb-4">
        <button
          onClick={() => navigate('/friends')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 text-lg transition-colors"
          aria-label="Friends"
        >
          👥
        </button>
        <h1 className="text-2xl font-black tracking-[-0.02em]">
          <span className="text-white">Shxt</span><span className="text-yellow-400">Head</span>
        </h1>
        <button
          onClick={() => navigate('/profile')}
          className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-black text-base shadow-md transition-transform active:scale-95`}
          aria-label="Profile"
        >
          {user?.username[0]?.toUpperCase()}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <p className="text-center text-white/50 text-base mb-8">Hey, {user?.username}!</p>

        <SegmentedControl
          options={[
            { value: 'create', label: 'Create Game' },
            { value: 'join', label: 'Join Game' },
          ]}
          value={mode}
          onChange={setMode}
          className="mb-6"
        />

        {mode === 'join' && (
          <div className="mb-6 animate-fade-in">
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="ABC123"
              maxLength={6}
              className="w-full bg-white/10 px-4 py-3.5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-yellow-400/70 text-center text-2xl tracking-[0.3em] font-bold uppercase transition-all"
            />
          </div>
        )}

        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : mode === 'create' ? 'Create Game' : 'Join Game'}
        </button>
      </div>
      </div>
    </div>
  );
}
