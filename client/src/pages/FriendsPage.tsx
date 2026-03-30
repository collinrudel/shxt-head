import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { getSocket } from '@/socket';
import { FriendWithPresence } from '@shared/types';
import FriendRow from '@/components/FriendRow';
import SegmentedControl from '@/components/SegmentedControl';

interface PendingRequest {
  friendshipId: string;
  userId: string;
  username: string;
}

interface SearchResult {
  userId: string;
  username: string;
}

function avatarColor(name: string): string {
  const colors = ['bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendWithPresence[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends');

  const loadFriends = useCallback(async () => {
    const { friends: f } = await api.get<{ friends: FriendWithPresence[] }>('/api/friends');
    setFriends(f);
  }, []);

  const loadRequests = useCallback(async () => {
    const { requests: r } = await api.get<{ requests: PendingRequest[] }>('/api/friends/requests');
    setRequests(r);
  }, []);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [loadFriends, loadRequests]);

  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try { socket = getSocket(); } catch { return; }
    const handler = (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      setFriends(prev => prev.map(f =>
        f.userId === payload.userId ? { ...f, isOnline: payload.isOnline, lastSeenAt: payload.lastSeenAt } : f
      ));
    };
    socket.on('friends:presence_update', handler);
    return () => { socket.off('friends:presence_update', handler); };
  }, []);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { users } = await api.get<{ users: SearchResult[] }>(`/api/friends/search?q=${encodeURIComponent(searchQ)}`);
        setSearchResults(users);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleAccept = async (friendshipId: string) => {
    await api.post(`/api/friends/accept/${friendshipId}`);
    await Promise.all([loadFriends(), loadRequests()]);
  };

  const handleDecline = async (friendshipId: string) => {
    await api.delete(`/api/friends/${friendshipId}`);
    await loadRequests();
  };

  const handleRemove = async (friendshipId: string) => {
    await api.delete(`/api/friends/${friendshipId}`);
    await loadFriends();
  };

  const handleAddFriend = async (username: string) => {
    await api.post('/api/friends/request', { username });
    setSearchQ('');
    setSearchResults([]);
  };

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
      >
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white/80 text-sm font-semibold transition-colors">← Back</button>
        <h2 className="text-lg font-black text-white">Friends</h2>
      </div>

      {/* Segmented tabs */}
      <div className="px-4 mb-4">
        <SegmentedControl
          options={[
            { value: 'friends', label: 'Friends' },
            { value: 'requests', label: 'Requests', badge: requests.length },
            { value: 'find', label: 'Find' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-1">
        {tab === 'friends' && (
          <>
            {friends.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/20 text-sm">No friends yet.</p>
                <p className="text-white/15 text-xs mt-1">Use Find to add people.</p>
              </div>
            )}
            {onlineFriends.length > 0 && (
              <div className="mb-2">
                <p className="text-[11px] tracking-widest uppercase text-white/30 font-semibold py-2">Online</p>
                {onlineFriends.map(f => (
                  <FriendRow key={f.friendshipId} friend={f} onRemove={() => handleRemove(f.friendshipId)} />
                ))}
              </div>
            )}
            {offlineFriends.length > 0 && (
              <div>
                <p className="text-[11px] tracking-widest uppercase text-white/30 font-semibold py-2">Offline</p>
                {offlineFriends.map(f => (
                  <FriendRow key={f.friendshipId} friend={f} onRemove={() => handleRemove(f.friendshipId)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {requests.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/20 text-sm">No pending requests.</p>
              </div>
            )}
            {requests.map(r => (
              <FriendRow
                key={r.friendshipId}
                friend={{ friendshipId: r.friendshipId, userId: r.userId, username: r.username, isOnline: false, lastSeenAt: new Date().toISOString() }}
                isPending
                onAccept={() => handleAccept(r.friendshipId)}
                onDecline={() => handleDecline(r.friendshipId)}
              />
            ))}
          </>
        )}

        {tab === 'find' && (
          <div className="py-1">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by username..."
              autoCapitalize="none"
              className="w-full bg-white/10 px-4 py-3.5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-yellow-400/70 transition-all mb-4"
            />
            {searching && <p className="text-center text-white/40 text-sm">Searching...</p>}
            {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-white/30 text-sm">No users found.</p>
            )}
            {searchResults.map(u => (
              <div key={u.userId} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                <div className={`w-9 h-9 rounded-full ${avatarColor(u.username)} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                  {u.username[0]?.toUpperCase()}
                </div>
                <span className="text-white font-semibold flex-1 text-[15px]">{u.username}</span>
                <button
                  onClick={() => handleAddFriend(u.username)}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
