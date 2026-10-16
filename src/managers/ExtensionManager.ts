import * as vscode from 'vscode';

import { ConfigurationService } from '../services/configurationService';
import { ConfigValidator } from '../utils/configValidator';
import { Logger } from '../utils/logger';

import { ContextMenuManager } from './ContextMenuManager';

export class ExtensionManager {
  private logger: Logger;
  private configService: ConfigurationService;
  private contextMenuManager: ContextMenuManager;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.logger = Logger.getInstance();
    this.configService = ConfigurationService.getInstance();
    this.contextMenuManager = new ContextMenuManager();
  }

  public async activate(context: vscode.ExtensionContext): Promise<void> {
    this.logger.info('Activating Additional Context Menus extension');

    try {
      // Validate configuration values and substitute defaults for any invalid settings
      const rawConfig = this.configService.getConfiguration();
      ConfigValidator.validate(rawConfig, this.logger);

      // Always initialize components - commands should always be registered
      // VS Code's when clauses will handle visibility based on configuration
      await this.initializeComponents();

      // Warn if no Node.js project is detected in the workspace
      await this.checkForNodeProject();

      // Register disposables with VS Code context
      this.disposables.forEach((disposable) => {
        context.subscriptions.push(disposable);
      });

      // Add our own disposables
      context.subscriptions.push({ dispose: () => this.dispose() });

      // Set initial context variable for enabled state
      await this.updateEnabledContext();

      this.logger.info('Additional Context Menus extension activated successfully');

      // Show activation message (only in debug mode and when enabled)
      if (process.env['NODE_ENV'] === 'development' && this.configService.isEnabled()) {
        vscode.window.showInformationMessage('Additional Context Menus extension is now active');
      }
    } catch (error) {
      this.logger.error('Failed to activate extension', error);
      vscode.window.showErrorMessage('Failed to activate Additional Context Menus extension');
      throw error;
    }
  }

  private async checkForNodeProject(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const packageJsonFiles = await vscode.workspace.findFiles(
      '**/package.json',
      '**/node_modules/**',
      1,
    );

    if (packageJsonFiles.length === 0) {
      vscode.window.showInformationMessage(
        'Additional Context Menus: No package.json detected in this workspace. ' +
          'Node.js project detection is required for context menus to appear in TypeScript and JavaScript files.',
      );
      this.logger.info('No package.json found in workspace — context menus may not appear');
    }
  }

  private async initializeComponents(): Promise<void> {
    try {
      // Initialize context menu manager
      await this.contextMenuManager.initialize();

      // Listen for configuration changes to enable/disable extension
      this.disposables.push(
        this.configService.onConfigurationChanged(() => {
          void this.handleConfigurationChanged();
        }),
      );

      this.logger.debug('All components initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing components', error);
      throw error;
    }
  }

  private async handleConfigurationChanged(): Promise<void> {
    const isEnabled = this.configService.isEnabled();
    this.logger.debug(`Configuration changed - enabled: ${isEnabled}`);

    // Update VS Code context variable for when clauses
    await this.updateEnabledContext();

    if (!isEnabled) {
      this.logger.info('Extension disabled via configuration');
      // Context menus won't show due to when clauses, but commands remain registered
    } else {
      this.logger.info('Extension enabled via configuration');
      // Context menus will automatically show based on when clauses
    }
  }

  private async updateEnabledContext(): Promise<void> {
    const isEnabled = this.configService.isEnabled();

    await vscode.commands.executeCommand('setContext', 'additionalContextMenus.enabled', isEnabled);

    this.logger.debug(`Context variables updated: enabled = ${isEnabled}`);
  }

  public deactivate(): void {
    this.logger.info('Deactivating Additional Context Menus extension');
    this.dispose();
  }

  private dispose(): void {
    this.logger.debug('Disposing ExtensionManager');

    // Dispose context menu manager
    this.contextMenuManager.dispose();

    // Dispose all registered disposables
    this.disposables.forEach((disposable) => {
      try {
        disposable.dispose();
      } catch (error) {
        this.logger.warn('Error disposing resource', error);
      }
    });

    this.disposables = [];

    // Dispose logger last
    this.logger.dispose();
  }

  // Public API for testing or external access
  public getContextMenuManager(): ContextMenuManager {
    return this.contextMenuManager;
  }

  public getConfigurationService(): ConfigurationService {
    return this.configService;
  }

  public isActive(): boolean {
    return this.configService.isEnabled();
  }
}
