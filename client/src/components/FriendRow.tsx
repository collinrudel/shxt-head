import { FriendWithPresence } from '@shared/types';

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

export default function FriendRow({ friend, onInvite, onAccept, onDecline, onRemove, isPending, inLobby }: FriendRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-felt-light/30 last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-felt-light flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
        {friend.username[0]?.toUpperCase()}
      </div>

      {/* Name + presence */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{friend.username}</p>
        {!isPending && (
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${friend.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span className="text-xs text-green-400">
              {friend.isOnline ? 'Online' : `Last seen ${formatLastSeen(friend.lastSeenAt)}`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        {isPending && onAccept && (
          <button
            onClick={onAccept}
            className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Accept
          </button>
        )}
        {isPending && onDecline && (
          <button
            onClick={onDecline}
            className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Decline
          </button>
        )}
        {!isPending && inLobby && friend.isOnline && onInvite && (
          <button
            onClick={onInvite}
            className="bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Invite
          </button>
        )}
        {!isPending && onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 text-xs px-2 py-1.5"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
