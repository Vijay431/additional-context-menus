import { describe, expect, it, vi } from 'vitest';

import { LogCategory, LogFormat, Logger, LogLevel } from '../../src/utils/logger';

function makeChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
    clear: vi.fn(),
  };
}

describe('Logger', () => {
  describe('log level filtering', () => {
    it('should suppress messages below the configured log level', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogLevel(LogLevel.WARN);

      logger.debug('debug msg');
      logger.info('info msg');

      expect(channel.appendLine).not.toHaveBeenCalled();
    });

    it('should emit messages at or above the configured log level', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogLevel(LogLevel.WARN);

      logger.warn('warn msg');
      logger.error('error msg');

      expect(channel.appendLine).toHaveBeenCalledTimes(2);
    });

    it('should emit all levels when level is DEBUG', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogLevel(LogLevel.DEBUG);

      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      logger.error('e');

      expect(channel.appendLine).toHaveBeenCalledTimes(4);
    });
  });

  describe('text format', () => {
    it('should include level name in log output', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogLevel(LogLevel.DEBUG);

      logger.info('hello world');

      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining('hello world'));
    });

    it('should include timestamp in log output', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);

      logger.info('test');

      const call = channel.appendLine.mock.calls[0][0] as string;
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T/);
    });

    it('should serialize extra data on a second line', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);

      logger.info('with data', { foo: 'bar' });

      expect(channel.appendLine).toHaveBeenCalledTimes(2);
      const dataLine = channel.appendLine.mock.calls[1][0] as string;
      expect(dataLine).toContain('"foo"');
    });
  });

  describe('JSON format', () => {
    it('should emit valid JSON when format is JSON', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogFormat(LogFormat.JSON);

      logger.warn('json test');

      const raw = channel.appendLine.mock.calls[0][0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.level).toBe('WARN');
      expect(parsed.message).toBe('json test');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should include data field in JSON when data provided', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogFormat(LogFormat.JSON);

      logger.error('err', { code: 42 });

      const raw = channel.appendLine.mock.calls[0][0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.data).toEqual({ code: 42 });
    });

    it('should include category field in JSON output', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.setLogFormat(LogFormat.JSON);

      logger.info('op');

      const raw = channel.appendLine.mock.calls[0][0] as string;
      const parsed = JSON.parse(raw);
      expect(parsed.category).toBe(LogCategory.GENERAL);
    });
  });

  describe('lifecycle', () => {
    it('should call show on the output channel', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.show();
      expect(channel.show).toHaveBeenCalled();
    });

    it('should call dispose on the output channel', () => {
      const channel = makeChannel();
      const logger = Logger.create(channel as any);
      logger.dispose();
      expect(channel.dispose).toHaveBeenCalled();
    });
  });

  describe('create factory', () => {
    it('should create independent logger instances', () => {
      const ch1 = makeChannel();
      const ch2 = makeChannel();
      const l1 = Logger.create(ch1 as any);
      const l2 = Logger.create(ch2 as any);

      l1.info('from l1');

      expect(ch1.appendLine).toHaveBeenCalled();
      expect(ch2.appendLine).not.toHaveBeenCalled();
    });
  });
});
