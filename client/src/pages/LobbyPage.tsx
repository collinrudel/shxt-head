import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api';
import { RoomConfig, FriendWithPresence } from '@shared/types';
import FriendRow from '@/components/FriendRow';
import SegmentedControl from '@/components/SegmentedControl';

function avatarColor(name: string): string {
  const colors = ['bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

export default function LobbyPage() {
  const navigate = useNavigate();
  const actions = useGameActions();
  const { roomState, addToast } = useGameStore();
  const user = useAuthStore(s => s.user);
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState<FriendWithPresence[]>([]);

  useEffect(() => {
    if (!roomState) navigate('/');
  }, [roomState, navigate]);

  const loadFriends = useCallback(async () => {
    try {
      const { friends: f } = await api.get<{ friends: FriendWithPresence[] }>('/api/friends');
      setFriends(f);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    if (showInvite) loadFriends();
  }, [showInvite, loadFriends]);

  if (!roomState) return null;

  const isHost = roomState.hostId === user?.id;
  const myPlayer = roomState.players.find(p => p.id === user?.id);
  const allReady = roomState.players.length >= 2 && roomState.players.every(p => p.isReady);
  const shareUrl = `${window.location.origin}/join/${roomState.id}`;
  const readyCount = roomState.players.filter(p => p.isReady).length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareUrl).then(() => addToast('Invite link copied!', 'success'));
  };

  const handleDecks = (n: string) => {
    actions.updateConfig({ ...roomState.config, numDecks: Number(n) as 1 | 2 | 3 } as RoomConfig);
  };

  const handleInvite = (friendUserId: string) => {
    actions.inviteFriend(friendUserId);
    addToast('Invite sent!', 'success');
    setShowInvite(false);
  };

  const onlineFriends = friends.filter(f => f.isOnline);

  return (
    <div className="min-h-screen flex flex-col pb-32 animate-fade-in">
      <div
        className="flex flex-col items-center px-4 pb-4"
        style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}
      >
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Room Code</p>
        <button
          onClick={handleCopyCode}
          className="text-6xl font-black tracking-[0.4em] text-yellow-400 glow-yellow mb-1 active:scale-95 transition-transform pl-[0.4em]"
        >
          {roomState.id}
        </button>
        <p className="text-xs text-white/30 mb-5">Tap to copy invite link</p>

        <button
          onClick={() => setShowInvite(true)}
          className="bg-white/8 hover:bg-white/12 text-white/70 text-sm px-5 py-2 rounded-2xl font-semibold transition-colors"
        >
          Invite Friend
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 w-full max-w-md mx-auto">
        {/* Players list */}
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Players</p>
            <p className="text-xs text-white/40">{roomState.players.length}/{roomState.config.maxPlayers}</p>
          </div>
          <div className="divide-y divide-white/5">
            {roomState.players.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-full ${avatarColor(p.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {p.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.id === roomState.hostId && <span className="text-sm">👑</span>}
                    <span className="text-white font-semibold text-sm truncate">{p.name}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold ${p.isReady ? 'text-green-400' : 'text-white/30'}`}>
                  {p.isReady ? '● READY' : '○ WAITING'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deck config (host only) */}
        {isHost && (
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Decks</p>
            <SegmentedControl
              options={[
                { value: '1', label: '1 Deck' },
                { value: '2', label: '2 Decks' },
                { value: '3', label: '3 Decks' },
              ]}
              value={String(roomState.config.numDecks)}
              onChange={handleDecks}
            />
            <p className="text-xs text-white/30 mt-2.5 text-center">
              {roomState.config.numDecks === 1 ? '52 cards — best for up to 5 players' :
               roomState.config.numDecks === 2 ? '104 cards — best for up to 11 players' :
               '156 cards — large groups'}
            </p>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-felt-dark/95 backdrop-blur-sm border-t border-white/10 px-4 pt-3 pb-safe">
        <div className="flex flex-col gap-2 max-w-md mx-auto">
          <button
            onClick={() => actions.setReady(!myPlayer?.isReady)}
            className={`w-full py-3 rounded-2xl font-bold transition-all ${
              myPlayer?.isReady
                ? 'bg-white/10 text-white/60'
                : 'bg-green-500 hover:bg-green-400 text-white shadow-lg shadow-green-500/20'
            }`}
          >
            {myPlayer?.isReady ? '✓ Ready — tap to cancel' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              onClick={() => actions.startGame()}
              disabled={!allReady}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 disabled:from-yellow-400/30 disabled:to-yellow-300/30 disabled:text-black/30 text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-yellow-400/20 disabled:shadow-none transition-all"
            >
              {allReady ? 'Start Game →' : `Waiting for players (${readyCount}/${roomState.players.length} ready)`}
            </button>
          )}
        </div>
      </div>

      {/* Invite friend modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-[#1a3a24] rounded-3xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-lg">Invite a Friend</h3>
              <button onClick={() => setShowInvite(false)} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm hover:bg-white/20 transition-colors">✕</button>
            </div>
            {onlineFriends.length === 0 ? (
              <p className="text-center text-white/40 text-sm py-6">No friends online right now.</p>
            ) : (
              onlineFriends.map(f => (
                <FriendRow key={f.friendshipId} friend={f} inLobby onInvite={() => handleInvite(f.userId)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
