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
import dgram from 'dgram';
import { EventEmitter } from 'events';
import { BaNanoProtocol } from './protocol.js';
import { HEARTBEAT_INTERVAL_MS, PEER_TIMEOUT_MS, PEER_CHECK_INTERVAL_MS, SignalTypes, } from './constants.js';
export class InterlockSocket extends EventEmitter {
    socket;
    config;
    peers = new Map();
    heartbeatTimer = null;
    peerCheckTimer = null;
    stats = { sent: 0, received: 0, dropped: 0 };
    isRunning = false;
    constructor(config) {
        super();
        this.config = config;
        this.socket = dgram.createSocket('udp4');
        this.initializePeers();
    }
    /**
     * Initialize peers from config
     */
    initializePeers() {
        if (!this.config.peers)
            return;
        for (const [serverId, peerConfig] of Object.entries(this.config.peers)) {
            if (peerConfig.host && peerConfig.port) {
                this.peers.set(serverId, {
                    host: peerConfig.host,
                    port: peerConfig.port,
                    lastSeen: 0, // Never seen yet
                    required: peerConfig.required || false,
                });
            }
        }
        console.log(`[InterLock] ${this.config.serverId} initialized ${this.peers.size} peers`);
    }
    /**
     * Start the UDP socket
     */
    async start() {
        if (this.isRunning)
            return;
        return new Promise((resolve, reject) => {
            this.socket.on('error', (err) => {
                console.error(`[InterLock] ${this.config.serverId} socket error:`, err.message);
                this.emit('error', err);
                if (!this.isRunning)
                    reject(err);
            });
            this.socket.on('message', (msg, rinfo) => {
                this.handleMessage(msg, rinfo);
            });
            this.socket.on('listening', () => {
                this.isRunning = true;
                console.log(`[InterLock] ${this.config.serverId} listening on port ${this.config.port}`);
                this.startHeartbeat();
                this.startPeerHealthCheck();
                resolve();
            });
            this.socket.bind(this.config.port);
        });
    }
    /**
     * Handle incoming message with validation
     */
    handleMessage(msg, rinfo) {
        try {
            const signal = BaNanoProtocol.decode(msg);
            if (!signal) {
                this.stats.dropped++;
                return;
            }
            // Validate signal has required fields
            if (!this.isValidSignal(signal)) {
                this.stats.dropped++;
                return;
            }
            this.stats.received++;
            // Update peer lastSeen
            if (signal.data.serverId && typeof signal.data.serverId === 'string') {
                this.updatePeerLastSeen(signal.data.serverId, rinfo);
            }
            this.emit('signal', signal, rinfo);
        }
        catch (err) {
            console.error(`[InterLock] ${this.config.serverId} decode error:`, err instanceof Error ? err.message : err);
            this.stats.dropped++;
        }
    }
    /**
     * Validate signal structure
     */
    isValidSignal(signal) {
        if (!signal || typeof signal !== 'object')
            return false;
        const s = signal;
        if (typeof s.type !== 'number')
            return false;
        if (!s.data || typeof s.data !== 'object')
            return false;
        return true;
    }
    /**
     * Send signal to specific host:port
     */
    send(host, port, signal) {
        return new Promise((resolve, reject) => {
            try {
                const validation = BaNanoProtocol.validate(signal);
                if (!validation.valid) {
                    reject(new Error(`Invalid signal: ${validation.errors.join(', ')}`));
                    return;
                }
                const encoded = BaNanoProtocol.encode(signal);
                this.socket.send(encoded, port, host, (err) => {
                    if (err) {
                        console.error(`[InterLock] ${this.config.serverId} send error:`, err.message);
                        this.stats.dropped++;
                        reject(err);
                    }
                    else {
                        this.stats.sent++;
                        resolve();
                    }
                });
            }
            catch (err) {
                console.error(`[InterLock] ${this.config.serverId} encode error:`, err instanceof Error ? err.message : err);
                this.stats.dropped++;
                reject(err);
            }
        });
    }
    /**
     * Broadcast signal to all known peers
     */
    async broadcast(signal) {
        const promises = Array.from(this.peers.values()).map((peer) => this.send(peer.host, peer.port, signal).catch((err) => {
            // Don't fail entire broadcast if one peer fails
            console.error(`[InterLock] Failed to send to ${peer.host}:${peer.port}:`, err.message);
        }));
        await Promise.allSettled(promises);
    }
    /**
     * Send to specific server by ID
     */
    async sendTo(serverId, signal) {
        const peer = this.peers.get(serverId);
        if (!peer) {
            throw new Error(`Unknown peer: ${serverId}`);
        }
        return this.send(peer.host, peer.port, signal);
    }
    /**
     * Add peer to mesh
     */
    addPeer(serverId, host, port, required = false) {
        const peer = { host, port, lastSeen: Date.now(), required };
        this.peers.set(serverId, peer);
        this.emit('peer_added', { serverId, peer });
        console.log(`[InterLock] ${this.config.serverId} added peer ${serverId} (${host}:${port})`);
    }
    /**
     * Remove peer from mesh
     */
    removePeer(serverId) {
        if (this.peers.has(serverId)) {
            this.peers.delete(serverId);
            this.emit('peer_removed', { serverId });
            console.log(`[InterLock] ${this.config.serverId} removed peer ${serverId}`);
        }
    }
    /**
     * Update peer lastSeen timestamp
     */
    updatePeerLastSeen(serverId, rinfo) {
        const peer = this.peers.get(serverId);
        if (peer) {
            peer.lastSeen = Date.now();
        }
        else if (rinfo) {
            // Auto-add peers we hear from (dynamic discovery)
            this.addPeer(serverId, rinfo.address, rinfo.port);
        }
    }
    /**
     * Start heartbeat timer
     */
    startHeartbeat() {
        const interval = this.config.heartbeat?.interval || HEARTBEAT_INTERVAL_MS;
        this.heartbeatTimer = setInterval(async () => {
            const signal = {
                type: SignalTypes.HEARTBEAT,
                data: {
                    serverId: this.config.serverId,
                    timestamp: Date.now(),
                    uptime: Math.floor(process.uptime()),
                },
            };
            await this.broadcast(signal);
        }, interval);
    }
    /**
     * Start peer health check timer
     */
    startPeerHealthCheck() {
        this.peerCheckTimer = setInterval(() => {
            this.pruneStale();
        }, PEER_CHECK_INTERVAL_MS);
    }
    /**
     * Prune stale peers (not seen within timeout)
     */
    pruneStale() {
        const now = Date.now();
        const timeout = this.config.heartbeat?.timeout || PEER_TIMEOUT_MS;
        const stalePeers = [];
        for (const [serverId, peer] of this.peers) {
            // Skip peers we've never heard from (configured but not yet connected)
            if (peer.lastSeen === 0)
                continue;
            if (now - peer.lastSeen > timeout) {
                stalePeers.push(serverId);
                console.log(`[InterLock] ${this.config.serverId} peer timeout: ${serverId} ` +
                    `(last seen ${Math.floor((now - peer.lastSeen) / 1000)}s ago)`);
            }
        }
        // Remove stale peers (or mark as disconnected if required)
        for (const serverId of stalePeers) {
            const peer = this.peers.get(serverId);
            if (peer.required) {
                // Required peers: mark as disconnected but keep in list
                peer.lastSeen = 0;
            }
            else {
                // Optional peers: remove from list
                this.peers.delete(serverId);
            }
            this.emit('peer_timeout', { serverId, peer });
        }
    }
    /**
     * Get socket statistics
     */
    getStats() {
        const now = Date.now();
        const activePeers = Array.from(this.peers.entries())
            .filter(([_, peer]) => peer.lastSeen > 0)
            .map(([id, peer]) => ({
            serverId: id,
            endpoint: `${peer.host}:${peer.port}`,
            lastSeenAgo: `${Math.floor((now - peer.lastSeen) / 1000)}s`,
        }));
        return {
            serverId: this.config.serverId,
            port: this.config.port,
            totalPeers: this.peers.size,
            activePeers: activePeers.length,
            ...this.stats,
            peers: activePeers,
        };
    }
    /**
     * Get peer count
     */
    getPeerCount() {
        return this.peers.size;
    }
    /**
     * Get active peer count (peers seen within timeout)
     */
    getActivePeerCount() {
        return Array.from(this.peers.values()).filter((p) => p.lastSeen > 0).length;
    }
    /**
     * Graceful shutdown
     */
    async stop() {
        if (!this.isRunning)
            return;
        // Clear timers
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.peerCheckTimer) {
            clearInterval(this.peerCheckTimer);
            this.peerCheckTimer = null;
        }
        // Send DISCONNECT signal
        try {
            const signal = {
                type: SignalTypes.DISCONNECT,
                data: {
                    serverId: this.config.serverId,
                    reason: 'Graceful shutdown',
                },
            };
            await this.broadcast(signal);
        }
        catch {
            // Ignore errors during shutdown broadcast
        }
        // Close socket
        return new Promise((resolve) => {
            this.socket.close(() => {
                this.isRunning = false;
                console.log(`[InterLock] ${this.config.serverId} socket closed`);
                resolve();
            });
        });
    }
}
export default InterlockSocket;
//# sourceMappingURL=socket.js.map