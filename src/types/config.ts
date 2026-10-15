/**
 * Configuration Type Definitions
 *
 * Strongly-typed interfaces for extension configuration.
 * Provides compile-time and runtime type safety for settings.
 *
 * @description
 * This module provides:
 * - Type-safe configuration interfaces
 * - Configuration schema validation
 * - Default values
 * - Type guards and validation utilities
 *
 * @category Configuration
 * @module types/config
 */

/**
 * Copy Code Configuration
 *
 * Settings for copy/move code operations.
 */
export interface CopyCodeConfig {
  /** Where to insert copied code in target file */
  insertionPoint: 'smart' | 'end' | 'beginning';
  /** Whether to preserve comments when copying code */
  preserveComments: boolean;
}

/**
 * Save All Configuration
 *
 * Settings for bulk save operations.
 */
export interface SaveAllConfig {
  /** Show notification after saving files */
  showNotification: boolean;
  /** Skip read-only files when saving */
  skipReadOnly: boolean;
}

/**
 * Terminal Configuration
 *
 * Settings for terminal integration.
 */
export interface TerminalConfig {
  /** Type of terminal to open */
  type: 'integrated' | 'external' | 'system-default';
  /** Custom command for external terminal */
  externalTerminalCommand?: string;
  /** Which directory to open in terminal */
  openBehavior: 'parent-directory' | 'workspace-root' | 'current-directory';
}

/**
 * Keybindings Configuration
 *
 * Settings for keyboard shortcuts.
 */
export interface KeybindingsConfig {
  /** Enable custom keybindings */
  enabled: boolean;
  /** Show keybindings in context menus */
  showInMenu: boolean;
}

/**
 * Accessibility Configuration
 *
 * Settings for accessibility features.
 */
export interface AccessibilityConfig {
  /** Verbosity level for announcements */
  verbosity: 'minimal' | 'normal' | 'verbose';
  /** Enable enhanced screen reader support */
  screenReaderMode: boolean;
  /** Enable keyboard navigation hints */
  keyboardNavigation: boolean;
}

/**
 * Extension Configuration
 *
 * Complete configuration for the extension.
 */
export interface ExtensionConfiguration {
  /** Enable/disable extension globally */
  enabled: boolean;
  /** Automatic project detection */
  autoDetectProjects: boolean;
  /** Supported file extensions for context menu */
  supportedExtensions: string[];
  /** Copy code settings */
  copyCode: CopyCodeConfig;
  /** Save all settings */
  saveAll: SaveAllConfig;
  /** Terminal settings */
  terminal: TerminalConfig;
  /** Keybindings settings */
  keybindings: KeybindingsConfig;
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
}

/**
 * Configuration Section Keys
 *
 * Constants for configuration section keys.
 */
export const CONFIG_KEYS = {
  ENABLED: 'enabled',
  AUTO_DETECT_PROJECTS: 'autoDetectProjects',
  SUPPORTED_EXTENSIONS: 'supportedExtensions',
  COPY_CODE_INSERTION_POINT: 'copyCode.insertionPoint',
  COPY_CODE_PRESERVE_COMMENTS: 'copyCode.preserveComments',
  SAVE_ALL_SHOW_NOTIFICATION: 'saveAll.showNotification',
  SAVE_ALL_SKIP_READ_ONLY: 'saveAll.skipReadOnly',
  TERMINAL_TYPE: 'terminal.type',
  TERMINAL_EXTERNAL_COMMAND: 'terminal.externalTerminalCommand',
  TERMINAL_OPEN_BEHAVIOR: 'terminal.openBehavior',
  KEYBINDINGS_ENABLED: 'enableKeybindings',
  KEYBINDINGS_SHOW_IN_MENU: 'showKeybindingsInMenu',
  ACCESSIBILITY_VERBOSITY: 'accessibility.verbosity',
  ACCESSIBILITY_SCREEN_READER_MODE: 'accessibility.screenReaderMode',
  ACCESSIBILITY_KEYBOARD_NAVIGATION: 'accessibility.keyboardNavigation',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ExtensionConfiguration = {
  enabled: true,
  autoDetectProjects: true,
  supportedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  copyCode: {
    insertionPoint: 'smart',
    preserveComments: true,
  },
  saveAll: {
    showNotification: true,
    skipReadOnly: true,
  },
  terminal: {
    type: 'integrated',
    externalTerminalCommand: '',
    openBehavior: 'parent-directory',
  },
  keybindings: {
    enabled: false,
    showInMenu: true,
  },
  accessibility: {
    verbosity: 'normal',
    screenReaderMode: false,
    keyboardNavigation: true,
  },
} as const;

/**
 * Type guard for CopyCodeConfig
 */
export function isCopyCodeConfig(config: unknown): config is CopyCodeConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'insertionPoint' in config &&
    'handleImports' in config &&
    'preserveComments' in config
  );
}

/**
 * Type guard for SaveAllConfig
 */
export function isSaveAllConfig(config: unknown): config is SaveAllConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'showNotification' in config &&
    'skipReadOnly' in config
  );
}

/**
 * Type guard for TerminalConfig
 */
export function isTerminalConfig(config: unknown): config is TerminalConfig {
  return (
    typeof config === 'object' &&
    config !== null &&
    'type' in config &&
    'externalTerminalCommand' in config &&
    'openBehavior' in config
  );
}

/**
 * Validate Insertion Point Value
 */
export function isValidInsertionPoint(value: string): value is CopyCodeConfig['insertionPoint'] {
  return ['smart', 'end', 'beginning'].includes(value);
}

/**
 * Validate Terminal Type Value
 */
export function isValidTerminalType(value: string): value is TerminalConfig['type'] {
  return ['integrated', 'external', 'system-default'].includes(value);
}

/**
 * Validate Terminal Open Behavior Value
 */
export function isValidOpenBehavior(value: string): value is TerminalConfig['openBehavior'] {
  return ['parent-directory', 'workspace-root', 'current-directory'].includes(value);
}

/**
 * Validate Verbosity Value
 */
export function isValidVerbosity(value: string): value is AccessibilityConfig['verbosity'] {
  return ['minimal', 'normal', 'verbose'].includes(value);
}
