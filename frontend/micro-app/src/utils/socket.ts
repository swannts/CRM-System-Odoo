import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:7030';

class SocketClient {
  private socket: Socket | null = null;
  private token = '';
  private orgId = '';

  connect(token: string, orgId: string) {
    if (this.socket?.connected && this.token === token && this.orgId === orgId) return this.socket;
    if (this.socket && (this.token !== token || this.orgId !== orgId)) this.disconnect();

    this.token = token;
    this.orgId = orgId;

    this.socket = io(SOCKET_URL, {
      auth: { token, orgId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to realtime-service');
      this.socket?.emit('join-org', orgId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = '';
    this.orgId = '';
  }
}

export const socketClient = new SocketClient();
