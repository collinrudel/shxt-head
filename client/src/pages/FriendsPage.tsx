import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { getSocket } from '@/socket';
import { FriendWithPresence } from '@shared/types';
import FriendRow from '@/components/FriendRow';

interface PendingRequest {
  friendshipId: string;
  userId: string;
  username: string;
}

interface SearchResult {
  userId: string;
  username: string;
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendWithPresence[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests' | 'add'>('friends');

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

  // Live presence updates
  useEffect(() => {
    let socket: ReturnType<typeof getSocket>;
    try { socket = getSocket(); } catch { return; }

    const handler = (payload: { userId: string; isOnline: boolean; lastSeenAt: string }) => {
      setFriends(prev =>
        prev.map(f =>
          f.userId === payload.userId
            ? { ...f, isOnline: payload.isOnline, lastSeenAt: payload.lastSeenAt }
            : f
        )
      );
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
      } finally {
        setSearching(false);
      }
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
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-felt-light/30">
        <button onClick={() => navigate('/')} className="text-green-300 text-sm">← Back</button>
        <h2 className="text-lg font-black text-white">Friends</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-felt-light/30">
        {(['friends', 'requests', 'add'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-green-400'
            }`}
          >
            {t === 'requests' && requests.length > 0 ? `Requests (${requests.length})` : t === 'add' ? 'Add' : 'Friends'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {tab === 'friends' && (
          <>
            {friends.length === 0 && (
              <p className="text-center text-green-500 py-8 text-sm">No friends yet. Use the Add tab to find people!</p>
            )}
            {onlineFriends.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-green-500 py-2">Online</p>
                {onlineFriends.map(f => (
                  <FriendRow key={f.friendshipId} friend={f} onRemove={() => handleRemove(f.friendshipId)} />
                ))}
              </div>
            )}
            {offlineFriends.length > 0 && (
              <div>
                <p className="text-xs text-green-500 py-2">Offline</p>
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
              <p className="text-center text-green-500 py-8 text-sm">No pending requests.</p>
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

        {tab === 'add' && (
          <div className="py-2">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by username..."
              autoCapitalize="none"
              className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4"
            />
            {searching && <p className="text-center text-green-400 text-sm">Searching...</p>}
            {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-green-500 text-sm">No users found.</p>
            )}
            {searchResults.map(u => (
              <div key={u.userId} className="flex items-center justify-between py-3 border-b border-felt-light/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-felt-light flex items-center justify-center font-bold text-white text-sm">
                    {u.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-white font-semibold">{u.username}</span>
                </div>
                <button
                  onClick={() => handleAddFriend(u.username)}
                  className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
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
