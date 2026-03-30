import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { initSocket, getSocket, disconnectSocket } from '@/socket';
import { useSocketEvents } from '@/hooks/useSocket';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import LandingPage from '@/pages/LandingPage';
import LobbyPage from '@/pages/LobbyPage';
import SwapPage from '@/pages/SwapPage';
import GamePage from '@/pages/GamePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import FriendsPage from '@/pages/FriendsPage';
import ProfilePage from '@/pages/ProfilePage';
import Toast from '@/components/Toast';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function AppInner() {
  useSocketEvents();
  usePushNotifications();
  const toasts = useGameStore(s => s.toasts);
  const removeToast = useGameStore(s => s.removeToast);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<RequireAuth><LandingPage /></RequireAuth>} />
        <Route path="/join/:roomId" element={<RequireAuth><LandingPage /></RequireAuth>} />
        <Route path="/lobby" element={<RequireAuth><LobbyPage /></RequireAuth>} />
        <Route path="/swap" element={<RequireAuth><SwapPage /></RequireAuth>} />
        <Route path="/game" element={<RequireAuth><GamePage /></RequireAuth>} />
        <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
}

export default function App() {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (token) {
      const socket = initSocket(token);
      socket.connect();
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-felt-dark">
      <AppInner />
    </div>
  );
}
