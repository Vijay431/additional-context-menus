import { describe, expect, it } from 'vitest';
import { FileDiscoveryService } from '../../src/services/fileDiscoveryService';

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  dispose: () => {},
} as any;

const mockA11y = {
  announce: async () => {},
  isScreenReaderOptimized: () => false,
  getVerbosity: () => 'normal',
  shouldAnnounce: () => false,
} as any;

const service = FileDiscoveryService.create(mockLogger, mockA11y);

describe('FileDiscoveryService.isCompatibleExtension', () => {
  it('should consider .ts compatible with .ts', () => {
    expect(service.isCompatibleExtension('.ts', '.ts')).toBe(true);
  });

  it('should consider .ts compatible with .tsx', () => {
    expect(service.isCompatibleExtension('.ts', '.tsx')).toBe(true);
  });

  it('should consider .tsx compatible with .ts', () => {
    expect(service.isCompatibleExtension('.tsx', '.ts')).toBe(true);
  });

  it('should consider .js compatible with .jsx', () => {
    expect(service.isCompatibleExtension('.js', '.jsx')).toBe(true);
  });

  it('should consider .jsx compatible with .js', () => {
    expect(service.isCompatibleExtension('.jsx', '.js')).toBe(true);
  });

  it('should not consider .ts compatible with .js', () => {
    expect(service.isCompatibleExtension('.ts', '.js')).toBe(false);
  });

  it('should not consider .js compatible with .ts', () => {
    expect(service.isCompatibleExtension('.js', '.ts')).toBe(false);
  });

  it('should handle extensions without a leading dot', () => {
    expect(service.isCompatibleExtension('ts', 'tsx')).toBe(true);
  });
});

describe('FileDiscoveryService.getCompatibleFiles', () => {
  it('should return an empty array when no workspace folders exist', async () => {
    const files = await service.getCompatibleFiles('.ts');
    expect(files).toEqual([]);
  });
});
