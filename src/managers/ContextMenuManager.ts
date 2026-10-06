import * as vscode from 'vscode';

import {
  CheckKeybindingConflictsCommand,
  CopyFileContentsCommand,
  CopyFunctionCommand,
  CopyFunctionToFileCommand,
  CopyLinesToFileCommand,
  DebugContextVariablesCommand,
  DisableCommand,
  DisableKeybindingsCommand,
  DuplicateFileCommand,
  EnableCommand,
  EnableKeybindingsCommand,
  GENERATE_CRON_TIMER_SPEC,
  GENERATE_ENUM_SPEC,
  GENERATE_ENV_FILE_SPEC,
  LazyGeneratorCommand,
  MoveFunctionToFileCommand,
  MoveLinesToFileCommand,
  OpenInTerminalCommand,
  RefreshContextVariablesCommand,
  RenameFileConventionCommand,
  SaveAllCommand,
  ShowOutputChannelCommand,
} from '../commands';
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
    await new CopyFunctionCommand(
      this.codeAnalysisService,
      this.accessibilityService,
      this.logger,
      () => this.isAccessibilityEnabled(),
    ).execute();
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
    await new SaveAllCommand(
      this.fileSaveService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleEnable(): Promise<void> {
    await new EnableCommand(this.configService, this.logger, this.accessibilityService).execute();
  }

  private async handleDisable(): Promise<void> {
    await new DisableCommand(this.configService, this.logger, this.accessibilityService).execute();
  }

  private async handleOpenInTerminal(): Promise<void> {
    await new OpenInTerminalCommand(
      this.terminalService,
      this.logger,
      this.accessibilityService,
    ).execute();
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
    await new ShowOutputChannelCommand(this.logger, this.accessibilityService).execute();
  }

  private async handleDebugContextVariables(): Promise<void> {
    await new DebugContextVariablesCommand(
      this.projectDetectionService,
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleRefreshContextVariables(): Promise<void> {
    await new RefreshContextVariablesCommand(
      this.projectDetectionService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleCheckKeybindingConflicts(): Promise<void> {
    await new CheckKeybindingConflictsCommand(
      this.configService,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleEnableKeybindings(): Promise<void> {
    await new EnableKeybindingsCommand(this.logger, this.accessibilityService).execute();
  }

  private async handleDisableKeybindings(): Promise<void> {
    await new DisableKeybindingsCommand(this.logger, this.accessibilityService).execute();
  }

  // Generator commands with lazy loading from separate bundle files (see LazyGeneratorCommand)
  private async handleGenerateEnum(): Promise<void> {
    await new LazyGeneratorCommand(
      GENERATE_ENUM_SPEC,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleGenerateEnvFile(): Promise<void> {
    await new LazyGeneratorCommand(
      GENERATE_ENV_FILE_SPEC,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  private async handleGenerateCronTimer(): Promise<void> {
    await new LazyGeneratorCommand(
      GENERATE_CRON_TIMER_SPEC,
      this.logger,
      this.accessibilityService,
    ).execute();
  }

  // Accessibility helper methods
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
