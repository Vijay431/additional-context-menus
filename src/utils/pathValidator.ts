import * as path from 'path';

export function isSafeFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') {
    return false;
  }

  const normalizedPath = path.normalize(filePath);

  if (normalizedPath.includes('..') || normalizedPath.includes('node_modules')) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar'];

  return !dangerousExts.includes(ext);
}

export function isPathWithin(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '') {
    return true;
  }
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
