/**
 * InterLock Protocol Constants
 * Per INTERLOCK-PROTOCOL.barespec.md
 */

// Timing constants (protocol-compliant)
export const HEARTBEAT_INTERVAL_MS = 30000;      // 30 seconds between heartbeats
export const PEER_TIMEOUT_MS = 90000;            // 3x heartbeat = 90 seconds
export const PEER_CHECK_INTERVAL_MS = 10000;     // Check for stale peers every 10s

// BaNano protocol constants
export const BANANO_HEADER_SIZE = 12;
export const BANANO_PROTOCOL_VERSION = 0x0100;   // Version 1.0

// Standard signal types (ecosystem-wide)
export const SignalTypes = {
  // Core protocol signals (0x01-0x0F)
  DOCK_REQUEST: 0x01,
  DOCK_APPROVE: 0x02,
  DOCK_DENY: 0x03,
  HEARTBEAT: 0x04,
  DISCONNECT: 0x05,
  PING: 0x06,
  PONG: 0x07,

  // Context Guardian signals (0x30-0x3F)
  CG_VALIDATION_ALERT: 0x30,
  CG_PATTERN_LEARNED: 0x31,
  CG_DRIFT_ALERT: 0x32,
  CG_VALIDATION_REQUEST: 0x33,
  CG_VALIDATION_RESPONSE: 0x34,

  // lAIbrary signals (0x45-0x5F)
  LAIBRARY_CATALOG_UPDATE: 0x45,
  LAIBRARY_RATING_UPDATE: 0x46,
  LAIBRARY_RECOMMENDATION: 0x47,

  // Neurogenesis signals (0x60-0x6F)
  BUILD_STARTED: 0x60,
  BUILD_PROGRESS: 0x61,
  BUILD_COMPLETED: 0x62,
  BUILD_FAILED: 0x63,
  RESEARCH_REQUEST: 0x64,
  RESEARCH_RESPONSE: 0x65,
  VALIDATION_REQUEST: 0x66,
  VALIDATION_RESPONSE: 0x67,
  TOOL_REGISTERED: 0x68,
  PATTERN_LEARNED: 0x69,
} as const;

export type SignalType = (typeof SignalTypes)[keyof typeof SignalTypes];

// Signal type name lookup
export function getSignalName(type: number): string {
  const names: Record<number, string> = {};
  for (const [name, value] of Object.entries(SignalTypes)) {
    names[value] = name;
  }
  return names[type] || `UNKNOWN_0x${type.toString(16).padStart(2, '0')}`;
}
