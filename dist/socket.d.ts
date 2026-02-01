/**
 * InterlockSocket - Canonical InterLock UDP Socket Implementation
 *
 * Features:
 * - Peer tracking with lastSeen timestamps
 * - Stale peer pruning (90s timeout per protocol spec)
 * - Safe signal validation before processing
 * - Heartbeat with peer health checking
 * - Graceful shutdown with DISCONNECT broadcast
 */
import { EventEmitter } from 'events';
import type { Signal, SignalInput, PeerInfo, InterlockConfig, SocketStats, RemoteInfo } from './types.js';
export interface InterlockSocketEvents {
    signal: (signal: Signal, rinfo: RemoteInfo) => void;
    peer_timeout: (info: {
        serverId: string;
        peer: PeerInfo;
    }) => void;
    peer_added: (info: {
        serverId: string;
        peer: PeerInfo;
    }) => void;
    peer_removed: (info: {
        serverId: string;
    }) => void;
    error: (error: Error) => void;
}
export declare class InterlockSocket extends EventEmitter {
    private socket;
    private config;
    private peers;
    private heartbeatTimer;
    private peerCheckTimer;
    private stats;
    private isRunning;
    constructor(config: InterlockConfig);
    /**
     * Initialize peers from config
     */
    private initializePeers;
    /**
     * Start the UDP socket
     */
    start(): Promise<void>;
    /**
     * Handle incoming message with validation
     */
    private handleMessage;
    /**
     * Validate signal structure
     */
    private isValidSignal;
    /**
     * Send signal to specific host:port
     */
    send(host: string, port: number, signal: SignalInput): Promise<void>;
    /**
     * Broadcast signal to all known peers
     */
    broadcast(signal: SignalInput): Promise<void>;
    /**
     * Send to specific server by ID
     */
    sendTo(serverId: string, signal: SignalInput): Promise<void>;
    /**
     * Add peer to mesh
     */
    addPeer(serverId: string, host: string, port: number, required?: boolean): void;
    /**
     * Remove peer from mesh
     */
    removePeer(serverId: string): void;
    /**
     * Update peer lastSeen timestamp
     */
    private updatePeerLastSeen;
    /**
     * Start heartbeat timer
     */
    private startHeartbeat;
    /**
     * Start peer health check timer
     */
    private startPeerHealthCheck;
    /**
     * Prune stale peers (not seen within timeout)
     */
    private pruneStale;
    /**
     * Get socket statistics
     */
    getStats(): SocketStats;
    /**
     * Get peer count
     */
    getPeerCount(): number;
    /**
     * Get active peer count (peers seen within timeout)
     */
    getActivePeerCount(): number;
    /**
     * Graceful shutdown
     */
    stop(): Promise<void>;
}
export default InterlockSocket;
//# sourceMappingURL=socket.d.ts.map