/**
 * VS Code Type Re-exports
 *
 * Re-exports VS Code types for use in interfaces and services.
 * This allows for easier mocking in tests and reduces direct
 * dependencies on the vscode module.
 *
 * @category Types
 * @module types/vscode
 */

import * as VSCode from 'vscode';

// Re-export all VS Code types
export { VSCode as vscode };
