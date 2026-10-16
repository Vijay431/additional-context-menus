import { describe, expect, it } from 'vitest';
import type { ILogger } from '../../src/di/interfaces/ILogger';
import type { ExtensionConfig } from '../../src/types/extension';
import { ConfigValidator } from '../../src/utils/configValidator';

function makeLogger(): ILogger & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    debug: () => {},
    info: () => {},
    warn: (msg: string) => {
      warnings.push(msg);
    },
    error: () => {},
    setLogLevel: () => {},
    show: () => {},
    dispose: () => {},
  };
}

function validConfig(): ExtensionConfig {
  return {
    enabled: true,
    autoDetectProjects: true,
    supportedExtensions: ['.ts', '.tsx'],
    copyCode: { insertionPoint: 'smart', preserveComments: true },
    saveAll: { showNotification: true, skipReadOnly: true },
    terminal: { type: 'integrated', openBehavior: 'parent-directory' },
    keybindings: { enabled: false, showInMenu: true },
    accessibility: { verbosity: 'normal', screenReaderMode: false, keyboardNavigation: true },
  };
}

describe('ConfigValidator.validate', () => {
  it('should return config unchanged when all values are valid', () => {
    const logger = makeLogger();
    const result = ConfigValidator.validate(validConfig(), logger);
    expect(result.copyCode.insertionPoint).toBe('smart');
    expect(result.accessibility.verbosity).toBe('normal');
    expect(result.terminal.type).toBe('integrated');
    expect(result.terminal.openBehavior).toBe('parent-directory');
    expect(logger.warnings).toHaveLength(0);
  });

  it('should replace an invalid insertionPoint with the default and warn', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.copyCode.insertionPoint as string) = 'invalid';
    const result = ConfigValidator.validate(config, logger);
    expect(result.copyCode.insertionPoint).toBe('smart');
    expect(logger.warnings.some((w) => w.includes('insertionPoint'))).toBe(true);
  });

  it('should replace an invalid verbosity with the default and warn', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.accessibility.verbosity as string) = 'extreme';
    const result = ConfigValidator.validate(config, logger);
    expect(result.accessibility.verbosity).toBe('normal');
    expect(logger.warnings.some((w) => w.includes('verbosity'))).toBe(true);
  });

  it('should replace an invalid terminal.type with the default and warn', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.terminal.type as string) = 'unknown';
    const result = ConfigValidator.validate(config, logger);
    expect(result.terminal.type).toBe('integrated');
    expect(logger.warnings.some((w) => w.includes('terminal.type'))).toBe(true);
  });

  it('should replace an invalid terminal.openBehavior with the default and warn', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.terminal.openBehavior as string) = 'nowhere';
    const result = ConfigValidator.validate(config, logger);
    expect(result.terminal.openBehavior).toBe('parent-directory');
    expect(logger.warnings.some((w) => w.includes('openBehavior'))).toBe(true);
  });

  it('should not mutate the original config', () => {
    const logger = makeLogger();
    const config = validConfig();
    (config.copyCode.insertionPoint as string) = 'bad';
    ConfigValidator.validate(config, logger);
    expect(config.copyCode.insertionPoint as string).toBe('bad');
  });
});
