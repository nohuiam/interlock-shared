/**
 * InterLock Type Definitions
 */
import { SignalType } from './constants.js';
/**
 * Signal data payload - must include serverId
 */
export interface SignalData {
    serverId: string;
    timestamp?: number;
    [key: string]: unknown;
}
/**
 * Decoded signal structure
 */
export interface Signal {
    type: SignalType | number;
    version: string;
    timestamp: number;
    data: SignalData;
}
/**
 * Signal for encoding (version optional, timestamp auto-generated)
 */
export interface SignalInput {
    type: SignalType | number;
    version?: string;
    data: SignalData;
}
/**
 * Peer information
 */
export interface PeerInfo {
    host: string;
    port: number;
    lastSeen: number;
    required?: boolean;
}
/**
 * InterLock configuration
 */
export interface InterlockConfig {
    port: number;
    serverId: string;
    heartbeat?: {
        interval?: number;
        timeout?: number;
    };
    peers?: Record<string, {
        host: string;
        port: number;
        required?: boolean;
    }>;
}
/**
 * Socket statistics
 */
export interface SocketStats {
    serverId: string;
    port: number;
    totalPeers: number;
    activePeers: number;
    sent: number;
    received: number;
    dropped: number;
    peers: Array<{
        serverId: string;
        endpoint: string;
        lastSeenAgo: string;
    }>;
}
/**
 * Remote info from UDP message
 */
export interface RemoteInfo {
    address: string;
    family: 'IPv4' | 'IPv6';
    port: number;
    size: number;
}
/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
//# sourceMappingURL=types.d.ts.map