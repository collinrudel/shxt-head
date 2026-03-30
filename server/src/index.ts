import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ClientToServerEvents, ServerToClientEvents } from 'shxthead-shared';
import { RoomManager } from './roomManager';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';

const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: isProd
    ? { origin: false }
    : { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Serve static client build in production
if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket, roomManager);
  registerGameHandlers(io, socket, roomManager);
});

httpServer.listen(PORT, () => {
  console.log(`ShxtHead server running on port ${PORT}`);
});
