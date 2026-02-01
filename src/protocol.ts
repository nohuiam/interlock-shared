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

import { BANANO_HEADER_SIZE, BANANO_PROTOCOL_VERSION } from './constants.js';
import type { Signal, SignalInput, ValidationResult } from './types.js';

export class BaNanoProtocol {
  static readonly HEADER_SIZE = BANANO_HEADER_SIZE;
  static readonly PROTOCOL_VERSION = BANANO_PROTOCOL_VERSION;

  /**
   * Encode a signal to binary format
   */
  static encode(signal: SignalInput): Buffer {
    if (typeof signal.type !== 'number') {
      throw new Error('Signal type must be a number');
    }
    if (!signal.data || typeof signal.data !== 'object') {
      throw new Error('Signal data must be an object');
    }
    if (!signal.data.serverId) {
      throw new Error('Signal data must include serverId');
    }

    const payloadString = JSON.stringify(signal.data);
    const payloadBuffer = Buffer.from(payloadString, 'utf8');
    const timestamp = Math.floor(Date.now() / 1000);

    const header = Buffer.alloc(this.HEADER_SIZE);
    header.writeUInt16BE(signal.type, 0);
    header.writeUInt16BE(this.PROTOCOL_VERSION, 2);
    header.writeUInt32BE(payloadBuffer.length, 4);
    header.writeUInt32BE(timestamp, 8);

    return Buffer.concat([header, payloadBuffer]);
  }

  /**
   * Decode binary BaNano format
   */
  private static decodeBinary(buffer: Buffer): Signal | null {
    if (buffer.length < this.HEADER_SIZE) return null;

    const type = buffer.readUInt16BE(0);
    const versionUint16 = buffer.readUInt16BE(2);
    const payloadLength = buffer.readUInt32BE(4);
    const timestamp = buffer.readUInt32BE(8);

    // Validate signal type
    if (type === 0 || type > 0xFFFF) return null;
    if (buffer.length < this.HEADER_SIZE + payloadLength) return null;

    const major = (versionUint16 >> 8) & 0xFF;
    const minor = versionUint16 & 0xFF;
    const version = `${major}.${minor}`;

    const payloadBuffer = buffer.subarray(this.HEADER_SIZE, this.HEADER_SIZE + payloadLength);
    const payloadString = payloadBuffer.toString('utf8');

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(payloadString);
    } catch {
      return null;
    }

    // Normalize serverId
    if (!data.serverId) {
      data.serverId = data.sender || data.source || 'unknown';
    }

    return { type, version, timestamp, data: data as Signal['data'] };
  }

  /**
   * Decode text formats for backward compatibility
   * Format A: {t, s, d, ts}
   * Format B: {type, source, payload, timestamp}
   */
  private static decodeText(buffer: Buffer): Signal | null {
    try {
      const str = buffer.toString('utf8');
      if (!str.startsWith('{')) return null;

      const json = JSON.parse(str) as Record<string, unknown>;

      // Format A: {t, s, d, ts}
      if ('t' in json && 's' in json) {
        const d = json.d as Record<string, unknown> | undefined;
        return {
          type: json.t as number,
          version: '1.0',
          timestamp: Math.floor(((json.ts as number) || Date.now()) / 1000),
          data: {
            serverId: json.s as string,
            ...(typeof d === 'object' && d !== null ? d : { data: json.d }),
          },
        };
      }

      // Format B: {type, source, payload, timestamp}
      if ('type' in json && 'source' in json) {
        const payload = json.payload as Record<string, unknown> | undefined;
        return {
          type: typeof json.type === 'number' ? json.type : 0x04,
          version: '1.0',
          timestamp: Math.floor(((json.timestamp as number) || Date.now()) / 1000),
          data: {
            serverId: json.source as string,
            ...(typeof payload === 'object' && payload !== null ? payload : {}),
          },
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Decode a signal - supports binary and text formats
   */
  static decode(buffer: Buffer): Signal | null {
    const binaryResult = this.decodeBinary(buffer);
    if (binaryResult) return binaryResult;
    return this.decodeText(buffer);
  }

  /**
   * Validate signal structure
   */
  static validate(signal: SignalInput): ValidationResult {
    const errors: string[] = [];

    if (typeof signal.type !== 'number' || signal.type < 0 || signal.type > 0xFFFF) {
      errors.push('Signal type must be a number between 0x00 and 0xFFFF');
    }

    if (!signal.data || typeof signal.data !== 'object') {
      errors.push('Signal data must be an object');
    }

    if (signal.data && !signal.data.serverId) {
      errors.push('Signal data must include serverId');
    }

    return { valid: errors.length === 0, errors };
  }
}

export default BaNanoProtocol;
