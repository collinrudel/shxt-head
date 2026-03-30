import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { initSocket } from '@/socket';
import { AuthUser } from '@shared/types';

function Spinner() {
  return <span className="inline-block w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />;
}

const inputClass = 'w-full bg-white/10 px-4 py-3.5 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-yellow-400/70 transition-all';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const { user, token } = await api.post<{ user: AuthUser; token: string }>('/api/auth/register', {
        username: username.trim(),
        password,
      });
      setAuth(user, token);
      initSocket(token).connect();
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-felt flex items-center justify-center shadow-lg">
            <span className="text-yellow-400 text-3xl font-black leading-none">S</span>
          </div>
        </div>
        <h1 className="text-6xl font-black text-center mb-1 tracking-[-0.03em]">
          <span className="text-white">Shxt</span><span className="text-yellow-400">Head</span>
        </h1>
        <p className="text-center text-green-400/80 text-sm mb-10">Pick a username.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your_username" autoCapitalize="none" maxLength={20} className={inputClass} />
            <p className="text-xs text-white/30 mt-1.5 pl-1">Letters, numbers, underscores. 2–20 chars.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" className={inputClass} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-b from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-yellow-400/20 transition-all flex items-center justify-center gap-2 mt-1">
            {loading ? <Spinner /> : 'Create Account'}
          </button>

          {error && <p className="text-red-400 text-sm text-center animate-fade-in">⚠ {error}</p>}
        </form>

        <p className="text-center text-white/40 text-sm mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
