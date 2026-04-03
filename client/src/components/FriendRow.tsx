import { FriendWithPresence } from '@shared/types';
import TierBadge from './TierBadge';

interface FriendRowProps {
  friend: FriendWithPresence;
  onInvite?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRemove?: () => void;
  isPending?: boolean;
  inLobby?: boolean;
}

function formatLastSeen(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function avatarColor(name: string): string {
  const colors = ['bg-indigo-600', 'bg-violet-600', 'bg-sky-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

export default function FriendRow({ friend, onInvite, onAccept, onDecline, onRemove, isPending, inLobby }: FriendRowProps) {
  return (
    <div className="group flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-9 h-9 rounded-full ${avatarColor(friend.username)} flex items-center justify-center font-bold text-white text-sm`}>
          {friend.username[0]?.toUpperCase()}
        </div>
        {!isPending && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-felt-dark ${
            friend.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
          }`} />
        )}
      </div>

      {/* Name + presence */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-[15px] text-white truncate">{friend.username}</p>
          {typeof friend.trophies === 'number' && <TierBadge trophies={friend.trophies} />}
        </div>
        {!isPending && (
          <p className="text-xs text-white/40">
            {friend.isOnline ? 'Online' : `Last seen ${formatLastSeen(friend.lastSeenAt)}`}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {isPending && onAccept && (
          <button onClick={onAccept} className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            Accept
          </button>
        )}
        {isPending && onDecline && (
          <button onClick={onDecline} className="bg-white/10 hover:bg-white/15 text-white/60 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            Decline
          </button>
        )}
        {!isPending && inLobby && friend.isOnline && onInvite && (
          <button onClick={onInvite} className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
            Invite
          </button>
        )}
        {!isPending && onRemove && (
          <button onClick={onRemove} className="text-white/20 hover:text-red-400 text-sm px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-all">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
