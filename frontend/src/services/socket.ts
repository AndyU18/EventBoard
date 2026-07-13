import { io, Socket } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
    });
  }
  return socket;
};
