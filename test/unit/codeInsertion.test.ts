import { describe, expect, it } from 'vitest';

import { findSmartInsertionPoint } from '../../src/commands/codeInsertion';

function doc(text: string) {
  return { getText: () => text, lineCount: text.split('\n').length } as any;
}

describe('findSmartInsertionPoint', () => {
  const find = (text: string): number => findSmartInsertionPoint(doc(text)).line;

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
