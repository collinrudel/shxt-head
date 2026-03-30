import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useGameActions } from '@/hooks/useGameActions';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api';
import { RoomConfig, FriendWithPresence } from '@shared/types';
import FriendRow from '@/components/FriendRow';

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => addToast('Link copied!', 'success'));
  };

  const handleDecks = (n: 1 | 2 | 3) => {
    actions.updateConfig({ ...roomState.config, numDecks: n } as RoomConfig);
  };

  const handleInvite = (friendUserId: string) => {
    actions.inviteFriend(friendUserId);
    addToast('Invite sent!', 'success');
    setShowInvite(false);
  };

  const onlineFriends = friends.filter(f => f.isOnline);

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
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-felt-light hover:bg-green-700 text-white text-sm py-2 rounded-lg transition-colors"
            >
              Copy Invite Link
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black text-sm py-2 rounded-lg font-semibold transition-colors"
            >
              Invite Friend
            </button>
          </div>
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

        {/* Ready + Start */}
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
              onClick={() => actions.startGame()}
              disabled={!allReady}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl text-lg transition-colors"
            >
              {allReady
                ? 'Start Game'
                : `Waiting (${roomState.players.filter(p => p.isReady).length}/${roomState.players.length} ready)`}
            </button>
          )}
        </div>
      </div>

      {/* Invite friend modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-felt rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Invite a Friend</h3>
              <button onClick={() => setShowInvite(false)} className="text-green-400 text-xl">✕</button>
            </div>
            {onlineFriends.length === 0 ? (
              <p className="text-center text-green-500 text-sm py-4">No friends online right now.</p>
            ) : (
              onlineFriends.map(f => (
                <FriendRow
                  key={f.friendshipId}
                  friend={f}
                  inLobby
                  onInvite={() => handleInvite(f.userId)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
