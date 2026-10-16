import * as vscode from 'vscode';

import { initializeContainer } from './di';
import { ExtensionManager } from './managers/ExtensionManager';

let extensionManager: ExtensionManager | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Initialize the DI container with all services
    await initializeContainer(context);

    extensionManager = new ExtensionManager();
    await extensionManager.activate(context);
  } catch (error) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    console.error('Failed to activate Additional Context Menus extension:', message);
    const channel = vscode.window.createOutputChannel(
      'Additional Context Menus - Activation Error',
    );
    channel.appendLine(message);
    channel.show(true);
    // Note: Channel intentionally not disposed to keep error visible for debugging
    vscode.window.showErrorMessage(
      `Additional Context Menus activation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function deactivate(): void {
  if (extensionManager) {
    extensionManager.deactivate();
    extensionManager = undefined;
  }
}
