import * as path from 'node:path';

/**
 * Check whether `target` resolves to `root` itself or a location inside it.
 * Compares path segments (not string prefixes), so `/ws2` is not within `/ws`
 * and a directory named `..foo` is still within its parent.
 */
export function isPathWithin(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '') {
    return true;
  }
  if (path.isAbsolute(relative)) {
    return false; // different drive (Windows)
  }
  return relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

/**
 * True when `filePath` contains a literal `..` path segment (either separator).
 * Segment-based, so names like `my..proj` or `..foo` are not flagged. Check the
 * raw (unresolved) input: `path.resolve` collapses `..` and hides it.
 */
export function hasTraversalSegment(filePath: string): boolean {
  return filePath.split(/[\\/]/).includes('..');
}

const BLOCKED_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.ps1', '.vbs']);

/**
 * Basic sanity check on a file path: non-empty string and not a known
 * executable binary/script extension. Traversal containment is checked with
 * `isPathWithin` against a root, not here.
 */
export function isSafeFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  return !BLOCKED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}
