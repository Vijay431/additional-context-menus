import { EventEmitter } from 'events';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());
vi.mock('child_process', () => ({
  spawn: spawnMock,
  execFile: vi.fn(),
}));

import { TerminalService } from '../../src/services/terminalService';

interface FakeChild extends EventEmitter {
  unref: ReturnType<typeof vi.fn>;
}

function fakeChild(outcome: 'spawn' | 'error'): FakeChild {
  const child = new EventEmitter() as FakeChild;
  child.unref = vi.fn();
  setImmediate(() => {
    if (outcome === 'spawn') child.emit('spawn');
    else child.emit('error', new Error('ENOENT'));
  });
  return child;
}

function makeService(terminalCfg: Record<string, unknown>) {
  const logger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const configService = {
    getConfiguration: () => ({ terminal: { openBehavior: 'parent-directory', ...terminalCfg } }),
  };
  return TerminalService.create(logger as never, configService as never);
}

function setPlatform(value: NodeJS.Platform): () => void {
  const original = Object.getOwnPropertyDescriptor(process, 'platform')!;
  Object.defineProperty(process, 'platform', { value });
  return () => Object.defineProperty(process, 'platform', original);
}

describe('TerminalService external launchers', () => {
  let restorePlatform: (() => void) | undefined;

  beforeEach(() => {
    spawnMock.mockReset();
  });

  afterEach(() => {
    restorePlatform?.();
    restorePlatform = undefined;
  });

  it("does not corrupt directory names containing $& or $'", async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({
      type: 'external',
      externalTerminalCommand: 'myterm --cwd {{directory}} --again {{directory}}',
    });
    const dir = "/tmp/a$&b$'c";
    const quoted = `'${dir.replace(/'/g, "'\\''")}'`;

    await svc.openDirectoryInTerminal(dir);

    const [cmd] = spawnMock.mock.calls[0] as [string];
    expect(cmd).toBe(`myterm --cwd ${quoted} --again ${quoted}`);
  });

  it('escapes single quotes on Unix', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({ type: 'external', externalTerminalCommand: 'myterm' });

    await svc.openDirectoryInTerminal("/tmp/it's");

    const [cmd] = spawnMock.mock.calls[0] as [string];
    expect(cmd).toBe("myterm '/tmp/it'\\''s'");
  });

  it('spawns detached with ignored stdio and unrefs the child', async () => {
    restorePlatform = setPlatform('linux');
    const child = fakeChild('spawn');
    spawnMock.mockReturnValue(child);
    const svc = makeService({ type: 'external', externalTerminalCommand: 'myterm' });

    await svc.openDirectoryInTerminal('/tmp/proj');

    const [, args, opts] = spawnMock.mock.calls[0] as [string, string[], Record<string, unknown>];
    expect(args).toEqual([]);
    expect(opts).toMatchObject({
      detached: true,
      stdio: 'ignore',
      shell: true,
      cwd: '/tmp/proj',
    });
    expect(child.unref).toHaveBeenCalledTimes(1);
  });

  it('falls back to integrated terminal when spawn errors', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('error'));
    const vscode = await import('vscode');
    const show = vi.fn();
    const createTerminal = vi
      .spyOn(vscode.window, 'createTerminal')
      .mockReturnValue({ show } as never);
    const svc = makeService({ type: 'external', externalTerminalCommand: 'missing-term' });

    await svc.openDirectoryInTerminal('/tmp/proj');

    expect(createTerminal).toHaveBeenCalledWith(expect.objectContaining({ cwd: '/tmp/proj' }));
    expect(show).toHaveBeenCalled();
    createTerminal.mockRestore();
  });

  it('uses cmd start with cwd on Windows (no string-built cd)', async () => {
    restorePlatform = setPlatform('win32');
    const child = fakeChild('spawn');
    spawnMock.mockReturnValue(child);
    const svc = makeService({ type: 'system-default' });

    await svc.openDirectoryInTerminal('C:\\proj');

    const [cmd, args, opts] = spawnMock.mock.calls[0] as [
      string,
      string[],
      Record<string, unknown>,
    ];
    expect(cmd).toBe('cmd');
    expect(args).toEqual(['/c', 'start', 'cmd', '/k']);
    expect(opts).toMatchObject({ cwd: 'C:\\proj', detached: true, windowsHide: false });
    expect(child.unref).toHaveBeenCalled();
  });
});
