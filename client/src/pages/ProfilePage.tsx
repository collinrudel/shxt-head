import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api';
import { disconnectSocket } from '@/socket';

const AVATAR_COLORS = [
  { value: 'bg-indigo-600', label: 'Indigo' },
  { value: 'bg-violet-600', label: 'Violet' },
  { value: 'bg-sky-600', label: 'Sky' },
  { value: 'bg-teal-600', label: 'Teal' },
  { value: 'bg-rose-600', label: 'Rose' },
  { value: 'bg-amber-600', label: 'Amber' },
  { value: 'bg-green-600', label: 'Green' },
  { value: 'bg-pink-600', label: 'Pink' },
];

const AVATAR_COLOR_KEY = 'shxthead_avatar_color';

export function getAvatarColor(username: string): string {
  const saved = localStorage.getItem(AVATAR_COLOR_KEY);
  if (saved) return saved;
  const colors = AVATAR_COLORS.map(c => c.value);
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputClass = 'w-full bg-white/10 px-4 py-3.5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-yellow-400/70 transition-all text-sm';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      await api.patch('/api/auth/profile', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1a3a24] rounded-3xl p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-white text-lg">Change Password</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm hover:bg-white/20 transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className={inputClass}
            autoFocus
          />
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className={inputClass}
          />
          {error && <p className="text-red-400 text-xs animate-fade-in">⚠ {error}</p>}
          {success && <p className="text-green-400 text-xs animate-fade-in">Password updated</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 disabled:opacity-50 text-black font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Spinner /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [avatarColor, setAvatarColorState] = useState(() => getAvatarColor(user?.username ?? ''));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleAvatarColor = (color: string) => {
    setAvatarColorState(color);
    localStorage.setItem(AVATAR_COLOR_KEY, color);
  };

  const handleSignOut = () => {
    disconnectSocket();
    clearAuth();
    navigate('/login');
  };

  if (!user) return null;

  if (user.isGuest) {
    return (
      <div className="min-h-screen flex flex-col animate-fade-in">
        <div
          className="flex items-center px-4 pb-4"
          style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
        >
          <button onClick={() => navigate('/')} className="text-white/40 hover:text-white/80 transition-colors text-sm font-semibold">← Back</button>
        </div>

        <div className="flex flex-col px-4 pb-10 max-w-sm mx-auto w-full">
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl">
              {user.username[0]?.toUpperCase()}
            </div>
            <p className="text-2xl font-black text-white tracking-tight">{user.username}</p>
            <p className="text-xs text-white/30 mt-1">Guest</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-3 text-center">
            <p className="text-white font-semibold mb-1">Playing as a guest</p>
            <p className="text-white/40 text-sm mb-5">Create an account to save your stats, add friends, and keep your username.</p>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 text-black font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-yellow-400/20"
            >
              Create Account
            </button>
          </div>

          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full bg-white/5 hover:bg-white/8 text-red-400 font-semibold py-4 rounded-2xl transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>

        {showSignOutConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
            <div className="bg-[#1a3a24] rounded-3xl p-6 w-full max-w-sm animate-slide-up">
              <h3 className="font-black text-white text-lg mb-1">Sign out?</h3>
              <p className="text-white/40 text-sm mb-6">Your guest session will end.</p>
              <div className="flex flex-col gap-2">
                <button onClick={handleSignOut} className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3.5 rounded-2xl transition-colors">Sign Out</button>
                <button onClick={() => setShowSignOutConfirm(false)} className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center px-4 pb-4"
        style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-white/40 hover:text-white/80 transition-colors text-sm font-semibold"
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-col px-4 pb-10 max-w-sm mx-auto w-full">
        {/* Avatar hero */}
        <div className="flex flex-col items-center py-8">
          <div
            className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center text-white text-4xl font-black mb-4 shadow-xl`}
          >
            {user.username[0]?.toUpperCase()}
          </div>
          <p className="text-2xl font-black text-white tracking-tight">{user.username}</p>
        </div>

        {/* Avatar color picker */}
        <div className="bg-white/5 rounded-2xl p-4 mb-3">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">Avatar Color</p>
          <div className="flex gap-2.5 justify-between">
            {AVATAR_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleAvatarColor(c.value)}
                style={avatarColor === c.value ? { outline: '2px solid white', outlineOffset: '2px' } : undefined}
                className={`flex-1 aspect-square rounded-full ${c.value} transition-all ${
                  avatarColor === c.value ? 'scale-110' : 'opacity-50 hover:opacity-80'
                }`}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {/* Account settings */}
        <div className="bg-white/5 rounded-2xl overflow-hidden mb-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between px-4 py-4 hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-semibold text-white">Change Password</span>
            <span className="text-white/30 text-sm">›</span>
          </button>
        </div>

        {/* Sign out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full bg-white/5 hover:bg-white/8 text-red-400 font-semibold py-4 rounded-2xl transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Change password modal */}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

      {/* Sign out confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-[#1a3a24] rounded-3xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-black text-white text-lg mb-1">Sign out?</h3>
            <p className="text-white/40 text-sm mb-6">You'll need to sign back in to play.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3.5 rounded-2xl transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
