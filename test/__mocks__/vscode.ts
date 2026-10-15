/**
 * Minimal VS Code API mock for Vitest unit tests.
 * Only stubs what the infrastructure services actually use.
 * No real filesystem, network, or child_process access.
 */

export const workspace = {
  workspaceFolders: undefined as
    | { uri: { fsPath: string }; name: string; index: number }[]
    | undefined,
  findFiles: async () => [],
  onDidCreateFiles: () => ({ dispose: () => {} }),
  onDidDeleteFiles: () => ({ dispose: () => {} }),
  onDidRenameFiles: () => ({ dispose: () => {} }),
  getConfiguration: () => ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    update: async () => {},
    has: () => false,
    inspect: () => undefined,
  }),
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
  textDocuments: [] as unknown[],
  fs: {
    stat: async (_uri: unknown) => ({ type: 1, size: 0, ctime: 0, mtime: 0 }),
    readFile: async (_uri: unknown) => new Uint8Array(),
    copy: async () => {},
    isWritableFileSystem: (_scheme: string) => true as boolean | undefined,
  },
};

export const commands = {
  executeCommand: async () => undefined,
  registerCommand: () => ({ dispose: () => {} }),
};

export const window = {
  showQuickPick: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  showInformationMessage: async () => undefined,
  showInputBox: async () => undefined,
  withProgress: async <T>(
    _options: unknown,
    task: (progress: { report: (value: unknown) => void }) => Promise<T>,
  ): Promise<T> => task({ report: () => {} }),
  activeTextEditor: undefined as unknown,
  createOutputChannel: () => ({
    appendLine: () => {},
    append: () => {},
    show: () => {},
    dispose: () => {},
    clear: () => {},
  }),
  createTerminal: () => ({
    show: () => {},
    sendText: () => {},
    dispose: () => {},
  }),
  terminals: [] as unknown[],
};

export const languages = {
  createDiagnosticCollection: () => ({
    set: () => {},
    clear: () => {},
    delete: () => {},
    dispose: () => {},
  }),
};

export const accessibility = {
  announce: async () => {},
};

export const env = {
  clipboard: {
    readText: async () => '',
    writeText: async () => {},
  },
};

export const extensions = {
  getExtension: () => undefined,
  all: [] as unknown[],
};

interface MockUri {
  fsPath: string;
  scheme: string;
  path: string;
  with: (change: { path?: string; scheme?: string }) => MockUri;
  toString: () => string;
}

function makeUri(scheme: string, path: string): MockUri {
  return {
    fsPath: path,
    scheme,
    path,
    with: (change) => makeUri(change.scheme ?? scheme, change.path ?? path),
    toString: () => `${scheme}://${path}`,
  };
}

export const Uri = {
  file: (path: string) => makeUri('file', path),
  parse: (uri: string) => {
    const match = uri.match(/^([a-z][a-z0-9+.-]*):(\/\/)?(.*)$/i);
    const scheme = match?.[1] ?? 'file';
    const path = match?.[3] ?? uri;
    return makeUri(scheme, path);
  },
};

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'Unknown',
  ) {
    super(message);
  }
  static FileNotFound(message = 'FileNotFound') {
    return new FileSystemError(message, 'FileNotFound');
  }
  static FileExists(message = 'FileExists') {
    return new FileSystemError(message, 'FileExists');
  }
  static NoPermissions(message = 'NoPermissions') {
    return new FileSystemError(message, 'NoPermissions');
  }
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export class EventEmitter<T = void> {
  private listeners: ((e: T) => unknown)[] = [];
  event = (listener: (e: T) => unknown) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      },
    };
  };
  fire(data: T) {
    for (const l of this.listeners) {
      l(data);
    }
  }
  dispose() {
    this.listeners = [];
  }
}

export class RelativePattern {
  constructor(
    public readonly base: string | { uri: { fsPath: string } },
    public readonly pattern: string,
  ) {}
}

export class Position {
  constructor(
    public readonly line: number,
    public readonly character: number,
  ) {}
}

export class Range {
  constructor(
    public readonly start: Position,
    public readonly end: Position,
  ) {}
}

export class Selection extends Range {
  constructor(
    public readonly anchor: Position,
    public readonly active: Position,
  ) {
    super(anchor, active);
  }
  get isEmpty() {
    return this.anchor.line === this.active.line && this.anchor.character === this.active.character;
  }
}

export class TextEdit {
  constructor(
    public readonly range: Range,
    public readonly newText: string,
  ) {}
  static replace(range: Range, newText: string) {
    return new TextEdit(range, newText);
  }
  static insert(position: Position, newText: string) {
    return new TextEdit(new Range(position, position), newText);
  }
  static delete(range: Range) {
    return new TextEdit(range, '');
  }
}

export class WorkspaceEdit {
  private edits: { uri: unknown; edit: TextEdit }[] = [];
  replace(uri: unknown, range: Range, newText: string) {
    this.edits.push({ uri, edit: TextEdit.replace(range, newText) });
  }
  insert(uri: unknown, position: Position, newText: string) {
    this.edits.push({ uri, edit: TextEdit.insert(position, newText) });
  }
  delete(uri: unknown, range: Range) {
    this.edits.push({ uri, edit: TextEdit.delete(range) });
  }
  get size() {
    return this.edits.length;
  }
}

export class Diagnostic {
  public code?: string | number;
  public source?: string;
  constructor(
    public range: Range,
    public message: string,
    public severity?: DiagnosticSeverity,
  ) {}
}
