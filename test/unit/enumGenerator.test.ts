import { describe, expect, it, vi } from 'vitest';

import { EnumGeneratorService } from '../../src/services/enumGeneratorService';

const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
};

const mockA11y = {
  announce: vi.fn(),
  announceSuccess: vi.fn(),
  announceError: vi.fn(),
  isScreenReaderOptimized: vi.fn(() => false),
  getVerbosity: vi.fn(() => 'normal'),
};

function makeService() {
  return EnumGeneratorService.create(mockLogger as any, mockA11y as any);
}

describe('EnumGeneratorService.parseUnionType', () => {
  it('should parse a type alias with string literals', () => {
    const service = makeService();
    const result = service.parseUnionType("type Status = 'pending' | 'approved' | 'rejected';");
    expect(result).not.toBeNull();
    expect(result!.variableName).toBe('Status');
    expect(result!.values).toEqual(['pending', 'approved', 'rejected']);
  });

  it('should return null for non-union text', () => {
    const service = makeService();
    expect(service.parseUnionType('const x = 1;')).toBeNull();
  });

  it('should return null for empty string', () => {
    const service = makeService();
    expect(service.parseUnionType('')).toBeNull();
  });

  it('should handle union without semicolon', () => {
    const service = makeService();
    const result = service.parseUnionType("type Color = 'red' | 'green' | 'blue'");
    expect(result).not.toBeNull();
    expect(result!.values).toEqual(['red', 'green', 'blue']);
  });

  it('should parse inline property type annotation', () => {
    const service = makeService();
    const result = service.parseUnionType("status: 'active' | 'inactive';");
    expect(result).not.toBeNull();
    expect(result!.variableName).toBe('status');
    expect(result!.values).toContain('active');
    expect(result!.values).toContain('inactive');
  });
});

describe('EnumGeneratorService.generateEnum', () => {
  it('should generate enum with UPPER_CASE convention', () => {
    const service = makeService();
    const output = service.generateEnum(['pending', 'approved'], 'Status', 'UPPER_CASE');
    expect(output).toContain('export enum Status');
    expect(output).toContain("PENDING = 'pending'");
    expect(output).toContain("APPROVED = 'approved'");
  });

  it('should generate enum with PascalCase convention', () => {
    const service = makeService();
    const output = service.generateEnum(['pending', 'in-progress'], 'Status', 'PascalCase');
    expect(output).toContain("Pending = 'pending'");
    expect(output).toContain("InProgress = 'in-progress'");
  });

  it('should generate enum with camelCase convention', () => {
    const service = makeService();
    const output = service.generateEnum(['my-value'], 'MyEnum', 'camelCase');
    expect(output).toContain("myValue = 'my-value'");
  });
});

describe('EnumGeneratorService.formatEnumMember', () => {
  it('should format to UPPER_CASE', () => {
    const service = makeService();
    expect(service.formatEnumMember('my value', 'UPPER_CASE')).toBe('MY_VALUE');
  });

  it('should format to PascalCase', () => {
    const service = makeService();
    expect(service.formatEnumMember('my value', 'PascalCase')).toBe('MyValue');
  });

  it('should format to camelCase', () => {
    const service = makeService();
    expect(service.formatEnumMember('my value', 'camelCase')).toBe('myValue');
  });
});

describe('EnumGeneratorService.extractUnionValues', () => {
  it('should extract double-quoted values', () => {
    const service = makeService();
    const values = service.extractUnionValues('"pending" | "approved" | "rejected"');
    expect(values).toEqual(['pending', 'approved', 'rejected']);
  });

  it('should return empty array for text without quoted values', () => {
    const service = makeService();
    expect(service.extractUnionValues('const x = 1')).toEqual([]);
  });
});
