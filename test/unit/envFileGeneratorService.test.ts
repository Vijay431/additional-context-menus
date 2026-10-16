import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as vscode from 'vscode';

import { EnvFileGeneratorService } from '../../src/services/envFileGeneratorService';

describe('EnvFileGeneratorService.parseEnvVariables', () => {
  let svc: EnvFileGeneratorService;
  let parseEnvVariables: (content: string) => { name: string }[];

  beforeEach(() => {
    (EnvFileGeneratorService as any).instance = undefined;
    svc = EnvFileGeneratorService.getInstance();
    parseEnvVariables = (svc as any).parseEnvVariables.bind(svc);
  });

  it('should skip comments and empty lines when parsing', () => {
    const content = [
      '# This is a comment',
      '',
      'NODE_ENV=production',
      'PORT=3000',
      '# Another comment',
      'DB_HOST=localhost',
    ].join('\n');

    const variables = parseEnvVariables(content);
    expect(variables).toHaveLength(3);
    expect(variables.map((v) => v.name)).toEqual(['NODE_ENV', 'PORT', 'DB_HOST']);
  });

  it('should ignore lines without equals sign', () => {
    const content = 'GOOD_VAR=value\nINVALID_LINE\nANOTHER=ok';
    const variables = parseEnvVariables(content);
    expect(variables).toHaveLength(2);
    expect(variables[0].name).toBe('GOOD_VAR');
    expect(variables[1].name).toBe('ANOTHER');
  });
});

describe('EnvFileGeneratorService path traversal protection', () => {
  let svc: EnvFileGeneratorService;
  let root: string;

  beforeEach(async () => {
    (EnvFileGeneratorService as any).instance = undefined;
    svc = EnvFileGeneratorService.getInstance();
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'env-gen-'));
    await fs.writeFile(path.join(root, '.env.example'), 'A=1\nB=2\n');
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function getValidator(): Promise<(v: string) => string | undefined> {
    let captured: ((v: string) => string | undefined) | undefined;
    const spy = vi.spyOn(vscode.window, 'showInputBox').mockImplementation((async (opts: any) => {
      captured = opts.validateInput;
      return undefined;
    }) as any);
    await (svc as any).promptForEnvFileName();
    spy.mockRestore();
    return captured!;
  }

  it('rejects ../../.bashrc and sub/.env, accepts .env.local', async () => {
    const validate = await getValidator();
    expect(validate('../../.bashrc')).toBeDefined();
    expect(validate('.sub/.env')).toBeDefined();
    expect(validate('sub/.env')).toBeDefined();
    expect(validate('.\\evil')).toBeDefined();
    expect(validate('.')).toBeDefined();
    expect(validate('..')).toBeDefined();
    expect(validate('.env.local')).toBeUndefined();
  });

  it('refuses to write outside the workspace root', async () => {
    const gen = (svc as any).generateEnvFileFromExample.bind(svc);
    const example = path.join(root, '.env.example');
    await expect(gen(example, path.join(root, '..', '.bashrc-evil'), root)).rejects.toThrow(
      'Invalid file path',
    );
  });

  it('writes .env.local inside the root', async () => {
    const gen = (svc as any).generateEnvFileFromExample.bind(svc);
    const target = path.join(root, '.env.local');
    await expect(gen(path.join(root, '.env.example'), target, root)).resolves.toBe(true);
    expect(await fs.readFile(target, 'utf-8')).toBe('A=\nB=');
  });
});
