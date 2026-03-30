import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/authStore';
import { initSocket } from '@/socket';
import { AuthUser } from '@shared/types';

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-5xl font-black text-center mb-2 tracking-tight">
          <span className="text-white">Shxt</span>
          <span className="text-yellow-400">Head</span>
        </h1>
        <p className="text-center text-green-300 text-sm mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-green-200 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_username"
              autoCapitalize="none"
              maxLength={20}
              className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <p className="text-xs text-green-500 mt-1">Letters, numbers, underscores. 2–20 chars.</p>
          </div>
          <div>
            <label className="block text-sm text-green-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm text-green-200 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-felt px-4 py-3 rounded-xl text-white placeholder-green-400 border border-felt-light focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-4 rounded-xl text-lg transition-colors"
          >
            {loading ? '...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-green-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 font-semibold underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
