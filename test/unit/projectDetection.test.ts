import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ProjectDetectionService } from '../../src/services/projectDetectionService';

const REACT_FIXTURE = path.resolve(__dirname, '../fixtures/react-project');
const EMPTY_FIXTURE = path.resolve(__dirname, '../fixtures/empty-project');

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  dispose: () => {},
} as any;

function makeService(cacheTTL?: number) {
  return ProjectDetectionService.create(mockLogger, undefined, cacheTTL);
}

function makeFolder(fsPath: string) {
  return { uri: { fsPath }, name: 'test', index: 0 } as any;
}

describe('ProjectDetectionService', () => {
  it('should detect React from a fixture package.json', async () => {
    const result = await makeService().detectProjectType(makeFolder(REACT_FIXTURE));
    expect(result.isNodeProject).toBe(true);
    expect(result.frameworks).toContain('react');
  });

  it('should return isNodeProject false for an empty project', async () => {
    const result = await makeService().detectProjectType(makeFolder(EMPTY_FIXTURE));
    expect(result.isNodeProject).toBe(false);
    expect(result.frameworks).toHaveLength(0);
  });

  it('should return isNodeProject false when no workspaceFolder is provided', async () => {
    const result = await makeService().detectProjectType(undefined);
    expect(result.isNodeProject).toBe(false);
  });

  it('should return the cached result on a second call within TTL', async () => {
    const service = makeService(60000);
    const folder = makeFolder(REACT_FIXTURE);
    const first = await service.detectProjectType(folder);
    const second = await service.detectProjectType(folder);
    expect(first.isNodeProject).toBe(second.isNodeProject);
    expect(first.frameworks).toEqual(second.frameworks);
  });

  it('should re-detect after the cache TTL expires', async () => {
    // Use a 50ms TTL so the cache expires quickly
    const service = makeService(50);
    const folder = makeFolder(REACT_FIXTURE);
    const first = await service.detectProjectType(folder);
    expect(first.frameworks).toContain('react');

    // Wait for cache to expire
    await new Promise((r) => setTimeout(r, 100));

    // Second call must re-read from disk and still return correct result
    const second = await service.detectProjectType(folder);
    expect(second.frameworks).toContain('react');
  });
});
