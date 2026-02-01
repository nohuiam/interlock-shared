/**
 * @bop/interlock - Shared InterLock UDP Mesh Protocol
 *
 * Canonical implementation for the BOP ecosystem.
 * All 42+ InterLock-enabled servers should use this package.
 */
export { BaNanoProtocol } from './protocol.js';
export { InterlockSocket } from './socket.js';
export { HEARTBEAT_INTERVAL_MS, PEER_TIMEOUT_MS, PEER_CHECK_INTERVAL_MS, BANANO_HEADER_SIZE, BANANO_PROTOCOL_VERSION, SignalTypes, getSignalName, } from './constants.js';
export type { Signal, SignalInput, SignalData, PeerInfo, InterlockConfig, SocketStats, RemoteInfo, ValidationResult, } from './types.js';
export type { SignalType } from './constants.js';
export { InterlockSocket as default } from './socket.js';
//# sourceMappingURL=index.d.ts.map