/**
 * Code Analysis Service Interface
 *
 * Defines the contract for analyzing source code to extract
 * functions, imports, and other code patterns.
 *
 * @description
 * The code analysis service interface provides:
 * - Function detection at cursor position
 * - Import statement extraction
 * - Code pattern recognition
 * - Support for multiple language types
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/ICodeAnalysisService
 */

import type { vscode } from '../../types/vscode';

/**
 * Detected function information
 *
 * Contains metadata about a detected function or method.
 */
export interface FunctionInfo {
  /** Function/method name */
  name: string;
  /** Function type (function, arrow, method, class, component, hook) */
  type: 'function' | 'arrow' | 'method' | 'class' | 'component' | 'hook';
  /** Start line number (1-indexed) */
  startLine: number;
  /** End line number (1-indexed) */
  endLine: number;
  /** Full function text including signature and body */
  fullText: string;
  /** Whether the function is async */
  isAsync: boolean;
  /** Function parameters (if available) */
  parameters?: string[];
}

/**
 * Extracted import information
 *
 * Contains metadata about an import statement.
 */
export interface ImportInfo {
  /** Full import statement text */
  fullText: string;
  /** Import type (default, named, namespace, side-effect) */
  type: 'default' | 'named' | 'namespace' | 'side-effect';
  /** Module being imported from */
  module: string;
  /** Imported names (for named imports) */
  names?: string[];
}

/**
 * Code Analysis Service Interface
 *
 * All code analysis operations must implement this interface.
 * The service is responsible for parsing and analyzing
 * source code to extract useful information.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.CodeAnalysisService)
 *     private codeAnalysis: ICodeAnalysisService
 *   ) {}
 *
 *   async getCurrentFunction(document: vscode.TextDocument, position: vscode.Position) {
 *     const func = await this.codeAnalysis.findFunctionAtPosition(document, position);
 *     if (func) {
 *       return `Found function: ${func.name}`;
 *     }
 *     return 'No function found';
 *   }
 * }
 * ```
 */
export interface ICodeAnalysisService {
  /**
   * Find the function at a specific position in a document
   *
   * Analyzes the document to find the function or method that
   * contains the given cursor position.
   *
   * @param document - The text document to analyze
   * @param position - The cursor position to search from
   * @returns Function info if found, undefined otherwise
   */
  findFunctionAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<FunctionInfo | undefined>;

  /**
   * Extract import statements from code text
   *
   * Parses the given code to find all import statements.
   * Supports ES modules, CommonJS, and TypeScript patterns.
   *
   * @param code - The source code to parse
   * @param languageId - The language identifier (e.g., 'typescript', 'javascript')
   * @returns Array of extracted import information
   */
  extractImports(code: string, languageId: string): ImportInfo[];

  /**
   * Check if code contains a specific pattern
   *
   * Searches the code for a regex pattern.
   * Useful for detecting specific code constructs.
   *
   * @param code - The source code to search
   * @param pattern - Regular expression pattern to match
   * @returns true if pattern is found
   */
  containsPattern(code: string, pattern: RegExp): boolean;

  /**
   * Extract all functions from a document
   *
   * Returns all top-level functions, methods, and classes
   * found in the document.
   *
   * @param document - The text document to analyze
   * @returns Array of function information
   */
  extractAllFunctions(document: vscode.TextDocument): FunctionInfo[];

  /**
   * Get the language-specific patterns for analysis
   *
   * Returns regex patterns tailored to the specified language.
   *
   * @param languageId - The language identifier
   * @returns Object containing language-specific patterns
   */
  getLanguagePatterns(languageId: string): {
    functionPattern: RegExp;
    importPattern: RegExp;
    exportPattern: RegExp;
  };
}
