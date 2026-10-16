// TypeScript interfaces for the extension

/**
 * Re-export strongly-typed configuration types
 */
export type {
  AccessibilityConfig,
  CopyCodeConfig,
  ExtensionConfiguration,
  KeybindingsConfig,
  SaveAllConfig,
  TerminalConfig,
} from './config';

export { CONFIG_KEYS, DEFAULT_CONFIG } from './config';

/**
 * Legacy ExtensionConfig type for backward compatibility
 * @deprecated Use ExtensionConfiguration from config.ts instead
 */
export interface ExtensionConfig {
  enabled: boolean;
  autoDetectProjects: boolean;
  supportedExtensions: string[];
  copyCode: {
    insertionPoint: 'smart' | 'end' | 'beginning';
    preserveComments: boolean;
  };
  saveAll: {
    showNotification: boolean;
    skipReadOnly: boolean;
  };
  terminal: {
    type: 'integrated' | 'external' | 'system-default';
    externalTerminalCommand?: string;
    openBehavior: 'parent-directory' | 'workspace-root' | 'current-directory';
  };
  keybindings: {
    enabled: boolean;
    showInMenu: boolean;
  };
  /** Accessibility configuration (added for backward compatibility) */
  accessibility: {
    verbosity: 'minimal' | 'normal' | 'verbose';
    screenReaderMode: boolean;
    keyboardNavigation: boolean;
  };
}

export interface ProjectType {
  isNodeProject: boolean;
  frameworks: string[];
  hasTypeScript: boolean;
  supportLevel: 'full' | 'partial' | 'none';
}

export interface CompatibleFile {
  path: string;
  name: string;
  extension: string;
  isCompatible: boolean;
  lastModified: Date;
  relativePath: string;
}

export interface SaveAllResult {
  totalFiles: number;
  savedFiles: number;
  failedFiles: string[];
  skippedFiles: string[];
  success: boolean;
}

export interface CopyValidation {
  canCopy: boolean;
  targetExists: boolean;
  isCompatible: boolean;
  hasWritePermission: boolean;
  hasParseErrors: boolean;
  estimatedConflicts: number;
}

export interface MoveValidation {
  canMove: boolean;
  reason?: string;
  targetExists: boolean;
  isCompatible: boolean;
  hasWritePermission: boolean;
}

export interface CopyConflictResolution {
  handleNameConflicts: boolean;
  mergeImports: boolean;
  preserveComments: boolean;
  maintainFormatting: boolean;
}

export interface SaveAllFeedback {
  showProgress: boolean;
  showNotification: boolean;
  showFileCount: boolean;
  showFailures: boolean;
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  type: 'function' | 'method' | 'arrow' | 'component' | 'hook';
  isExported: boolean;
  hasDecorators: boolean;
  fullText: string;
}
