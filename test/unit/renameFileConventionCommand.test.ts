import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { RenameFileConventionCommand } from '../../src/commands/RenameFileConventionCommand';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const a11y = { announce: vi.fn(), announceError: vi.fn(), announceSuccess: vi.fn() } as any;

describe('RenameFileConventionCommand', () => {
  const uri = vscode.Uri.file('/ws/My File.ts') as any;
  let info: any;
  let warn: any;
  let pick: any;

  beforeEach(() => {
    vi.clearAllMocks();
    info = vi.spyOn(vscode.window, 'showInformationMessage');
    warn = vi.spyOn(vscode.window, 'showWarningMessage');
    pick = vi.spyOn(vscode.window, 'showQuickPick');
  });
  afterEach(() => vi.restoreAllMocks());

  it('renames with the picked convention', async () => {
    pick.mockResolvedValue({ label: 'kebab-case', value: 'kebab-case' });
    const svc = {
      renameByPath: vi.fn().mockResolvedValue({
        totalFiles: 2,
        renamedFiles: ['a'],
        skippedFiles: 1,
        failedFiles: [],
      }),
    } as any;
    const r = await new RenameFileConventionCommand(uri, svc, logger, a11y).execute();
    expect(svc.renameByPath).toHaveBeenCalledWith('/ws/My File.ts', 'kebab-case');
    expect(info).toHaveBeenCalledWith('Rename complete: 1 renamed, 1 already follow kebab-case.');
    expect(a11y.announce).toHaveBeenCalledWith(
      'Rename complete: 1 renamed, 1 already follow kebab-case',
      'normal',
    );
    expect(r.success).toBe(true);
  });

  it('does not announce when screen reader mode is off', async () => {
    pick.mockResolvedValue({ label: 'kebab-case', value: 'kebab-case' });
    const svc = {
      renameByPath: vi
        .fn()
        .mockResolvedValue({ totalFiles: 1, renamedFiles: ['a'], skippedFiles: 0, failedFiles: [] }),
    } as any;
    await new RenameFileConventionCommand(uri, svc, logger, a11y, () => false).execute();
    expect(info).toHaveBeenCalled();
    expect(a11y.announce).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is cancelled', async () => {
    pick.mockResolvedValue(undefined);
    const svc = { renameByPath: vi.fn() } as any;
    await new RenameFileConventionCommand(uri, svc, logger, a11y).execute();
    expect(svc.renameByPath).not.toHaveBeenCalled();
  });

  it('reports when no files are found', async () => {
    pick.mockResolvedValue({ value: 'camelCase' });
    const svc = {
      renameByPath: vi
        .fn()
        .mockResolvedValue({ totalFiles: 0, renamedFiles: [], skippedFiles: 0, failedFiles: [] }),
    } as any;
    await new RenameFileConventionCommand(uri, svc, logger, a11y).execute();
    expect(info).toHaveBeenCalledWith('No files found to rename.');
  });

  it('warns with a summary on partial failure and logs each failure', async () => {
    pick.mockResolvedValue({ value: 'PascalCase' });
    const svc = {
      renameByPath: vi.fn().mockResolvedValue({
        totalFiles: 3,
        renamedFiles: ['a'],
        skippedFiles: 1,
        failedFiles: [{ path: '/ws/x', error: 'boom' }],
      }),
    } as any;
    await new RenameFileConventionCommand(uri, svc, logger, a11y).execute();
    expect(warn).toHaveBeenCalledWith(
      'Rename complete: 1 renamed, 1 already follow PascalCase, 1 failed. Check Output Channel for details.',
    );
    expect(logger.error).toHaveBeenCalledWith('Failed to rename: /ws/x — boom');
  });
});
