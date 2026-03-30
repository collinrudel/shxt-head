import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@shared/types';

const URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

let _socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!_socket) {
    throw new Error('Socket not initialized. Call initSocket(token) first.');
  }
  return _socket;
}

export function initSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (_socket) {
    _socket.disconnect();
  }
  _socket = io(URL, {
    autoConnect: false,
    auth: { token },
  });
  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}
