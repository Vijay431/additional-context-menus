import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vscode', async (orig) => {
  const actual = await orig<Record<string, any>>();
  return {
    ...actual,
    ConfigurationTarget: { Global: 1 },
    extensions: { getExtension: vi.fn() },
    workspace: { ...actual.workspace, getConfiguration: vi.fn(), workspaceFolders: [] },
    window: {
      ...actual.window,
      activeTextEditor: undefined,
      showInformationMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      createOutputChannel: vi.fn(),
    },
  };
});

import * as vscode from 'vscode';

import {
  CheckKeybindingConflictsCommand,
  CopyFunctionCommand,
  DisableCommand,
  DisableKeybindingsCommand,
  EnableCommand,
  EnableKeybindingsCommand,
  GENERATE_ENUM_SPEC,
  LazyGeneratorCommand,
  OpenInTerminalCommand,
  RefreshContextVariablesCommand,
  SaveAllCommand,
} from '../../src/commands';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const a11y = {
  announce: vi.fn(),
  announceSuccess: vi.fn(),
  announceError: vi.fn(),
} as any;
const win = vscode.window as any;

beforeEach(() => {
  vi.clearAllMocks();
  win.activeTextEditor = undefined;
});

describe('Enable / Disable', () => {
  it('updates configuration and notifies', async () => {
    const config = { updateConfiguration: vi.fn() } as any;
    await new EnableCommand(config, logger, a11y).execute();
    expect(config.updateConfiguration).toHaveBeenCalledWith('enabled', true);
    expect(win.showInformationMessage).toHaveBeenCalledWith('Additional Context Menus enabled');
    await new DisableCommand(config, logger, a11y).execute();
    expect(config.updateConfiguration).toHaveBeenLastCalledWith('enabled', false);
    expect(win.showInformationMessage.mock.calls[1][0]).toContain('disabled');
  });
});

describe('LazyGeneratorCommand', () => {
  it('errors when extension path is missing', async () => {
    (vscode.extensions.getExtension as any).mockReturnValue(undefined);
    const result = await new LazyGeneratorCommand(GENERATE_ENUM_SPEC, logger, a11y).execute();
    expect(result.success).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      '[GenerateEnum] Error generating enum',
      expect.any(Error),
    );
    expect(win.showErrorMessage).toHaveBeenCalledWith(
      'Failed to generate enum: Extension path not found',
    );
  });
});

describe('Keybinding commands', () => {
  it('check shows configuration', async () => {
    const config = {
      getConfiguration: () => ({ keybindings: { enabled: true, showInMenu: false } }),
    } as any;
    await new CheckKeybindingConflictsCommand(config, logger, a11y).execute();
    const [msg, ok] = win.showInformationMessage.mock.calls[0];
    expect(ok).toBe('OK');
    expect(msg).toContain('Enabled: true');
    expect(msg).toContain('Custom keybindings are enabled.');
  });

  it('enable updates only when confirmed', async () => {
    const update = vi.fn();
    (vscode.workspace.getConfiguration as any).mockReturnValue({ update });
    win.showWarningMessage.mockResolvedValueOnce('Cancel');
    await new EnableKeybindingsCommand(logger, a11y).execute();
    expect(update).not.toHaveBeenCalled();
    win.showWarningMessage.mockResolvedValueOnce('Enable');
    await new EnableKeybindingsCommand(logger, a11y).execute();
    expect(update).toHaveBeenCalledWith('enableKeybindings', true, 1);
  });

  it('disable updates and reports failures', async () => {
    const update = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    (vscode.workspace.getConfiguration as any).mockReturnValue({ update });
    await new DisableKeybindingsCommand(logger, a11y).execute();
    expect(win.showErrorMessage).toHaveBeenCalledWith('Failed to disable keybindings');
    await new DisableKeybindingsCommand(logger, a11y).execute();
    expect(update).toHaveBeenLastCalledWith('enableKeybindings', false, 1);
  });
});

describe('Refresh context variables', () => {
  it('refreshes and notifies', async () => {
    const pd = { updateContextVariables: vi.fn() } as any;
    await new RefreshContextVariablesCommand(pd, logger, a11y).execute();
    expect(pd.updateContextVariables).toHaveBeenCalled();
    expect(win.showInformationMessage).toHaveBeenCalledWith('Context variables refreshed');
  });
});

describe('SaveAllCommand', () => {
  it('delegates to the save service and reports errors', async () => {
    const svc = { saveAllFiles: vi.fn().mockResolvedValue({ savedCount: 2 }) } as any;
    const result = await new SaveAllCommand(svc, logger, a11y).execute();
    expect(logger.info).toHaveBeenCalledWith('[SaveAll] Save All completed', { savedCount: 2 });
    expect(result.message).toBe('Saved 2 files');
    svc.saveAllFiles.mockResolvedValue({ savedCount: 0 });
    expect((await new SaveAllCommand(svc, logger, a11y).execute()).message).toBe(
      'No unsaved files found',
    );
    svc.saveAllFiles.mockRejectedValue(new Error('boom'));
    await new SaveAllCommand(svc, logger, a11y).execute();
    expect(win.showErrorMessage).toHaveBeenCalledWith('Failed to save files: boom');
  });
});

describe('OpenInTerminalCommand', () => {
  it('errors without an editor, delegates with one', async () => {
    const svc = { openInTerminal: vi.fn() } as any;
    await new OpenInTerminalCommand(svc, logger, a11y).execute();
    expect(win.showErrorMessage).toHaveBeenCalledWith('Failed to open terminal');
    win.activeTextEditor = { document: { fileName: '/a/b.ts' } };
    await new OpenInTerminalCommand(svc, logger, a11y).execute();
    expect(svc.openInTerminal).toHaveBeenCalledWith('/a/b.ts');
    expect(win.showInformationMessage).toHaveBeenCalledWith('Terminal opened in b.ts');
  });
});

describe('CopyFunctionCommand', () => {
  it('gates announcements on the accessibility flag', async () => {
    const svc = { findFunctionAtPosition: vi.fn().mockResolvedValue(null) } as any;
    win.activeTextEditor = {
      document: { fileName: '/a/b.ts' },
      selection: { active: {} },
    };
    await new CopyFunctionCommand(svc, a11y, logger, () => false).execute();
    expect(a11y.announce).not.toHaveBeenCalled();
    await new CopyFunctionCommand(svc, a11y, logger, () => true).execute();
    expect(a11y.announce).toHaveBeenCalledWith(
      expect.stringContaining('No function found'),
      'minimal',
    );
  });

  it('warns on unsupported file types', async () => {
    win.activeTextEditor = { document: { fileName: '/a/b.py' }, selection: { active: {} } };
    await new CopyFunctionCommand({} as any, a11y, logger).execute();
    expect(win.showWarningMessage).toHaveBeenCalledWith(
      'Copy Function only supports .ts, .tsx, .js, .jsx files.',
    );
  });
});
