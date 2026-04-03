import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameActions } from '@/hooks/useGameActions';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import SegmentedControl from '@/components/SegmentedControl';
import HowToPlayModal from '@/components/HowToPlayModal';
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
  const [mode, setMode] = useState<'create' | 'join' | 'solo'>(urlRoomId ? 'join' : 'create');
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [botCount, setBotCount] = useState(1);
  const [soloDecks, setSoloDecks] = useState<1 | 2 | 3>(1);

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

  const handleSolo = async () => {
    setLoading(true);
    try {
      const { roomId } = await actions.createSoloRoom(user?.username ?? '', botCount, soloDecks);
      setCurrentRoomId(roomId);
      navigate('/lobby');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to create solo game', 'error');
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
      {/* Nav bar */}
      <div className="flex items-center justify-between" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
        {user?.isGuest ? (
          <div className="w-16" />
        ) : (
          <button
            onClick={() => navigate('/friends')}
            className="text-sm font-semibold text-white/50 hover:text-white/90 transition-colors px-1 py-1"
          >
            Friends
          </button>
        )}
        <h1 className="text-xl font-black tracking-[-0.02em]">
          <span className="text-white">Shxt</span><span className="text-yellow-400">Head</span>
        </h1>
        {user?.isGuest ? (
          <button
            onClick={() => navigate('/register')}
            className="text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors px-1 py-1"
          >
            Sign Up
          </button>
        ) : (
          <button
            onClick={() => navigate('/profile')}
            className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md active:scale-95 transition-transform`}
            aria-label="Profile"
          >
            {user?.username[0]?.toUpperCase()}
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <p className="text-3xl font-black text-white text-center mb-10 tracking-tight">
            Hey, {user?.username}.
          </p>

          <SegmentedControl
            options={[
              { value: 'create', label: 'Create Game' },
              { value: 'join', label: 'Join Game' },
              { value: 'solo', label: 'Solo' },
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

          {mode === 'solo' && (
            <div className="mb-6 animate-fade-in flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">CPU Opponents</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setBotCount(n)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${botCount === n ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Decks</label>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setSoloDecks(n)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${soloDecks === n ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={mode === 'create' ? handleCreate : mode === 'join' ? handleJoin : handleSolo}
            disabled={loading}
            className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : mode === 'create' ? 'Create Game' : mode === 'join' ? 'Join Game' : 'Start Solo Game'}
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-white/30 hover:text-white/60 text-sm font-medium py-3 transition-colors"
          >
            How to play?
          </button>
        </div>
      </div>

      {showRules && <HowToPlayModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
