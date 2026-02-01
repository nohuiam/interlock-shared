/**
 * InterLock Protocol Constants
 * Per INTERLOCK-PROTOCOL.barespec.md
 */
export declare const HEARTBEAT_INTERVAL_MS = 30000;
export declare const PEER_TIMEOUT_MS = 90000;
export declare const PEER_CHECK_INTERVAL_MS = 10000;
export declare const BANANO_HEADER_SIZE = 12;
export declare const BANANO_PROTOCOL_VERSION = 256;
export declare const SignalTypes: {
    readonly DOCK_REQUEST: 1;
    readonly DOCK_APPROVE: 2;
    readonly DOCK_DENY: 3;
    readonly HEARTBEAT: 4;
    readonly DISCONNECT: 5;
    readonly PING: 6;
    readonly PONG: 7;
    readonly CG_VALIDATION_ALERT: 48;
    readonly CG_PATTERN_LEARNED: 49;
    readonly CG_DRIFT_ALERT: 50;
    readonly CG_VALIDATION_REQUEST: 51;
    readonly CG_VALIDATION_RESPONSE: 52;
    readonly LAIBRARY_CATALOG_UPDATE: 69;
    readonly LAIBRARY_RATING_UPDATE: 70;
    readonly LAIBRARY_RECOMMENDATION: 71;
    readonly BUILD_STARTED: 96;
    readonly BUILD_PROGRESS: 97;
    readonly BUILD_COMPLETED: 98;
    readonly BUILD_FAILED: 99;
    readonly RESEARCH_REQUEST: 100;
    readonly RESEARCH_RESPONSE: 101;
    readonly VALIDATION_REQUEST: 102;
    readonly VALIDATION_RESPONSE: 103;
    readonly TOOL_REGISTERED: 104;
    readonly PATTERN_LEARNED: 105;
};
export type SignalType = (typeof SignalTypes)[keyof typeof SignalTypes];
export declare function getSignalName(type: number): string;
//# sourceMappingURL=constants.d.ts.map