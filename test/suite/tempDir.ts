import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Registers Mocha hooks that create a private directory (mkdtemp, mode 0700) for the
 * enclosing suite and remove it recursively afterwards. Returns a getter for its path.
 */
export function useTempDir(): () => string {
  let dir: string | undefined;

  suiteSetup(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'acm-test-'));
  });

  suiteTeardown(async () => {
    if (dir) {
      await fs.rm(dir, { recursive: true, force: true });
      dir = undefined;
    }
  });

  return () => {
    if (!dir) {
      throw new Error('Temp dir is only available after suiteSetup has run');
    }
    return dir;
  };
}
