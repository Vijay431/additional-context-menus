import { beforeEach, describe, expect, it, vi } from 'vitest';

const services = vi.hoisted(() => ({ map: new Map<unknown, unknown>() }));

vi.mock('vscode', async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return {
    ...actual,
    ViewColumn: { Beside: 2 },
    workspace: { ...(actual.workspace as object), openTextDocument: vi.fn() },
    window: { ...(actual.window as object), showTextDocument: vi.fn() },
  };
});
vi.mock('../../src/di/container', () => ({
  getService: (token: unknown) => services.map.get(token),
}));

import * as vscode from 'vscode';

import { TYPES } from '../../src/di/types';
import { ContextMenuManager } from '../../src/managers/ContextMenuManager';

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };

function doc(text: string) {
  return { getText: () => text, lineCount: text.split('\n').length } as any;
}

describe('ContextMenuManager.findSmartInsertionPoint', () => {
  const manager = new ContextMenuManager() as any;
  const find = (text: string): number => manager.findSmartInsertionPoint(doc(text)).line;

  it('inserts after the closing line of a multi-line import', () => {
    const text = ['import {', '  a,', '  b,', "} from 'x';", 'const z = 1;'].join('\n');
    expect(find(text)).toBe(4);
  });

  it('handles single-line and side-effect imports', () => {
    expect(find("import a from 'a';\nimport 'side-effect';\nconst z = 1;")).toBe(2);
  });

  it('ignores import-like text in block comments and template literals', () => {
    const text = [
      "import a from 'a';",
      '/*',
      "import fake from 'fake';",
      '*/',
      'const t = `',
      "import tpl from 'tpl';",
      '`;',
    ].join('\n');
    expect(find(text)).toBe(1);
  });

  it('falls back to first export when no imports', () => {
    expect(find('const a = 1;\nexport const b = 2;')).toBe(1);
  });
});

describe('ContextMenuManager move lines to file', () => {
  beforeEach(() => {
    services.map.clear();
    services.map.set(TYPES.Logger, logger);
    services.map.set(TYPES.ConfigurationService, {
      getCopyCodeConfig: () => ({ insertionPoint: 'end' }),
    });
    services.map.set(TYPES.FileDiscoveryService, {
      getCompatibleFiles: async () => [{ path: '/t/target.ts' }],
      validateTargetFile: async () => true,
    });
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

  it('does not delete source when the insert is not applied', async () => {
    const sourceEdit = setup(false);
    await (new ContextMenuManager() as any).handleMoveLinesToFile();
    expect(sourceEdit).not.toHaveBeenCalled();
  });

  it('deletes source after a successful insert', async () => {
    const sourceEdit = setup(true);
    await (new ContextMenuManager() as any).handleMoveLinesToFile();
    expect(sourceEdit).toHaveBeenCalledOnce();
  });
});

describe('ContextMenuManager move function to file', () => {
  it('refuses a target equal to the source file and leaves the source untouched', async () => {
    services.map.clear();
    services.map.set(TYPES.Logger, logger);
    services.map.set(TYPES.CodeAnalysisService, {
      findFunctionAtPosition: async () => ({
        name: 'f',
        fullText: 'function f() {}',
        startLine: 1,
        endLine: 1,
      }),
    });
    services.map.set(TYPES.FileDiscoveryService, {
      getCompatibleFiles: async () => [{ path: '/t/source.ts' }],
      validateTargetFile: async () => true,
    });
    vi.clearAllMocks();
    const sourceEdit = vi.fn(async () => true);
    (vscode.window as any).activeTextEditor = {
      document: { fileName: '/t/source.ts', uri: { fsPath: '/t/source.ts' } },
      selection: { active: {} },
      edit: sourceEdit,
    };
    const openDoc = vscode.workspace.openTextDocument as any;

    await (new ContextMenuManager() as any).handleMoveFunctionToFile();

    expect(openDoc).not.toHaveBeenCalled();
    expect(sourceEdit).not.toHaveBeenCalled();
  });
});
