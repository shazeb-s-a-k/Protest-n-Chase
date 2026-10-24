import { Peer, DataConnection } from 'peerjs';
import { NetworkMessage } from '../types/game';

export class NetworkManager {
  private peer: Peer | null = null;
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
      this.peer = new Peer(targetPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.isHost = true;
        if (onConnected) onConnected(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('NetworkManager peer warning:', err);
        // If room ID already taken, we might be joining as client
        if (err.type === 'unavailable-id' && customRoomCode) {
          this.joinRoom(customRoomCode, onMessage, onConnected);
        }
      });
    } catch (e) {
      console.warn('P2P signaling fallback to local session', e);
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

    // Create unique client peer
    this.peer = new Peer();
    this.peer.on('open', (myId) => {
      this.myPeerId = myId;
      this.isHost = false;

      const conn = this.peer!.connect(targetHostId, { reliable: true });
      this.setupConnection(conn);

      conn.on('open', () => {
        if (onConnected) onConnected(this.roomCode);
      });
    });

    this.peer.on('error', (err) => {
      console.warn('Join room error:', err);
    });
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
