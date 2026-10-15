'use strict';
// Loads dist/extension.js with a stubbed `vscode` module and exercises activate/deactivate.
const Module = require('node:module');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const expected = pkg.contributes.commands.map((c) => c.command);
const registered = new Set();
const noop = () => {};
const disposable = () => ({ dispose: noop });

const channel = () => ({
  appendLine: noop,
  append: noop,
  show: noop,
  clear: noop,
  dispose: noop,
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  trace: noop,
  logLevel: 2,
  onDidChangeLogLevel: disposable,
});

class EventEmitter {
  constructor() {
    this.listeners = [];
    this.event = (l) => {
      this.listeners.push(l);
      return disposable();
    };
  }
  fire(e) {
    for (const l of this.listeners) l(e);
  }
  dispose() {
    this.listeners = [];
  }
}

const vscodeStub = {
  workspace: {
    getConfiguration: () => ({
      get: (_k, d) => d,
      update: async () => {},
      has: () => false,
      inspect: () => undefined,
    }),
    onDidChangeConfiguration: disposable,
  },
  window: {
    createOutputChannel: channel,
    showInformationMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showWarningMessage: async () => undefined,
  },
  commands: {
    registerCommand: (id) => {
      registered.add(id);
      return disposable();
    },
    executeCommand: async () => undefined,
  },
  ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
  ExtensionMode: { Production: 1, Development: 2, Test: 3 },
  EventEmitter,
};

const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'vscode') return vscodeStub;
  return originalLoad.call(this, request, ...rest);
};

async function main() {
  const ext = require(path.join(root, 'dist', 'extension.js'));
  const context = { subscriptions: [] };
  await ext.activate(context);
  ext.deactivate();
  const missing = expected.filter((id) => !registered.has(id));
  if (missing.length > 0) {
    throw new Error(`Commands not registered: ${missing.join(', ')}`);
  }
  console.log(`${process.version} OK`);
  // An extension may leave timers running after deactivate; do not wait for them.
  process.exit(0);
}

main().catch((err) => {
  console.error(`${process.version} FAIL`, err);
  process.exit(1);
});
