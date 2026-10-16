import { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  const ENV = 'ACM_TERMINAL_DIRECTORY';

  it('passes the directory via env, never interpolating it into the command (unix)', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({
      type: 'external',
      externalTerminalCommand: 'myterm --cwd {{directory}} --again {{directory}}',
    });
    const dir = '/tmp/a$&b$\'c"`x';

    await svc.openDirectoryInTerminal(dir);

    const [cmd, , opts] = spawnMock.mock.calls[0] as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(cmd).toBe(`myterm --cwd "$${ENV}" --again "$${ENV}"`);
    expect(opts.env[ENV]).toBe(dir);
  });

  it('adapts to user quoting context on Unix', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({
      type: 'external',
      externalTerminalCommand: `sh -c "cd {{directory}}" 'x {{directory}}' "y {{directory}}" \\"{{directory}}`,
    });

    await svc.openDirectoryInTerminal('/tmp/p');

    const [cmd] = spawnMock.mock.calls[0] as [string];
    expect(cmd).toBe(`sh -c "cd $${ENV}" 'x '"$${ENV}"'' "y $${ENV}" \\""$${ENV}"`);
  });

  it('appends a quoted env reference when no placeholder (unix)', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({ type: 'external', externalTerminalCommand: 'myterm' });

    await svc.openDirectoryInTerminal("/tmp/it's");

    const [cmd] = spawnMock.mock.calls[0] as [string];
    expect(cmd).toBe(`myterm "$${ENV}"`);
  });

  it('uses quoted %VAR% on Windows so cmd metacharacters stay inert', async () => {
    restorePlatform = setPlatform('win32');
    spawnMock.mockImplementation(() => fakeChild('spawn'));
    const svc = makeService({
      type: 'external',
      externalTerminalCommand: 'wt -d {{directory}} cmd /k "cd {{directory}}"',
    });
    const dir = 'C:\\a&b^c%PATH%)d\\';

    await svc.openDirectoryInTerminal(dir);

    const [cmd, , opts] = spawnMock.mock.calls[0] as [
      string,
      string[],
      { env: Record<string, string> },
    ];
    expect(cmd).toBe(`wt -d "%${ENV}%" cmd /k "cd %${ENV}%"`);
    expect(opts.env[ENV]).toBe('C:\\a&b^c%PATH%)d');
  });

  it.each([
    ['alacritty', ['--working-directory', '/d']],
    ['kitty', ['--directory', '/d']],
    ['konsole', ['--workdir', '/d']],
    ['xterm', []],
    ['gnome-terminal', ['--working-directory=/d']],
    ['xfce4-terminal', ['--working-directory=/d']],
    ['wezterm', ['start', '--cwd', '/d']],
  ])('builds correct linux args for %s', (term, expected) => {
    const svc = makeService({ type: 'system-default' }) as unknown as {
      buildLinuxTerminalArgs(t: string, d: string): string[];
    };
    expect(svc.buildLinuxTerminalArgs(term, '/d')).toEqual(expected);
  });

  it('falls back when launcher exits non-zero right after spawning', async () => {
    restorePlatform = setPlatform('linux');
    spawnMock.mockImplementation(() => {
      const child = fakeChild('spawn');
      setTimeout(() => child.emit('exit', 2, null), 10);
      return child;
    });
    const vscode = await import('vscode');
    const show = vi.fn();
    const createTerminal = vi
      .spyOn(vscode.window, 'createTerminal')
      .mockReturnValue({ show } as never);
    const svc = makeService({ type: 'external', externalTerminalCommand: 'badterm' });

    await svc.openDirectoryInTerminal('/tmp/proj');

    expect(createTerminal).toHaveBeenCalled();
    createTerminal.mockRestore();
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
