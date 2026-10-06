import * as path from 'path';

import * as vscode from 'vscode';

import {
  CopyFileContentsCommand,
  CopyFunctionToFileCommand,
  CopyLinesToFileCommand,
  DuplicateFileCommand,
  MoveFunctionToFileCommand,
  MoveLinesToFileCommand,
  RenameFileConventionCommand,
} from '../commands';
import { isSupportedFileType } from '../commands/codeInsertion';
import { getService } from '../di/container';
import type {
  IAccessibilityService,
  ICodeAnalysisService,
  IConfigurationService,
  IFileDiscoveryService,
  IFileNamingConventionService,
  IFileSaveService,
  ILogger,
  IProjectDetectionService,
  ITerminalService,
} from '../di/interfaces';
import { TYPES } from '../di/types';

/**
 * Context Menu Manager
 *
 * Manages context menu commands and their visibility based on project type
 * and cursor position. Uses lazy loading via DI container for an optimized bundle.
 *
 * @category Managers
 */
export class ContextMenuManager {
  private disposables: vscode.Disposable[] = [];

  // Lazy-loaded services via DI container
  private get logger(): ILogger {
    return getService<ILogger>(TYPES.Logger);
  }

  private get configService(): IConfigurationService {
    return getService<IConfigurationService>(TYPES.ConfigurationService);
  }

  private get accessibilityService(): IAccessibilityService {
    return getService<IAccessibilityService>(TYPES.AccessibilityService);
  }

  private get projectDetectionService(): IProjectDetectionService {
    return getService<IProjectDetectionService>(TYPES.ProjectDetectionService);
  }

  private get fileDiscoveryService(): IFileDiscoveryService {
    return getService<IFileDiscoveryService>(TYPES.FileDiscoveryService);
  }

  private get fileSaveService(): IFileSaveService {
    return getService<IFileSaveService>(TYPES.FileSaveService);
  }

  private get codeAnalysisService(): ICodeAnalysisService {
    return getService<ICodeAnalysisService>(TYPES.CodeAnalysisService);
  }

  private get terminalService(): ITerminalService {
    return getService<ITerminalService>(TYPES.TerminalService);
  }

  private get fileNamingConventionService(): IFileNamingConventionService {
    return getService<IFileNamingConventionService>(TYPES.FileNamingConventionService);
  }

  public async initialize(): Promise<void> {
    this.logger.info('Initializing ContextMenuManager');

    // Register commands
    this.registerCommands();

    // Update context variables for menu visibility
    await this.projectDetectionService.updateContextVariables();

    // Update function context on initialization
    await this.updateFunctionContext();

    // Listen for configuration changes
    this.disposables.push(
      this.configService.onConfigurationChanged(() => {
        void this.handleConfigurationChanged();
      }),
    );

    // Listen for workspace changes
    this.disposables.push(
      this.projectDetectionService.onWorkspaceChanged(() => {
        void this.handleWorkspaceChanged();
      }),
    );

    // Listen for file system changes
    this.disposables.push(this.fileDiscoveryService.onFileSystemChanged());

    // Listen for cursor position changes to update function context
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(async () => {
        await this.updateFunctionContext();
      }),
    );

    this.logger.info('ContextMenuManager initialized successfully');
  }

  private registerCommands(): void {
    this.disposables.push(
      vscode.commands.registerCommand('additionalContextMenus.copyFunction', () =>
        this.handleCopyFunction(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.copySelectionToFile', () =>
        this.handleCopyLinesToFile(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.moveSelectionToFile', () =>
        this.handleMoveLinesToFile(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.saveAll', () => this.handleSaveAll()),
      vscode.commands.registerCommand(
        'additionalContextMenus.enable',
        async () => await this.handleEnable(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.disable',
        async () => await this.handleDisable(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.openInTerminal', () =>
        this.handleOpenInTerminal(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.copyFunctionToFile', () =>
        this.handleCopyFunctionToFile(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.moveFunctionToFile', () =>
        this.handleMoveFunctionToFile(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.renameFileConvention',
        async (uri?: vscode.Uri) => await this.handleRenameFileConvention(uri),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.showOutputChannel',
        async () => await this.handleShowOutputChannel(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.debugContextVariables',
        async () => await this.handleDebugContextVariables(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.refreshContextVariables',
        async () => await this.handleRefreshContextVariables(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.checkKeybindingConflicts',
        async () => await this.handleCheckKeybindingConflicts(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.enableKeybindings',
        async () => await this.handleEnableKeybindings(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.disableKeybindings',
        async () => await this.handleDisableKeybindings(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.generateEnum', () =>
        this.handleGenerateEnum(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.generateEnvFile', () =>
        this.handleGenerateEnvFile(),
      ),
      vscode.commands.registerCommand('additionalContextMenus.generateCronTimer', () =>
        this.handleGenerateCronTimer(),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.copyFileContents',
        async (uri?: vscode.Uri) => await this.handleCopyFileContents(uri),
      ),
      vscode.commands.registerCommand(
        'additionalContextMenus.duplicateFile',
        async (uri?: vscode.Uri) => await this.handleDuplicateFile(uri),
      ),
    );

    this.logger.debug('Commands registered');
  }

  private async handleCopyFunction(): Promise<void> {
    this.logger.info('Copy Function command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        await this.announceError('Copy Function', 'No active editor found');
        return;
      }

      if (!this.isSupportedFileType(editor.document.fileName)) {
        vscode.window.showWarningMessage('Copy Function only supports .ts, .tsx, .js, .jsx files.');
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;

      // Find function at cursor position
      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        document,
        position,
      );

      if (!functionInfo) {
        const msg =
          'No function found at cursor position. Place the cursor inside a function, arrow function, method, or class declaration and try again.';
        vscode.window.showWarningMessage(msg);
        await this.announce(msg, 'minimal');
        return;
      }

      // Copy function to clipboard
      await vscode.env.clipboard.writeText(functionInfo.fullText);

      const message = `Copied ${functionInfo.type} '${functionInfo.name}' to clipboard`;
      vscode.window.showInformationMessage(message);
      await this.announceSuccess(
        'Copy Function',
        `Function '${functionInfo.name}' copied to clipboard`,
      );
      this.logger.info(`Function copied: ${functionInfo.name}`);
    } catch (error) {
      this.logger.error('Error in Copy Function command', error);
      vscode.window.showErrorMessage('Failed to copy function');
      await this.announceError('Copy Function', 'Failed to copy function');
    }
  }

  private async handleCopyLinesToFile(): Promise<void> {
    await new CopyLinesToFileCommand(
      this.fileDiscoveryService,
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleMoveLinesToFile(): Promise<void> {
    await new MoveLinesToFileCommand(
      this.fileDiscoveryService,
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleSaveAll(): Promise<void> {
    this.logger.info('Save All command triggered');

    try {
      const result = await this.fileSaveService.saveAllFiles();
      this.logger.info('Save All completed', result);
    } catch (error) {
      this.logger.error('Error in Save All command', error);
      vscode.window.showErrorMessage(`Failed to save files: ${(error as Error).message}`);
    }
  }

  private async handleEnable(): Promise<void> {
    await this.configService.updateConfiguration('enabled', true);
    vscode.window.showInformationMessage('Additional Context Menus enabled');
  }

  private async handleDisable(): Promise<void> {
    await this.configService.updateConfiguration('enabled', false);
    vscode.window.showInformationMessage(
      'Additional Context Menus disabled. To re-enable, run "Additional Context Menus: Enable" from the Command Palette.',
    );
  }

  private async handleOpenInTerminal(): Promise<void> {
    this.logger.info('Open in Terminal command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      const filePath = editor.document.fileName;
      await this.terminalService.openInTerminal(filePath);
    } catch (error) {
      this.logger.error('Error in Open in Terminal command', error);
      vscode.window.showErrorMessage('Failed to open terminal');
    }
  }

  private async handleCopyFunctionToFile(): Promise<void> {
    await new CopyFunctionToFileCommand(
      this.codeAnalysisService,
      this.fileDiscoveryService,
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleMoveFunctionToFile(): Promise<void> {
    await new MoveFunctionToFileCommand(
      this.codeAnalysisService,
      this.fileDiscoveryService,
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleConfigurationChanged(): Promise<void> {
    this.logger.debug('Configuration changed, updating context variables');
    await this.projectDetectionService.updateContextVariables();
  }

  private async updateFunctionContext(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    let isInFunction = false;

    if (editor) {
      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        editor.document,
        editor.selection.active,
      );
      isInFunction = !!functionInfo;
    }

    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.isInFunction',
      isInFunction,
    );
  }

  private async handleWorkspaceChanged(): Promise<void> {
    this.logger.debug('Workspace changed, clearing caches');
    this.fileDiscoveryService.clearCache();
    this.projectDetectionService.clearCache();
  }

  private isSupportedFileType(fileName: string): boolean {
    return isSupportedFileType(fileName);
  }

  private async handleRenameFileConvention(uri?: vscode.Uri): Promise<void> {
    await new RenameFileConventionCommand(
      uri,
      this.fileNamingConventionService,
      this.logger,
      this.accessibilityService,
      () => this.isAccessibilityEnabled(),
    ).execute();
  }

  private async handleCopyFileContents(uri?: vscode.Uri): Promise<void> {
    await new CopyFileContentsCommand(uri, this.logger, this.accessibilityService).execute();
  }

  private async handleDuplicateFile(uri?: vscode.Uri): Promise<void> {
    await new DuplicateFileCommand(uri, this.logger, this.accessibilityService).execute();
  }

  private async handleShowOutputChannel(): Promise<void> {
    this.logger.debug('Show Output Channel command triggered');
    try {
      // Create or get output channel
      const outputChannel = vscode.window.createOutputChannel('Additional Context Menus');
      outputChannel.show(true);
      outputChannel.appendLine('Extension output channel opened');
      this.logger.info('Output channel shown');
    } catch (error) {
      this.logger.error('Error showing output channel', error);
      vscode.window.showErrorMessage('Failed to show output channel');
    }
  }

  private async handleDebugContextVariables(): Promise<void> {
    this.logger.debug('Debug Context Variables command triggered');
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const projectType = await this.projectDetectionService.detectProjectType();
      const isEnabled = this.configService.isEnabled();

      const debugInfo = [
        'Extension State:',
        `  - Enabled: ${isEnabled}`,
        `  - Node Project: ${projectType.isNodeProject}`,
        `  - Workspace Folders: ${workspaceFolders?.length ?? 0}`,
        `  - Frameworks: ${projectType.frameworks.join(', ')}`,
        `  - TypeScript: ${projectType.hasTypeScript}`,
        `  - Support Level: ${projectType.supportLevel}`,
      ];

      const outputChannel = vscode.window.createOutputChannel('Additional Context Menus Debug');
      outputChannel.show();
      outputChannel.appendLine(debugInfo.join('\n'));

      this.logger.info('Debug context variables displayed');
    } catch (error) {
      this.logger.error('Error debugging context variables', error);
      vscode.window.showErrorMessage('Failed to debug context variables');
    }
  }

  private async handleRefreshContextVariables(): Promise<void> {
    this.logger.debug('Refresh Context Variables command triggered');
    try {
      await this.projectDetectionService.updateContextVariables();
      vscode.window.showInformationMessage('Context variables refreshed');
      this.logger.info('Context variables refreshed');
    } catch (error) {
      this.logger.error('Error refreshing context variables', error);
      vscode.window.showErrorMessage('Failed to refresh context variables');
    }
  }

  private async handleCheckKeybindingConflicts(): Promise<void> {
    this.logger.debug('Check Keybinding Conflicts command triggered');
    try {
      const config = this.configService.getConfiguration();
      const enabled = config.keybindings.enabled;
      const showInMenu = config.keybindings.showInMenu;

      let message = 'Keybinding Configuration:\n';
      message += `  - Enabled: ${enabled}\n`;
      message += `  - Show in Menu: ${showInMenu}\n`;

      if (!enabled) {
        message += '\nCustom keybindings are currently disabled.';
      } else {
        message += '\nCustom keybindings are enabled.';
      }

      await vscode.window.showInformationMessage(message, 'OK');
      this.logger.info('Keybinding conflicts checked');
    } catch (error) {
      this.logger.error('Error checking keybinding conflicts', error);
      vscode.window.showErrorMessage('Failed to check keybinding conflicts');
    }
  }

  private async handleEnableKeybindings(): Promise<void> {
    this.logger.debug('Enable Keybindings command triggered');
    try {
      const confirm = await vscode.window.showWarningMessage(
        'Enable custom keybindings for extension commands?',
        'Enable',
        'Cancel',
      );

      if (confirm === 'Enable') {
        await vscode.workspace
          .getConfiguration('additionalContextMenus')
          .update('enableKeybindings', true, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Custom keybindings enabled');
        this.logger.info('Custom keybindings enabled');
      }
    } catch (error) {
      this.logger.error('Error enabling keybindings', error);
      vscode.window.showErrorMessage('Failed to enable keybindings');
    }
  }

  private async handleDisableKeybindings(): Promise<void> {
    this.logger.debug('Disable Keybindings command triggered');
    try {
      await vscode.workspace
        .getConfiguration('additionalContextMenus')
        .update('enableKeybindings', false, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Custom keybindings disabled');
      this.logger.info('Custom keybindings disabled');
    } catch (error) {
      this.logger.error('Error disabling keybindings', error);
      vscode.window.showErrorMessage('Failed to disable keybindings');
    }
  }

  // Generator commands with lazy loading from separate bundle files
  private async handleGenerateEnum(): Promise<void> {
    this.logger.info('Generate Enum command triggered');
    try {
      // Load from lazy bundle at runtime
      const extensionPath = vscode.extensions.getExtension(
        'VijayGangatharan.additional-context-menus',
      )?.extensionPath;
      if (!extensionPath) {
        throw new Error('Extension path not found');
      }
      const lazyPath = path.join(extensionPath, 'dist', 'lazy', 'enumGeneratorService.js');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, security/detect-non-literal-require
      const { EnumGeneratorService } = require(lazyPath);
      const service = EnumGeneratorService.getInstance();
      await service.generateEnumFromSelection();
    } catch (error) {
      this.logger.error('Error generating enum', error);
      vscode.window.showErrorMessage(`Failed to generate enum: ${(error as Error).message}`);
    }
  }

  private async handleGenerateEnvFile(): Promise<void> {
    this.logger.info('Generate Env File command triggered');
    try {
      // Load from lazy bundle at runtime
      const extensionPath = vscode.extensions.getExtension(
        'VijayGangatharan.additional-context-menus',
      )?.extensionPath;
      if (!extensionPath) {
        throw new Error('Extension path not found');
      }
      const lazyPath = path.join(extensionPath, 'dist', 'lazy', 'envFileGeneratorService.js');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, security/detect-non-literal-require
      const { EnvFileGeneratorService } = require(lazyPath);
      const service = EnvFileGeneratorService.getInstance();
      await service.generateEnvFile();
    } catch (error) {
      this.logger.error('Error generating env file', error);
      vscode.window.showErrorMessage(`Failed to generate env file: ${(error as Error).message}`);
    }
  }

  private async handleGenerateCronTimer(): Promise<void> {
    this.logger.info('Generate Cron Timer command triggered');
    try {
      // Load from lazy bundle at runtime
      const extensionPath = vscode.extensions.getExtension(
        'VijayGangatharan.additional-context-menus',
      )?.extensionPath;
      if (!extensionPath) {
        throw new Error('Extension path not found');
      }
      const lazyPath = path.join(extensionPath, 'dist', 'lazy', 'cronJobTimerGeneratorService.js');
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, security/detect-non-literal-require
      const { CronJobTimerGeneratorService } = require(lazyPath);
      const service = CronJobTimerGeneratorService.getInstance();
      await service.generateCronExpression();
    } catch (error) {
      this.logger.error('Error generating cron timer', error);
      vscode.window.showErrorMessage(`Failed to generate cron timer: ${(error as Error).message}`);
    }
  }

  // Accessibility helper methods
  private async announce(
    message: string,
    verbosity: 'minimal' | 'normal' | 'verbose' = 'normal',
  ): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await this.accessibilityService.announce(message, verbosity);
    }
  }

  private async announceSuccess(operation: string, detail: string): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await this.accessibilityService.announceSuccess(operation, detail);
    }
  }

  private async announceError(operation: string, error: string): Promise<void> {
    if (this.isAccessibilityEnabled()) {
      await this.accessibilityService.announceError(operation, error);
    }
  }

  private isAccessibilityEnabled(): boolean {
    try {
      return this.configService.getConfiguration().accessibility.screenReaderMode === true;
    } catch {
      return false;
    }
  }

  public dispose(): void {
    this.logger.debug('Disposing ContextMenuManager');
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
