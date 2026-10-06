import { describe, it, expect } from 'vitest';
import { isPathWithin, isSafeFilePath } from '../../src/utils/pathValidator';

describe('isSafeFilePath', () => {
  it('should return true for a normal .ts file path', () => {
    expect(isSafeFilePath('/project/src/index.ts')).toBe(true);
  });

  it('should return true for a .tsx file', () => {
    expect(isSafeFilePath('/project/src/App.tsx')).toBe(true);
  });

  it('should return false for an empty string', () => {
    expect(isSafeFilePath('')).toBe(false);
  });

  it('should allow dirs with .. inside a name', () => {
    expect(isSafeFilePath('/a/my..proj/x.ts')).toBe(true);
  });

  it('should return false for a .exe extension', () => {
    expect(isSafeFilePath('/project/run.exe')).toBe(false);
  });

  it('should return false for a .vbs extension', () => {
    expect(isSafeFilePath('/project/run.vbs')).toBe(false);
  });

  it('should allow .sh files', () => {
    expect(isSafeFilePath('/project/setup.sh')).toBe(true);
  });

  it('should return false for a .bat extension', () => {
    expect(isSafeFilePath('/project/run.bat')).toBe(false);
  });

  it('should return false for a .cmd extension', () => {
    expect(isSafeFilePath('/project/run.cmd')).toBe(false);
  });

  it('should return false for a .ps1 extension', () => {
    expect(isSafeFilePath('/project/run.ps1')).toBe(false);
  });

  it('should allow .js files (rename convention targets)', () => {
    expect(isSafeFilePath('/project/my-file.js')).toBe(true);
  });

  it('should return false for a non-string input', () => {
    expect(isSafeFilePath(null as unknown as string)).toBe(false);
  });
});

describe('isPathWithin', () => {
  it('should accept the root itself and nested paths', () => {
    expect(isPathWithin('/ws', '/ws')).toBe(true);
    expect(isPathWithin('/ws', '/ws/src/a.ts')).toBe(true);
  });

  it('should reject traversal outside root', () => {
    expect(isPathWithin('/ws', '/ws/../etc/x')).toBe(false);
  });

  it('should accept a ..foo directory inside root', () => {
    expect(isPathWithin('/ws', '/ws/..foo/x.ts')).toBe(true);
  });

  it('should reject sibling dir sharing a name prefix', () => {
    expect(isPathWithin('/ws', '/ws2/x.ts')).toBe(false);
  });
});
