import * as path from 'path';

import * as vscode from 'vscode';

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
import { getAccessibleQuickPickItem } from '../utils/accessibilityHelper';

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
    this.logger.info('Copy Lines to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      if (!this.isSupportedFileType(editor.document.fileName)) {
        vscode.window.showWarningMessage(
          'Copy Selection to File only supports .ts, .tsx, .js, .jsx files.',
        );
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('No code selected');
        return;
      }

      const selectedText = editor.document.getText(selection);
      const sourceExtension = this.getFileExtension(editor.document.fileName);

      // Get compatible files
      const compatibleFiles = await this.fileDiscoveryService.getCompatibleFiles(sourceExtension);

      // Auto-select if only one compatible file, otherwise show file selector
      let targetFilePath: string | undefined;
      if (compatibleFiles.length === 1 && compatibleFiles[0]) {
        // Auto-select the only compatible file (for test scenarios)
        targetFilePath = compatibleFiles[0].path;
      } else {
        targetFilePath = await this.fileDiscoveryService.showFileSelector(compatibleFiles);
      }

      if (!targetFilePath) {
        return; // User cancelled
      }

      // Validate target file
      const isValid = await this.fileDiscoveryService.validateTargetFile(targetFilePath);
      if (!isValid) {
        vscode.window.showErrorMessage('Target file is not accessible or writable');
        return;
      }

      // Copy code to target file
      await this.copyCodeToTargetFile(selectedText, targetFilePath);

      const fileName = this.getFileName(targetFilePath);
      vscode.window.showInformationMessage(`Lines copied to ${fileName}`);
      this.logger.info(`Lines copied to: ${targetFilePath}`);
    } catch (error) {
      this.logger.error('Error in Copy Lines to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to copy lines to file. Check file permissions and try again.`;
      vscode.window.showErrorMessage(msg);
    }
  }

  private async handleMoveLinesToFile(): Promise<void> {
    this.logger.info('Move Lines to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      if (!this.isSupportedFileType(editor.document.fileName)) {
        vscode.window.showWarningMessage(
          'Move Selection to File only supports .ts, .tsx, .js, .jsx files.',
        );
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('No code selected');
        return;
      }

      const selectedText = editor.document.getText(selection);
      const sourceExtension = this.getFileExtension(editor.document.fileName);

      // Get compatible files
      const compatibleFiles = await this.fileDiscoveryService.getCompatibleFiles(sourceExtension);

      // Auto-select if only one compatible file, otherwise show file selector
      let targetFilePath: string | undefined;
      if (compatibleFiles.length === 1 && compatibleFiles[0]) {
        // Auto-select the only compatible file (for test scenarios)
        targetFilePath = compatibleFiles[0].path;
      } else {
        targetFilePath = await this.fileDiscoveryService.showFileSelector(compatibleFiles);
      }

      if (!targetFilePath) {
        return; // User cancelled
      }

      // Validate target file
      const isValid = await this.fileDiscoveryService.validateTargetFile(targetFilePath);
      if (!isValid) {
        vscode.window.showErrorMessage('Target file is not accessible or writable');
        return;
      }

      // Copy code to target file first
      await this.copyCodeToTargetFile(selectedText, targetFilePath);

      // Remove code from source file
      await editor.edit((editBuilder) => {
        editBuilder.delete(selection);
      });

      const fileName = this.getFileName(targetFilePath);
      vscode.window.showInformationMessage(`Lines moved to ${fileName}`);
      this.logger.info(`Lines moved to: ${targetFilePath}`);
    } catch (error) {
      this.logger.error('Error in Move Lines to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to move lines to file. Check file permissions and try again.`;
      vscode.window.showErrorMessage(msg);
    }
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

  private async copyCodeToTargetFile(code: string, targetFilePath: string): Promise<void> {
    try {
      // Open target file
      const targetUri = vscode.Uri.file(targetFilePath);
      const targetDocument = await vscode.workspace.openTextDocument(targetUri);

      // Get insertion point
      const insertionPoint = this.getInsertionPoint(targetDocument, code);

      // Open target file in editor to make edits
      const targetEditor = await vscode.window.showTextDocument(
        targetDocument,
        vscode.ViewColumn.Beside,
      );

      // Insert code at the determined position
      const applied = await targetEditor.edit((editBuilder) => {
        editBuilder.insert(insertionPoint, `\n${code}\n`);
      });
      if (!applied) {
        throw new Error(`Failed to insert code into '${targetFilePath}'`);
      }
    } catch (error) {
      this.logger.error('Error copying code to target file', error);
      const isPermissionError =
        error instanceof Error &&
        (error.message.includes('EACCES') ||
          error.message.includes('EPERM') ||
          error.message.includes('permission'));
      if (isPermissionError) {
        throw new Error(
          `Permission denied writing to '${targetFilePath}'. Check that the file is not read-only and you have write access.`,
          { cause: error },
        );
      }
      throw error;
    }
  }

  private getInsertionPoint(document: vscode.TextDocument, _code: string): vscode.Position {
    const config = this.configService.getCopyCodeConfig();

    switch (config.insertionPoint) {
      case 'beginning':
        return new vscode.Position(0, 0);
      case 'end':
        return new vscode.Position(document.lineCount, 0);
      case 'smart':
      default:
        // Smart insertion: after imports, before exports
        return this.findSmartInsertionPoint(document);
    }
  }

  private findSmartInsertionPoint(document: vscode.TextDocument): vscode.Position {
    const lines = document.getText().split('\n');
    const atCodeStart = this.computeCodeLineStarts(lines);

    let lastImportEndLine = -1;
    let firstExportLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (!atCodeStart[i]) {
        continue;
      }
      const line = lines[i]?.trim() ?? '';

      if (/^import(\s|\{|['"])/.test(line)) {
        // Import statements may span lines; end at the line closing with a quoted specifier
        for (let j = i; j < lines.length; j++) {
          const text = lines[j]?.trim() ?? '';
          const commentAt = text.indexOf(' //');
          const code = commentAt === -1 ? text : text.slice(0, commentAt).trimEnd();
          if (/['"];?$/.test(code)) {
            lastImportEndLine = j;
            i = j;
            break;
          }
        }
      } else if (line.startsWith('export ') && firstExportLine === -1) {
        firstExportLine = i;
      }
    }

    // Insert after imports, or before exports, or at end
    if (lastImportEndLine >= 0) {
      return new vscode.Position(lastImportEndLine + 1, 0);
    } else if (firstExportLine >= 0) {
      return new vscode.Position(firstExportLine, 0);
    } else {
      return new vscode.Position(document.lineCount, 0);
    }
  }

  /**
   * For each line, whether it starts in plain code (not inside a block comment
   * or template literal). Simple scanner; not a full tokenizer.
   */
  private computeCodeLineStarts(lines: string[]): boolean[] {
    const result: boolean[] = [];
    let inBlockComment = false;
    let inTemplate = false;

    for (const line of lines) {
      result.push(!inBlockComment && !inTemplate);
      let quote: string | null = null;

      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        const next = line[c + 1];
        if (inBlockComment) {
          if (ch === '*' && next === '/') {
            inBlockComment = false;
            c++;
          }
        } else if (inTemplate) {
          if (ch === '\\') {
            c++;
          } else if (ch === '`') {
            inTemplate = false;
          }
        } else if (quote) {
          if (ch === '\\') {
            c++;
          } else if (ch === quote) {
            quote = null;
          }
        } else if (ch === '/' && next === '/') {
          break;
        } else if (ch === '/' && next === '*') {
          inBlockComment = true;
          c++;
        } else if (ch === '`') {
          inTemplate = true;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
        }
      }
    }
    return result;
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
    this.logger.info('Copy Function to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      if (!this.isSupportedFileType(editor.document.fileName)) {
        vscode.window.showWarningMessage(
          'Copy Function to File only supports .ts, .tsx, .js, .jsx files.',
        );
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;

      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        document,
        position,
      );

      if (!functionInfo) {
        vscode.window.showWarningMessage(
          'No function found at cursor position. Place the cursor inside a function, arrow function, method, or class declaration and try again.',
        );
        return;
      }

      const sourceExtension = this.getFileExtension(document.fileName);

      const compatibleFiles = await this.fileDiscoveryService.getCompatibleFiles(sourceExtension);

      let targetFilePath: string | undefined;
      if (compatibleFiles.length === 1 && compatibleFiles[0]) {
        targetFilePath = compatibleFiles[0].path;
      } else {
        targetFilePath = await this.fileDiscoveryService.showFileSelector(compatibleFiles);
      }

      if (!targetFilePath) {
        return;
      }

      const isValid = await this.fileDiscoveryService.validateTargetFile(targetFilePath);
      if (!isValid) {
        vscode.window.showErrorMessage('Target file is not accessible or writable');
        return;
      }

      await this.insertFunctionIntoFile(functionInfo.fullText, targetFilePath);

      const fileName = this.getFileName(targetFilePath);
      vscode.window.showInformationMessage(`Function '${functionInfo.name}' copied to ${fileName}`);
      this.logger.info(`Function copied: ${functionInfo.name} to ${targetFilePath}`);
    } catch (error) {
      this.logger.error('Error in Copy Function to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to copy function to file. Check file permissions and try again.`;
      vscode.window.showErrorMessage(msg);
    }
  }

  private async handleMoveFunctionToFile(): Promise<void> {
    this.logger.info('Move Function to File command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
      }

      if (!this.isSupportedFileType(editor.document.fileName)) {
        vscode.window.showWarningMessage(
          'Move Function to File only supports .ts, .tsx, .js, .jsx files.',
        );
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;

      const functionInfo = await this.codeAnalysisService.findFunctionAtPosition(
        document,
        position,
      );

      if (!functionInfo) {
        vscode.window.showWarningMessage(
          'No function found at cursor position. Place the cursor inside a function, arrow function, method, or class declaration and try again.',
        );
        return;
      }

      const sourceExtension = this.getFileExtension(document.fileName);

      const compatibleFiles = await this.fileDiscoveryService.getCompatibleFiles(sourceExtension);

      let targetFilePath: string | undefined;
      if (compatibleFiles.length === 1 && compatibleFiles[0]) {
        targetFilePath = compatibleFiles[0].path;
      } else {
        targetFilePath = await this.fileDiscoveryService.showFileSelector(compatibleFiles);
      }

      if (!targetFilePath) {
        return;
      }

      const isValid = await this.fileDiscoveryService.validateTargetFile(targetFilePath);
      if (!isValid) {
        vscode.window.showErrorMessage('Target file is not accessible or writable');
        return;
      }

      // Inserting into the source file shifts the function's line range, so the delete below
      // would remove the wrong lines.
      if (path.resolve(targetFilePath) === path.resolve(document.uri.fsPath)) {
        vscode.window.showWarningMessage(
          'Move Function to File needs a different target file than the source file.',
        );
        return;
      }

      await this.insertFunctionIntoFile(functionInfo.fullText, targetFilePath);

      const range = new vscode.Range(
        new vscode.Position(functionInfo.startLine - 1, 0),
        new vscode.Position(functionInfo.endLine - 1, Number.MAX_SAFE_INTEGER),
      );

      await editor.edit((editBuilder) => {
        editBuilder.delete(range);
      });

      const fileName = this.getFileName(targetFilePath);
      vscode.window.showInformationMessage(`Function '${functionInfo.name}' moved to ${fileName}`);
      this.logger.info(`Function moved: ${functionInfo.name} to ${targetFilePath}`);
    } catch (error) {
      this.logger.error('Error in Move Function to File command', error);
      const msg =
        error instanceof Error
          ? error.message
          : `Failed to move function to file. Check file permissions and try again.`;
      vscode.window.showErrorMessage(msg);
    }
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

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? fileName.substring(lastDot) : '';
  }

  private isSupportedFileType(fileName: string): boolean {
    return ['.ts', '.tsx', '.js', '.jsx'].includes(this.getFileExtension(fileName));
  }

  private async insertFunctionIntoFile(code: string, targetFilePath: string): Promise<void> {
    await this.copyCodeToTargetFile(code, targetFilePath);
  }

  private getFileName(filePath: string): string {
    const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
    return lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
  }

  private async handleRenameFileConvention(uri?: vscode.Uri): Promise<void> {
    this.logger.info('Rename File Convention command triggered');

    try {
      const targetPath = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;

      if (!targetPath) {
        vscode.window.showErrorMessage(
          'No file or folder selected. Select a file or folder in the Explorer and try again.',
        );
        return;
      }

      const conventions = [
        getAccessibleQuickPickItem(
          {
            label: 'kebab-case',
            description: 'my-component-name.ts',
            value: 'kebab-case' as const,
          },
          { ariaLabel: 'Kebab case: my-component-name.ts' },
        ),
        getAccessibleQuickPickItem(
          { label: 'camelCase', description: 'myComponentName.ts', value: 'camelCase' as const },
          { ariaLabel: 'Camel case: myComponentName.ts' },
        ),
        getAccessibleQuickPickItem(
          { label: 'PascalCase', description: 'MyComponentName.ts', value: 'PascalCase' as const },
          { ariaLabel: 'Pascal case: MyComponentName.ts' },
        ),
      ];

      const selected = await vscode.window.showQuickPick(conventions, {
        placeHolder: 'Select naming convention',
      });

      if (!selected) {
        return;
      }

      const convention = (
        selected as vscode.QuickPickItem & { value: 'kebab-case' | 'camelCase' | 'PascalCase' }
      ).value;

      const result = await this.fileNamingConventionService.renameByPath(targetPath, convention);

      if (result.totalFiles === 0) {
        vscode.window.showInformationMessage('No files found to rename.');
        return;
      }

      const parts: string[] = [];
      if (result.renamedFiles.length > 0) parts.push(`${result.renamedFiles.length} renamed`);
      if (result.skippedFiles > 0)
        parts.push(`${result.skippedFiles} already follow ${convention}`);
      if (result.failedFiles.length > 0) parts.push(`${result.failedFiles.length} failed`);
      const summary = parts.join(', ');

      if (result.failedFiles.length > 0) {
        vscode.window.showWarningMessage(
          `Rename complete: ${summary}. Check Output Channel for details.`,
        );
        result.failedFiles.forEach((f) =>
          this.logger.error(`Failed to rename: ${f.path} — ${f.error}`),
        );
      } else {
        vscode.window.showInformationMessage(`Rename complete: ${summary}.`);
      }

      await this.announce(`Rename complete: ${summary}`, 'normal');
    } catch (error) {
      this.logger.error('Error in rename file convention', error);
      vscode.window.showErrorMessage(`Failed to rename files: ${(error as Error).message}`);
      await this.announceError('Rename File Convention', (error as Error).message);
    }
  }

  private async handleCopyFileContents(uri?: vscode.Uri): Promise<void> {
    this.logger.info('Copy File Contents command triggered');

    try {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showErrorMessage(
          'No file selected. Right-click a file in the Explorer and choose Copy File Contents.',
        );
        return;
      }

      const stat = await vscode.workspace.fs.stat(targetUri);
      if (stat.type & vscode.FileType.Directory) {
        vscode.window.showErrorMessage('Copy File Contents only works on files, not folders.');
        return;
      }
      const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
      if (stat.size > MAX_BYTES) {
        vscode.window.showWarningMessage(
          `File is too large to copy (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`,
        );
        return;
      }
      const bytes = await vscode.workspace.fs.readFile(targetUri);
      const contents = new TextDecoder('utf-8').decode(bytes);
      await vscode.env.clipboard.writeText(contents);

      const fileName = path.basename(targetUri.fsPath);
      vscode.window.showInformationMessage(`Copied contents of ${fileName} to clipboard`);
      this.logger.info(`File contents copied: ${targetUri.fsPath}`);
    } catch (error) {
      this.logger.error('Error in Copy File Contents command', error);
      vscode.window.showErrorMessage(
        `Failed to copy file contents: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleDuplicateFile(uri?: vscode.Uri): Promise<void> {
    this.logger.info('Duplicate File command triggered');

    try {
      const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showErrorMessage(
          'No file selected. Right-click a file in the Explorer and choose Duplicate File.',
        );
        return;
      }

      const stat = await vscode.workspace.fs.stat(targetUri);
      if (stat.type & vscode.FileType.Directory) {
        vscode.window.showErrorMessage('Duplicate File only works on files, not folders.');
        return;
      }

      const ext = path.posix.extname(targetUri.path);
      const nameWithoutExt = path.posix.basename(targetUri.path, ext);

      const parentPosixPath = path.posix.dirname(targetUri.path);

      // Find a free name: <name>-duplicate<ext>, then <name>-duplicate-1<ext>, etc.
      let candidatePosixPath = path.posix.join(
        parentPosixPath,
        `${nameWithoutExt}-duplicate${ext}`,
      );
      let counter = 1;
      let slotFound = false;
      const MAX_DUPLICATES = 100;
      while (!slotFound) {
        if (counter > MAX_DUPLICATES) {
          vscode.window.showErrorMessage(
            `Could not find a free name after ${MAX_DUPLICATES} attempts. Please rename or remove existing duplicates.`,
          );
          return;
        }
        try {
          await vscode.workspace.fs.stat(targetUri.with({ path: candidatePosixPath }));
          // File exists — try next increment
          candidatePosixPath = path.posix.join(
            parentPosixPath,
            `${nameWithoutExt}-duplicate-${counter}${ext}`,
          );
          counter++;
        } catch (statError) {
          if (statError instanceof vscode.FileSystemError && statError.code === 'FileNotFound') {
            slotFound = true;
          } else {
            throw statError; // propagate permission / network errors to outer catch
          }
        }
      }

      const newUri = targetUri.with({ path: candidatePosixPath });
      try {
        await vscode.workspace.fs.copy(targetUri, newUri, { overwrite: false });
      } catch (copyError) {
        // FileSystemError on a naming collision = TOCTOU race condition
        if (copyError instanceof vscode.FileSystemError && copyError.code === 'FileExists') {
          vscode.window.showWarningMessage(
            'Could not create duplicate — a naming collision occurred. Please try again.',
          );
          return;
        }
        throw copyError; // re-throw non-collision errors to outer catch
      }

      const originalName = path.posix.basename(targetUri.path);
      const newName = path.posix.basename(candidatePosixPath);
      vscode.window.showInformationMessage(`Duplicated ${originalName} → ${newName}`);
      this.logger.info(`File duplicated: ${targetUri.toString()} → ${newUri.toString()}`);
    } catch (error) {
      this.logger.error('Error in Duplicate File command', error);
      vscode.window.showErrorMessage(
        `Failed to duplicate file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
