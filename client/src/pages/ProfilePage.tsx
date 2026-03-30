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

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [avatarColor, setAvatarColorState] = useState(() => getAvatarColor(user?.username ?? ''));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleAvatarColor = (color: string) => {
    setAvatarColorState(color);
    localStorage.setItem(AVATAR_COLOR_KEY, color);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return; }
    setPwError('');
    setPwSuccess(false);
    setPwLoading(true);
    try {
      await api.patch('/api/auth/profile', { currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSignOut = () => {
    disconnectSocket();
    clearAuth();
    navigate('/login');
  };

  if (!user) return null;

  const inputClass = 'w-full bg-white/10 px-4 py-3.5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-yellow-400/70 transition-all text-sm';

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-6 pb-4">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <h2 className="text-lg font-black text-white">Profile</h2>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-10 max-w-sm mx-auto w-full">
        {/* Avatar + username */}
        <div className="flex flex-col items-center py-6">
          <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-white text-3xl font-black mb-3 shadow-lg`}>
            {user.username[0]?.toUpperCase()}
          </div>
          <p className="text-xl font-black text-white tracking-tight">{user.username}</p>
          <p className="text-xs text-white/30 mt-0.5">Member</p>
        </div>

        {/* Avatar color picker */}
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Avatar Color</p>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleAvatarColor(c.value)}
                className={`w-8 h-8 rounded-full ${c.value} transition-transform ${
                  avatarColor === c.value ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-felt-dark' : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Change Password</p>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className={inputClass}
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
            {pwError && <p className="text-red-400 text-xs animate-fade-in">⚠ {pwError}</p>}
            {pwSuccess && <p className="text-green-400 text-xs animate-fade-in">✓ Password updated</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 disabled:opacity-50 text-black font-bold py-3 rounded-2xl text-sm shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2 mt-1"
            >
              {pwLoading ? <Spinner /> : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
          className="w-full bg-white/5 hover:bg-white/10 text-red-400 font-semibold py-4 rounded-2xl transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Sign out confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-felt rounded-2xl p-6 w-full max-w-sm animate-slide-up">
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
