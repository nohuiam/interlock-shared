/**
 * BaNano Protocol - Binary encoding for InterLock signals
 *
 * Signal Structure (12-byte header + JSON payload):
 * Bytes 0-1:   Signal Type (uint16, big-endian)
 * Bytes 2-3:   Protocol Version (uint16, e.g., 0x0100 = version 1.0)
 * Bytes 4-7:   Payload Length (uint32, big-endian)
 * Bytes 8-11:  Timestamp (uint32, Unix timestamp)
 * Bytes 12+:   Payload (JSON string, UTF-8 encoded)
 */
import type { Signal, SignalInput, ValidationResult } from './types.js';
export declare class BaNanoProtocol {
    static readonly HEADER_SIZE = 12;
    static readonly PROTOCOL_VERSION = 256;
    /**
     * Encode a signal to binary format
     */
    static encode(signal: SignalInput): Buffer;
    /**
     * Decode binary BaNano format
     */
    private static decodeBinary;
    /**
     * Decode text formats for backward compatibility
     * Format A: {t, s, d, ts}
     * Format B: {type, source, payload, timestamp}
     */
    private static decodeText;
    /**
     * Decode a signal - supports binary and text formats
     */
    static decode(buffer: Buffer): Signal | null;
    /**
     * Validate signal structure
     */
    static validate(signal: SignalInput): ValidationResult;
}
export default BaNanoProtocol;
//# sourceMappingURL=protocol.d.ts.map