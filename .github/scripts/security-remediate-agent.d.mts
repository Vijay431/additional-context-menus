export declare const ALLOWED_PATHS: readonly string[];
export declare function isAllowedPath(filePath: unknown): boolean;
export declare function isAllowedCommand(cmd: unknown, args: unknown): boolean;
export declare function validateFinalizeDecision(
  decision: unknown,
): { valid: true } | { valid: false; error: string };
export declare function countCriticalHigh(audit: unknown): number;
