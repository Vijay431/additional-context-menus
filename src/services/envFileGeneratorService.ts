import * as fs from 'fs/promises';
import * as path from 'path';

import * as vscode from 'vscode';

import { AccessibilityService } from '../services/accessibilityService';
import { formatAccessibleInputPrompt } from '../utils/accessibilityHelper';
import { Logger } from '../utils/logger';
import { isPathWithin, isSafeFilePath } from '../utils/pathValidator';

/**
 * Env File Generator Service
 *
 * Generates .env files from .env.example templates with
 * variable extraction and custom file naming support.
 *
 * @description
 * This service creates environment variable files (.env, .env.local, etc.)
 * based on .env.example templates found in the workspace. Parses variable names
 * and generates empty .env files ready for user configuration.
 *
 * Key Features:
 * - .env.example file parsing and validation
 * - Variable name extraction (supports comments)
 * - Custom .env file naming (.env, .env.local, .env.development, .env.production)
 * - Automatic file creation in workspace root
 * - Editor integration for immediate editing
 * - File name validation
 *
 * .env.example Format:
 * # Comment lines are preserved for documentation
 * VAR_NAME=value → Creates empty VAR_NAME= in .env
 * Empty lines are preserved
 * Complex values are supported
 *
 * Supported File Names:
 * - .env - Default production/staging environment
 * - .env.local - Local overrides (never committed)
 * - .env.development - Development environment
 * - .env.production - Production environment
 * - .env.test - Test environment
 * - Custom names (validated to start with '.')
 *
 * Use Cases:
 * - Setting up environment variables for new projects
 * - Creating multiple environment configs (dev, staging, prod)
 * - Quick .env file generation from templates
 * - Environment configuration management
 * - Security (keeping .env.example in repo, .env local)
 *
 * @example
 * // Get service instance
 * const envService = EnvFileGeneratorService.getInstance();
 *
 * // Generate .env file
 * await envService.generateEnvFile();
 * // User prompted for file name (default: .env)
 * // If .env.example exists, variables extracted and .env created
 * // .env automatically opened in editor
 *
 * // Requires .env.example in workspace root:
 * // NODE_ENV=production
 * // PORT=3000
 * // DB_HOST=localhost
 *
 * // Creates .env:
 * // NODE_ENV=
 * // PORT=
 * // DB_HOST=
 *
 * @see ConfigurationService - Not used directly but follows patterns
 *
 * @category Code Generation
 * @subpackage Environment Configuration
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.3.0
 */

export class EnvFileGeneratorService {
  private static instance: EnvFileGeneratorService | undefined;
  private logger: Logger;
  private accessibilityService: AccessibilityService;

  private constructor() {
    this.logger = Logger.getInstance();
    this.accessibilityService = AccessibilityService.getInstance();
  }

  public static getInstance(): EnvFileGeneratorService {
    EnvFileGeneratorService.instance ??= new EnvFileGeneratorService();
    return EnvFileGeneratorService.instance;
  }

  public async generateEnvFile(): Promise<void> {
    this.logger.info('Generate .env File command triggered');

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found');
        await this.accessibilityService.announceError(
          'Generate .env File',
          'No workspace folder found',
        );
        return;
      }

      const activeEditor = vscode.window.activeTextEditor;
      const activeFolder =
        activeEditor && vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
      const fallbackFolder = workspaceFolders[0];
      if (!fallbackFolder) {
        return;
      }
      const workspaceRoot = (activeFolder ?? fallbackFolder).uri.fsPath;
      const envExamplePath = path.join(workspaceRoot, '.env.example');

      if (!isSafeFilePath(envExamplePath)) {
        this.logger.warn('Rejected unsafe .env.example path', { path: envExamplePath });
        vscode.window.showErrorMessage('Path to .env.example is not allowed.');
        await this.accessibilityService.announceError(
          'Generate .env File',
          'Path to .env.example is not allowed',
        );
        return;
      }

      const envExampleExists = await this.fileExists(envExamplePath);
      if (!envExampleExists) {
        vscode.window.showWarningMessage('.env.example file not found in workspace root.');
        await this.accessibilityService.announce(
          'Dot env example file not found in workspace root',
          'minimal',
        );
        return;
      }

      const envFileName = await this.promptForEnvFileName();
      if (!envFileName) {
        return;
      }

      const nameError = EnvFileGeneratorService.validateEnvFileName(envFileName);
      if (nameError) {
        vscode.window.showErrorMessage(nameError);
        await this.accessibilityService.announceError('Generate .env File', nameError);
        return;
      }

      const envFilePath = path.join(workspaceRoot, envFileName);
      const generated = await this.generateEnvFileFromExample(
        envExamplePath,
        envFilePath,
        workspaceRoot,
      );
      if (!generated) {
        return;
      }

      const envUri = vscode.Uri.file(envFilePath);
      await vscode.window.showTextDocument(envUri, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: false,
      });

      vscode.window.showInformationMessage(`Created ${envFileName} file successfully`);
      await this.accessibilityService.announceSuccess(
        'Generate .env File',
        `Created ${envFileName} file successfully`,
      );
      this.logger.info(`Generated ${envFileName} from .env.example`, {
        examplePath: envExamplePath,
        targetPath: envFilePath,
      });
    } catch (error) {
      this.logger.error('Error generating .env file', error);
      vscode.window.showErrorMessage(`Failed to generate .env file: ${(error as Error).message}`);
      await this.accessibilityService.announceError('Generate .env File', (error as Error).message);
    }
  }

  private async promptForEnvFileName(): Promise<string | undefined> {
    const prompt = formatAccessibleInputPrompt('Enter .env file name', 'Must start with a dot');

    const envFileName = await vscode.window.showInputBox({
      prompt,
      placeHolder: '.env',
      value: '.env',
      validateInput: (value) => EnvFileGeneratorService.validateEnvFileName(value),
    });

    if (envFileName) {
      await this.accessibilityService.announce(
        `Environment file name set to ${envFileName}`,
        'normal',
      );
    }

    return envFileName;
  }

  /**
   * Returns an error message if the name is not a plain dot-file name
   * (no path separators, no traversal), otherwise undefined.
   */
  private static validateEnvFileName(value: string | undefined): string | undefined {
    if (!value || value.trim().length === 0) {
      return 'Error: File name cannot be empty';
    }
    if (!value.startsWith('.')) {
      return 'Error: File name must start with a dot';
    }
    if (
      value === '.' ||
      value === '..' ||
      value.includes('/') ||
      value.includes('\\') ||
      path.basename(value) !== value
    ) {
      return 'Error: File name must not contain path separators';
    }
    return undefined;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async generateEnvFileFromExample(
    examplePath: string,
    targetPath: string,
    workspaceRoot: string,
  ): Promise<boolean> {
    const resolvedExamplePath = path.resolve(examplePath);
    const resolvedTargetPath = path.resolve(targetPath);
    // Containment is enforced by isPathWithin; isSafeFilePath is not used for the
    // target because its extension/'..' heuristics misjudge legitimate .env names.
    if (
      !isSafeFilePath(resolvedExamplePath) ||
      !isPathWithin(workspaceRoot, resolvedExamplePath) ||
      !isPathWithin(workspaceRoot, resolvedTargetPath) ||
      resolvedTargetPath === path.resolve(workspaceRoot)
    ) {
      throw new Error('Invalid file path');
    }

    if (await this.fileExists(resolvedTargetPath)) {
      const choice = await vscode.window.showWarningMessage(
        `${path.basename(resolvedTargetPath)} already exists. Overwrite?`,
        'Overwrite',
        'Cancel',
      );
      if (choice !== 'Overwrite') {
        return false;
      }
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths validated by isPathWithin()
    const exampleContent = await fs.readFile(resolvedExamplePath, 'utf-8');
    const variables = this.parseEnvVariables(exampleContent);
    const envContent = variables.map((variable) => `${variable.name}=`).join('\n');

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated by isPathWithin()
    await fs.writeFile(resolvedTargetPath, envContent, 'utf-8');
    return true;
  }

  private parseEnvVariables(content: string): { name: string }[] {
    const variables: { name: string }[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const name = trimmedLine.slice(0, equalIndex).trim();
      if (name.length > 0) {
        variables.push({ name });
      }
    }

    return variables;
  }
}
