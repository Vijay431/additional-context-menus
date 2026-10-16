import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { CopyFileContentsCommand } from '../../src/commands/CopyFileContentsCommand';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const a11y = {} as any;

describe('CopyFileContentsCommand', () => {
  const uri = vscode.Uri.file('/ws/a.txt') as any;
  let info: any;
  let warn: any;
  let err: any;
  let write: any;

  beforeEach(() => {
    info = vi.spyOn(vscode.window, 'showInformationMessage');
    warn = vi.spyOn(vscode.window, 'showWarningMessage');
    err = vi.spyOn(vscode.window, 'showErrorMessage');
    write = vi.spyOn(vscode.env.clipboard, 'writeText');
  });
  afterEach(() => vi.restoreAllMocks());

  it('rejects directories', async () => {
    vi.spyOn(vscode.workspace.fs, 'stat').mockResolvedValue({
      type: vscode.FileType.Directory,
      size: 0,
    } as any);
    const r = await new CopyFileContentsCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(err).toHaveBeenCalledWith('Copy File Contents only works on files, not folders.');
    expect(write).not.toHaveBeenCalled();
  });

  it('rejects files over 10 MB', async () => {
    vi.spyOn(vscode.workspace.fs, 'stat').mockResolvedValue({
      type: vscode.FileType.File,
      size: 10 * 1024 * 1024 + 1,
    } as any);
    const r = await new CopyFileContentsCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(warn).toHaveBeenCalledWith('File is too large to copy (10.0 MB). Maximum is 10 MB.');
    expect(write).not.toHaveBeenCalled();
  });

  it('copies contents to the clipboard', async () => {
    vi.spyOn(vscode.workspace.fs, 'stat').mockResolvedValue({
      type: vscode.FileType.File,
      size: 5,
    } as any);
    vi.spyOn(vscode.workspace.fs, 'readFile').mockResolvedValue(new TextEncoder().encode('hello'));
    const r = await new CopyFileContentsCommand(uri, logger, a11y).execute();
    expect(r.success).toBe(true);
    expect(write).toHaveBeenCalledWith('hello');
    expect(info).toHaveBeenCalledWith('Copied contents of a.txt to clipboard');
  });

  it('errors when nothing is selected', async () => {
    (vscode.window as any).activeTextEditor = undefined;
    const r = await new CopyFileContentsCommand(undefined, logger, a11y).execute();
    expect(r.success).toBe(false);
    expect(err).toHaveBeenCalled();
  });
});
