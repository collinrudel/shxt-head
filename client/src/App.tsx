import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { socket } from '@/socket';
import { useSocketEvents } from '@/hooks/useSocket';
import { useGameStore } from '@/store/gameStore';
import LandingPage from '@/pages/LandingPage';
import LobbyPage from '@/pages/LobbyPage';
import SwapPage from '@/pages/SwapPage';
import GamePage from '@/pages/GamePage';
import Toast from '@/components/Toast';

function App() {
  useSocketEvents();
  const toasts = useGameStore(s => s.toasts);
  const removeToast = useGameStore(s => s.removeToast);

  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="min-h-screen bg-felt-dark">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join/:roomId" element={<LandingPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  );
}

export default App;
