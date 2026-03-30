import { useEffect, useRef } from 'react';
import { api } from '@/api';
import { useAuthStore } from '@/store/authStore';

async function getVapidPublicKey(): Promise<string> {
  const data = await api.get<{ publicKey: string }>('/api/push/vapid-public-key');
  return data.publicKey;
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export function usePushNotifications() {
  const user = useAuthStore(s => s.user);
  const subscribed = useRef(false);

  useEffect(() => {
    if (!user || subscribed.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const vapidKey = await getVapidPublicKey();
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await api.post('/api/push/subscribe', subscription.toJSON());
        subscribed.current = true;
      } catch {
        // Non-critical — push notifications are optional
      }
    }

    subscribe();
  }, [user]);
}
