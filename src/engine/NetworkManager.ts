import * as PeerNamespace from 'peerjs';
import type { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types/game';

// Helper to reliably extract Peer constructor across different bundler environments
function getPeerConstructor(): any {
  const p = PeerNamespace as any;
  if (typeof p === 'function') return p;
  if (p && typeof p.default === 'function') return p.default;
  if (p && p.default && typeof p.default.default === 'function') return p.default.default;
  if (p && typeof p.Peer === 'function') return p.Peer;
  if (typeof window !== 'undefined' && typeof (window as any).Peer === 'function') {
    return (window as any).Peer;
  }
  return null;
}

export class NetworkManager {
  private peer: any = null;
  private connections: Map<string, DataConnection> = new Map();
  public myPeerId: string = '';
  public roomCode: string = '';
  public isHost: boolean = false;
  private onMessageCallback?: (msg: NetworkMessage) => void;

  constructor() {}

  public init(
    customRoomCode?: string,
    onMessage?: (msg: NetworkMessage) => void,
    onConnected?: (peerId: string) => void
  ) {
    this.onMessageCallback = onMessage;

    // Generate room code prefix
    const prefix = 'awaaz-jm-';
    const code = customRoomCode ? customRoomCode.toUpperCase() : this.generateRoomCode();
    this.roomCode = code;
    const targetPeerId = prefix + code;

    try {
      const PeerClass = getPeerConstructor();
      if (!PeerClass) {
        console.warn('PeerJS constructor not available. Running in local standalone mode.');
        if (onConnected) onConnected(this.roomCode);
        return;
      }

      this.peer = new PeerClass(targetPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id: string) => {
        this.myPeerId = id;
        this.isHost = true;
        if (onConnected) onConnected(this.roomCode);
      });

      this.peer.on('connection', (conn: DataConnection) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err: any) => {
        console.warn('NetworkManager peer warning:', err);
        // If room ID already taken, we might be joining as client
        if (err.type === 'unavailable-id' && customRoomCode) {
          this.joinRoom(customRoomCode, onMessage, onConnected);
        }
      });
    } catch (e) {
      console.warn('P2P signaling fallback to local session:', e);
      if (onConnected) onConnected(this.roomCode);
    }
  }

  public joinRoom(
    roomCode: string,
    onMessage?: (msg: NetworkMessage) => void,
    onConnected?: (code: string) => void
  ) {
    this.onMessageCallback = onMessage;
    this.roomCode = roomCode.toUpperCase();
    const targetHostId = 'awaaz-jm-' + this.roomCode;

    try {
      const PeerClass = getPeerConstructor();
      if (!PeerClass) {
        console.warn('PeerJS constructor not available for joinRoom.');
        if (onConnected) onConnected(this.roomCode);
        return;
      }

      // Create unique client peer
      this.peer = new PeerClass();
      this.peer.on('open', (myId: string) => {
        this.myPeerId = myId;
        this.isHost = false;

        const conn = this.peer!.connect(targetHostId, { reliable: true });
        this.setupConnection(conn);

        conn.on('open', () => {
          if (onConnected) onConnected(this.roomCode);
        });
      });

      this.peer.on('error', (err: any) => {
        console.warn('Join room error:', err);
      });
    } catch (e) {
      console.warn('Failed to join room P2P:', e);
      if (onConnected) onConnected(this.roomCode);
    }
  }

  private setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: any) => {
      const msg = data as NetworkMessage;
      if (this.onMessageCallback) {
        this.onMessageCallback(msg);
      }
      // If we are host, relay to other peers
      if (this.isHost) {
        this.broadcast(msg, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
    });
  }

  public broadcast(msg: NetworkMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(msg);
      }
    });
  }

  public sendTo(targetPeerId: string, msg: NetworkMessage) {
    const conn = this.connections.get(targetPeerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public destroy() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
