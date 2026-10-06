import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { DuplicateFileCommand } from '../../src/commands/DuplicateFileCommand';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const a11y = {} as any;

describe('DuplicateFileCommand', () => {
  const uri = vscode.Uri.file('/ws/a.txt') as any;
  let info: any;
  let warn: any;
  let err: any;
  let copy: any;
  let stat: any;

  /** The source always exists; `existing` says which other paths do. */
  function setup(existing: (p: string) => boolean) {
    stat.mockImplementation(async (u: any) => {
      if (u.path === '/ws/a.txt' || existing(u.path)) {
        return { type: vscode.FileType.File, size: 1 };
      }
      throw vscode.FileSystemError.FileNotFound();
    });
  }

  beforeEach(() => {
    info = vi.spyOn(vscode.window, 'showInformationMessage');
    warn = vi.spyOn(vscode.window, 'showWarningMessage');
    err = vi.spyOn(vscode.window, 'showErrorMessage');
    copy = vi.spyOn(vscode.workspace.fs, 'copy').mockResolvedValue(undefined);
    stat = vi.spyOn(vscode.workspace.fs, 'stat');
  });
  afterEach(() => vi.restoreAllMocks());

  it('uses the first free name', async () => {
    setup(() => false);
    const r = await new DuplicateFileCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(true);
    expect(copy.mock.calls[0][1].path).toBe('/ws/a-duplicate.txt');
    expect(copy.mock.calls[0][2]).toEqual({ overwrite: false });
    expect(info).toHaveBeenCalledWith('Duplicated a.txt → a-duplicate.txt');
  });

  it('increments -duplicate-N when names are taken', async () => {
    setup((p) => p === '/ws/a-duplicate.txt' || p === '/ws/a-duplicate-1.txt');
    await new DuplicateFileCommand(uri, logger, a11y).execute();
    expect(copy.mock.calls[0][1].path).toBe('/ws/a-duplicate-2.txt');
  });

  it('warns on FileExists race', async () => {
    setup(() => false);
    copy.mockRejectedValue(vscode.FileSystemError.FileExists());
    const r = await new DuplicateFileCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      'Could not create duplicate — a naming collision occurred. Please try again.',
    );
    expect(err).not.toHaveBeenCalled();
  });

  it('errors after 100 attempts', async () => {
    setup(() => true);
    const r = await new DuplicateFileCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(err).toHaveBeenCalledWith(
      'Could not find a free name after 100 attempts. Please rename or remove existing duplicates.',
    );
    expect(copy).not.toHaveBeenCalled();
  });

  it('rejects directories', async () => {
    stat.mockResolvedValue({ type: vscode.FileType.Directory, size: 0 });
    const r = await new DuplicateFileCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(err).toHaveBeenCalledWith('Duplicate File only works on files, not folders.');
  });
});
