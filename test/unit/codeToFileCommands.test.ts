import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vscode', async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return {
    ...actual,
    ViewColumn: { Beside: 2 },
    workspace: { ...(actual.workspace as object), openTextDocument: vi.fn() },
    window: { ...(actual.window as object), showTextDocument: vi.fn() },
  };
});

import * as vscode from 'vscode';

import { MoveFunctionToFileCommand } from '../../src/commands/MoveFunctionToFileCommand';
import { MoveLinesToFileCommand } from '../../src/commands/MoveLinesToFileCommand';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const a11y = {} as any;

function doc(text: string) {
  return { getText: () => text, lineCount: text.split('\n').length } as any;
}

describe('MoveLinesToFileCommand', () => {
  const configService = { getCopyCodeConfig: () => ({ insertionPoint: 'end' }) } as any;
  const fileDiscovery = {
    getCompatibleFiles: async () => [{ path: '/t/target.ts' }],
    validateTargetFile: async () => true,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup(applied: boolean) {
    const sourceEdit = vi.fn(async (cb: (b: any) => void) => {
      cb({ delete: vi.fn() });
      return true;
    });
    (vscode.window as any).activeTextEditor = {
      document: { fileName: '/t/source.ts', getText: () => 'code' },
      selection: { isEmpty: false },
      edit: sourceEdit,
    };
    (vscode.workspace.openTextDocument as any).mockResolvedValue(doc('x'));
    (vscode.window.showTextDocument as any).mockResolvedValue({
      edit: vi.fn(async () => applied),
    });
    return sourceEdit;
  }

  const make = () => new MoveLinesToFileCommand(fileDiscovery, configService, logger, a11y);

  it('does not delete source when the insert is not applied', async () => {
    const sourceEdit = setup(false);
    await make().execute();
    expect(sourceEdit).not.toHaveBeenCalled();
  });

  it('deletes source after a successful insert', async () => {
    const sourceEdit = setup(true);
    await make().execute();
    expect(sourceEdit).toHaveBeenCalledOnce();
  });
});

describe('MoveFunctionToFileCommand', () => {
  it('refuses a target equal to the source file and leaves the source untouched', async () => {
    vi.clearAllMocks();
    const codeAnalysis = {
      findFunctionAtPosition: async () => ({
        name: 'f',
        fullText: 'function f() {}',
        startLine: 1,
        endLine: 1,
      }),
    } as any;
    const fileDiscovery = {
      getCompatibleFiles: async () => [{ path: '/t/source.ts' }],
      validateTargetFile: async () => true,
    } as any;
    const sourceEdit = vi.fn(async () => true);
    (vscode.window as any).activeTextEditor = {
      document: { fileName: '/t/source.ts', uri: { fsPath: '/t/source.ts' } },
      selection: { active: {} },
      edit: sourceEdit,
    };
    const openDoc = vscode.workspace.openTextDocument as any;

    await new MoveFunctionToFileCommand(codeAnalysis, fileDiscovery, {} as any, logger, a11y).execute();

    expect(openDoc).not.toHaveBeenCalled();
    expect(sourceEdit).not.toHaveBeenCalled();
  });
});
