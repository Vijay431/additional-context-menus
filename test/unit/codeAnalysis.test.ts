import { describe, expect, it } from 'vitest';
import { CodeAnalysisService } from '../../src/services/codeAnalysisService';

function makeDoc(content: string) {
  return {
    getText: () => content,
    fileName: 'test.ts',
    offsetAt: (pos: { line: number; character: number }) => {
      const lines = content.split('\n');
      let offset = 0;
      for (let i = 0; i < pos.line; i++) {
        offset += (lines[i]?.length ?? 0) + 1;
      }
      return offset + pos.character;
    },
  };
}

function pos(line: number, character = 5) {
  return { line, character };
}

const service = CodeAnalysisService.getInstance();

describe('CodeAnalysisService.findFunctionAtPosition', () => {
  it('should detect a regular function', async () => {
    const code = `function add(a: number, b: number): number {\n  return a + b;\n}`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(1) as any);
    expect(result?.name).toBe('add');
    expect(result?.type).toBe('function');
  });

  it('should detect an arrow function assigned to a variable', async () => {
    const code = `const multiply = (a: number, b: number) => a * b;`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(0, 20) as any);
    expect(result?.name).toBe('multiply');
    expect(result?.type).toBe('arrow');
  });

  it('should detect an async function', async () => {
    const code = `async function fetchData(url: string): Promise<string> {\n  return url;\n}`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(1) as any);
    expect(result?.name).toBe('fetchData');
    expect(result?.isAsync).toBe(true);
  });

  it('should detect a React component by PascalCase name', async () => {
    const code = `const MyComponent = () => {\n  return null;\n};`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(1) as any);
    expect(result?.name).toBe('MyComponent');
    expect(result?.type).toBe('component');
  });

  it('should detect a React hook by use prefix', async () => {
    const code = `const useCounter = (initial: number) => {\n  return initial;\n};`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(1) as any);
    expect(result?.name).toBe('useCounter');
    expect(result?.type).toBe('hook');
  });

  it('should detect the innermost function when cursor is in a nested function', async () => {
    const code = `function outer() {\n  function inner() {\n    return 42;\n  }\n  return inner();\n}`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(2) as any);
    expect(result?.name).toBe('inner');
  });

  it('should return undefined when cursor is outside any function', async () => {
    const code = `const x = 1;\nconst y = 2;`;
    const result = await service.findFunctionAtPosition(makeDoc(code) as any, pos(0) as any);
    expect(result).toBeUndefined();
  });
});

describe('CodeAnalysisService.extractImports', () => {
  it('should extract named imports', () => {
    const code = `import { useState, useEffect } from 'react';`;
    const imports = service.extractImports(code, 'typescript');
    expect(imports).toHaveLength(1);
    expect(imports[0]?.type).toBe('named');
    expect(imports[0]?.module).toBe('react');
    expect(imports[0]?.names).toContain('useState');
  });

  it('should extract a default import', () => {
    const code = `import React from 'react';`;
    const imports = service.extractImports(code, 'typescript');
    expect(imports[0]?.type).toBe('default');
  });

  it('should extract a namespace import', () => {
    const code = `import * as path from 'path';`;
    const imports = service.extractImports(code, 'typescript');
    expect(imports[0]?.type).toBe('namespace');
    expect(imports[0]?.module).toBe('path');
  });

  it('should extract a side-effect import', () => {
    const code = `import './styles.css';`;
    const imports = service.extractImports(code, 'typescript');
    expect(imports[0]?.type).toBe('side-effect');
  });

  it('should return an empty array for code with no imports', () => {
    expect(service.extractImports('const x = 1;', 'typescript')).toHaveLength(0);
  });
});

describe('CodeAnalysisService.extractAllFunctions', () => {
  it('should extract all top-level functions from a document', () => {
    const code = [
      `function add(a: number, b: number) { return a + b; }`,
      `const multiply = (a: number, b: number) => a * b;`,
      `async function fetchData() { return ''; }`,
    ].join('\n');
    const fns = service.extractAllFunctions(makeDoc(code) as any);
    const names = fns.map((f) => f.name);
    expect(names).toContain('add');
    expect(names).toContain('multiply');
    expect(names).toContain('fetchData');
  });
});

describe('CodeAnalysisService.containsPattern', () => {
  it('should return true when the pattern matches', () => {
    expect(service.containsPattern('const x = 1;', /const/)).toBe(true);
  });

  it('should return false when the pattern does not match', () => {
    expect(service.containsPattern('const x = 1;', /let/)).toBe(false);
  });
});
