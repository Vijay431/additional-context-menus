import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  textDocuments: [] as unknown[],
  stat: vi.fn(),
  withProgress: vi.fn(),
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
}));

vi.mock('vscode', () => ({
  workspace: {
    get textDocuments() {
      return mocks.textDocuments;
    },
    fs: { stat: mocks.stat },
  },
  window: {
    withProgress: mocks.withProgress,
    showInformationMessage: mocks.showInformationMessage,
    showWarningMessage: mocks.showWarningMessage,
  },
  ProgressLocation: { Notification: 15 },
  FilePermission: { Readonly: 1 },
}));

import { FileSaveService } from '../../src/services/fileSaveService';

interface FakeDoc {
  fileName: string;
  isDirty: boolean;
  isUntitled: boolean;
  uri: { scheme: string; toString(): string };
  save: ReturnType<typeof vi.fn>;
}

function doc(name: string, save: () => Promise<boolean> = async () => true, dirty = true): FakeDoc {
  return {
    fileName: name,
    isDirty: dirty,
    isUntitled: false,
    uri: { scheme: 'file', toString: () => `file://${name}` },
    save: vi.fn(save),
  };
}

function makeService(skipReadOnly = false) {
  const logger = {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    show: vi.fn(),
  };
  const config = {
    getSaveAllConfig: () => ({ skipReadOnly, showNotification: false }),
  };
  const a11y = {
    announce: vi.fn(async () => {}),
    announceProgress: vi.fn(async () => {}),
    announceSuccess: vi.fn(async () => {}),
    announceError: vi.fn(async () => {}),
  };
  const service = FileSaveService.create(logger as never, config as never, a11y as never);
  return { service, logger };
}

describe('FileSaveService', () => {
  beforeEach(() => {
    mocks.textDocuments = [];
    mocks.stat.mockReset();
    mocks.withProgress.mockReset();
    mocks.withProgress.mockImplementation(
      async (_opts: unknown, task: (p: { report: (v: unknown) => void }) => Promise<void>) =>
        task({ report: () => {} }),
    );
  });

  it('returns real file names in saveAllFiles result', async () => {
    mocks.textDocuments = [doc('/a.ts'), doc('/b.ts')];
    const { service } = makeService();
    const result = await service.saveAllFiles();
    expect(result.savedFiles).toEqual(['/a.ts', '/b.ts']);
    expect(result.savedCount).toBe(2);
  });

  it('surfaces actual failure error text', async () => {
    mocks.textDocuments = [
      doc('/a.ts'),
      doc('/bad.ts', async () => {
        throw new Error('EACCES: nope');
      }),
    ];
    const { service } = makeService();
    const result = await service.saveAllFiles();
    expect(result.failedFiles).toEqual([{ path: '/bad.ts', error: 'EACCES: nope' }]);
    expect(result.failedCount).toBe(1);
    expect(result.savedFiles).toEqual(['/a.ts']);
  });

  it('skips read-only files via fs.stat when skipReadOnly is on', async () => {
    mocks.textDocuments = [doc('/ro.ts'), doc('/rw.ts')];
    mocks.stat.mockImplementation(async (uri: { toString(): string }) => ({
      permissions: uri.toString().includes('/ro.ts') ? 1 : undefined,
    }));
    const { service } = makeService(true);
    const result = await service.saveAllFiles();
    expect(result.skippedFiles).toEqual(['/ro.ts']);
    expect(result.savedFiles).toEqual(['/rw.ts']);
  });

  it('keeps non-file schemes when they are writable', async () => {
    const remote = doc('/remote.ts');
    remote.uri = { scheme: 'vscode-remote', toString: () => 'vscode-remote://x/remote.ts' };
    mocks.textDocuments = [remote];
    mocks.stat.mockResolvedValue({ permissions: undefined });
    const { service } = makeService(true);
    const result = await service.saveAllFiles();
    expect(result.savedFiles).toEqual(['/remote.ts']);
  });

  it('counts not-open and non-dirty docs as skipped in saveFiles', async () => {
    const clean = doc('/clean.ts', async () => true, false);
    const dirty = doc('/dirty.ts');
    mocks.textDocuments = [clean, dirty];
    const { service } = makeService();
    const result = await service.saveFiles([
      clean.uri,
      dirty.uri,
      { toString: () => 'file:///missing.ts' },
    ]);
    expect(result.savedCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.skippedFiles).toEqual([clean.uri.toString(), 'file:///missing.ts']);
    expect(clean.save).not.toHaveBeenCalled();
  });

  it('reports failures from saveFiles with error text', async () => {
    const bad = doc('/bad.ts', async () => {
      throw new Error('boom');
    });
    mocks.textDocuments = [bad];
    const { service } = makeService();
    const result = await service.saveFiles([bad.uri]);
    expect(result.failedFiles).toEqual([{ path: bad.uri.toString(), error: 'boom' }]);
  });

  it('progress increments total exactly 100 for 5+ files', async () => {
    mocks.textDocuments = Array.from({ length: 5 }, (_, i) => doc(`/f${i}.ts`));
    const increments: number[] = [];
    mocks.withProgress.mockImplementation(
      async (
        _opts: unknown,
        task: (p: { report: (v: { increment?: number }) => void }) => Promise<void>,
      ) =>
        task({
          report: (v) => {
            if (v.increment !== undefined) {
              increments.push(v.increment);
            }
          },
        }),
    );
    const { service } = makeService();
    const result = await service.saveAllFiles();
    expect(mocks.withProgress).toHaveBeenCalledTimes(1);
    expect(result.savedCount).toBe(5);
    expect(increments.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
  });

  it('does not use progress for fewer than 5 files', async () => {
    mocks.textDocuments = Array.from({ length: 4 }, (_, i) => doc(`/f${i}.ts`));
    const { service } = makeService();
    await service.saveAllFiles();
    expect(mocks.withProgress).not.toHaveBeenCalled();
  });
});
