import { parse } from '@babel/parser';
import type { Node, File } from '@babel/types';
import * as vscode from 'vscode';

import type {
  ICodeAnalysisService,
  FunctionInfo,
  ImportInfo,
} from '../di/interfaces/ICodeAnalysisService';
import type { ILogger } from '../di/interfaces/ILogger';
import { Logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// ESTree / Babel AST node type aliases used in this file
// ---------------------------------------------------------------------------

type BabelNode = Node;

/** Node types we treat as "function-like" */
type FunctionLikeType =
  | 'FunctionDeclaration'
  | 'FunctionExpression'
  | 'ArrowFunctionExpression'
  | 'ClassMethod'
  | 'ObjectMethod';

// ---------------------------------------------------------------------------
// Lightweight private helpers (replace the TypeScript compiler API surface)
// ---------------------------------------------------------------------------

/**
 * Parse TS/TSX/JS/JSX source into a Babel AST File node.
 * Errors are intentionally allowed to propagate so callers can catch them.
 */
function parseSource(code: string): File {
  return parse(code, {
    sourceType: 'module',
    strictMode: false,
    plugins: ['typescript', 'jsx', 'decorators', 'classProperties'],
    errorRecovery: true,
  });
}

/**
 * Walk every child of `node` recursively, building a WeakMap of child→parent.
 * The visitor callback receives each node plus its parent (or null for root).
 */
function walkWithParents(
  root: BabelNode,
  visitor: (node: BabelNode, parent: BabelNode | null) => void,
): WeakMap<BabelNode, BabelNode | null> {
  const parents = new WeakMap<BabelNode, BabelNode | null>();

  function walk(node: BabelNode, parent: BabelNode | null): void {
    if (node === null || typeof node !== 'object') return;
    parents.set(node, parent);
    visitor(node, parent);

    for (const key of Object.keys(node) as (keyof typeof node)[]) {
      if (key === 'type' || key === 'loc' || key === 'start' || key === 'end') continue;
      const child = node[key] as unknown;
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            walk(item as BabelNode, node);
          }
        }
      } else if (child && typeof child === 'object' && 'type' in child) {
        walk(child as BabelNode, node);
      }
    }
  }

  walk(root, null);
  return parents;
}

/**
 * Convert a byte offset in `source` to a 0-based { line, column } pair.
 * Replaces `sourceFile.getLineAndCharacterOfPosition()`.
 */
function offsetToLineCol(source: string, offset: number): { line: number; column: number } {
  let line = 0;
  let lastNewline = -1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: offset - lastNewline - 1 };
}

/** Returns true if the node type is one of the function-like kinds. */
function isFunctionLike(node: BabelNode): node is BabelNode & { type: FunctionLikeType } {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'ClassMethod' ||
    node.type === 'ObjectMethod'
  );
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CodeAnalysisService implements ICodeAnalysisService {
  private static instance: CodeAnalysisService | undefined = undefined;
  private logger: ILogger;

  private constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): CodeAnalysisService {
    CodeAnalysisService.instance ??= new CodeAnalysisService(Logger.getInstance());
    return CodeAnalysisService.instance;
  }

  /**
   * Create a new CodeAnalysisService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @returns A new CodeAnalysisService instance
   */
  public static create(logger: ILogger): CodeAnalysisService {
    return new CodeAnalysisService(logger);
  }

  public async findFunctionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<FunctionInfo | undefined> {
    try {
      const text = document.getText();
      const offset = document.offsetAt(position);
      const ast = parseSource(text);

      let bestNode: BabelNode | null = null;
      let bestParent: BabelNode | null = null;
      let bestRange = Infinity;

      // First pass: build the full parent map
      const parents = walkWithParents(ast.program, () => {});

      // Second pass: find the innermost function at offset
      walkWithParents(ast.program, (node, parent) => {
        if (!isFunctionLike(node)) return;
        const start = node.start ?? 0;
        const end = node.end ?? 0;
        if (offset >= start && offset <= end) {
          const range = end - start;
          // prefer innermost (smallest range)
          if (range < bestRange) {
            bestRange = range;
            bestNode = node;
            bestParent = parent;
          }
        }
      });

      if (bestNode) {
        const info = this.extractFunctionInfo(bestNode, bestParent, parents, text);
        this.logger.debug('Function found at position', {
          name: info.name,
          type: info.type,
          line: info.startLine,
        });
        return info;
      }

      return undefined;
    } catch (error) {
      this.logger.error('Error finding function at position', error);
      return undefined;
    }
  }

  private extractFunctionInfo(
    node: BabelNode,
    parent: BabelNode | null,
    parents: WeakMap<BabelNode, BabelNode | null>,
    source: string,
  ): FunctionInfo {
    const name = this.getFunctionName(node, parent, source);
    const type = this.getFunctionType(node, name);

    // For arrow/function expressions assigned to a variable, capture the full
    // `const foo = () => {}` VariableDeclaration statement.
    let textNode: BabelNode = node;
    if (
      (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') &&
      parent?.type === 'VariableDeclarator'
    ) {
      const grandParent = parents.get(parent) ?? null;
      if (grandParent?.type === 'VariableDeclaration') {
        textNode = grandParent;
      }
    }

    // If the textNode is wrapped in an export declaration, capture the export declaration
    // statement to preserve the export keyword.
    const textNodeParent = parents.get(textNode) ?? null;
    if (
      textNodeParent?.type === 'ExportNamedDeclaration' ||
      textNodeParent?.type === 'ExportDefaultDeclaration'
    ) {
      textNode = textNodeParent;
    }

    const startOffset = textNode.start ?? 0;
    const endOffset = textNode.end ?? 0;
    const startPos = offsetToLineCol(source, startOffset);
    const endPos = offsetToLineCol(source, endOffset);

    const isAsync =
      'async' in node && typeof (node as unknown as Record<string, unknown>)['async'] === 'boolean'
        ? (node as unknown as Record<string, unknown>)['async'] === true
        : false;

    return {
      name,
      type,
      startLine: startPos.line + 1,
      endLine: endPos.line + 1,
      fullText: source.slice(startOffset, endOffset).trimStart(),
      isAsync,
    };
  }

  private getFunctionName(node: BabelNode, parent: BabelNode | null, source: string): string {
    // `function foo() {}`
    if (node.type === 'FunctionDeclaration') {
      const id = (node as unknown as Record<string, unknown>)['id'] as BabelNode | null;
      if (id && 'start' in id && 'end' in id) {
        return source.slice(id.start ?? 0, id.end ?? 0);
      }
    }

    // `const foo = () => {}` or `const foo = function() {}`
    if (
      (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') &&
      parent?.type === 'VariableDeclarator'
    ) {
      const idNode = (parent as unknown as Record<string, unknown>)['id'] as BabelNode | null;
      if (idNode && 'start' in idNode && 'end' in idNode) {
        return source.slice(idNode.start ?? 0, idNode.end ?? 0);
      }
    }

    // `class Foo { bar() {} }` — ClassMethod
    if (node.type === 'ClassMethod' || node.type === 'ObjectMethod') {
      const key = (node as unknown as Record<string, unknown>)['key'] as BabelNode | null;
      if (key && 'start' in key && 'end' in key) {
        return source.slice(key.start ?? 0, key.end ?? 0);
      }
    }

    // named function expression: `const x = function namedFn() {}`
    if (node.type === 'FunctionExpression') {
      const id = (node as unknown as Record<string, unknown>)['id'] as BabelNode | null;
      if (id && 'start' in id && 'end' in id) {
        return source.slice(id.start ?? 0, id.end ?? 0);
      }
    }

    return 'anonymous';
  }

  private getFunctionType(node: BabelNode, name: string): FunctionInfo['type'] {
    if (name.length === 0 || name === 'anonymous') return 'function';

    // React hook detection
    if (name.startsWith('use')) return 'hook';

    // React component detection (PascalCase)
    const firstChar = name[0]!;
    if (firstChar === firstChar.toUpperCase() && firstChar >= 'A' && firstChar <= 'Z') {
      return 'component';
    }

    if (node.type === 'ArrowFunctionExpression') return 'arrow';
    if (node.type === 'ClassMethod' || node.type === 'ObjectMethod') return 'method';

    return 'function';
  }

  public extractImports(code: string, _languageId: string): ImportInfo[] {
    const imports: ImportInfo[] = [];

    try {
      const ast = parseSource(code);

      for (const statement of ast.program.body) {
        if (statement.type !== 'ImportDeclaration') continue;

        const startOffset = statement.start ?? 0;
        const endOffset = statement.end ?? 0;
        const fullText = code.slice(startOffset, endOffset).trim();

        const moduleSource = (statement as unknown as { source: { value: string } }).source.value;

        const specifiers = (statement as unknown as { specifiers: { type: string }[] }).specifiers;

        let type: ImportInfo['type'] = 'side-effect';
        const names: string[] = [];

        if (specifiers.length > 0) {
          if (specifiers.some((s) => s.type === 'ImportNamespaceSpecifier')) {
            type = 'namespace';
            for (const s of specifiers) {
              if (s.type === 'ImportNamespaceSpecifier') {
                const local = (s as unknown as { local: { start: number; end: number } }).local;
                names.push(code.slice(local.start, local.end));
              }
            }
          } else if (specifiers.some((s) => s.type === 'ImportDefaultSpecifier')) {
            type = 'default';
          } else {
            type = 'named';
            for (const s of specifiers) {
              if (s.type === 'ImportSpecifier') {
                const imported = (s as unknown as { imported: { start: number; end: number } })
                  .imported;
                names.push(code.slice(imported.start, imported.end));
              }
            }
          }
        }

        const importInfo: ImportInfo = { fullText, type, module: moduleSource };
        if (names.length > 0) importInfo.names = names;
        imports.push(importInfo);
      }
    } catch (error) {
      this.logger.warn('Error extracting imports', error);
    }

    return imports;
  }

  public containsPattern(code: string, pattern: RegExp): boolean {
    return pattern.test(code);
  }

  public extractAllFunctions(document: vscode.TextDocument): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const text = document.getText();

    try {
      const ast = parseSource(text);

      // First pass: build the full parent map
      const parents = walkWithParents(ast.program, () => {});

      // Second pass: collect functions (parent map is now complete)
      const handledDeclarators = new WeakSet<BabelNode>();
      walkWithParents(ast.program, (node, parent) => {
        if (!isFunctionLike(node)) return;

        // Arrow/function expression inside a VariableDeclarator — capture once at
        // the VariableDeclaration level to avoid emitting both the declarator and
        // the function node separately.
        if (
          (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') &&
          parent?.type === 'VariableDeclarator'
        ) {
          if (handledDeclarators.has(parent)) return;
          handledDeclarators.add(parent);
        }

        functions.push(this.extractFunctionInfo(node, parent, parents, text));
      });
    } catch (error) {
      this.logger.error('Error extracting all functions', error);
    }

    return functions;
  }

  public getLanguagePatterns(_languageId: string): {
    functionPattern: RegExp;
    importPattern: RegExp;
    exportPattern: RegExp;
  } {
    return {
      functionPattern: /function\s+\w+|=>\s*{|class\s+\w+/g,
      importPattern: /import\s+.*from\s+['"](.+)['"]/g,
      exportPattern: /\bexport\b\s*/,
    };
  }
}
