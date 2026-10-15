import { spawn } from 'node:child_process';
import * as path from 'node:path';

import * as vscode from 'vscode';

import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import type {
  ITerminalService,
  TerminalOpenBehavior,
  TerminalType,
} from '../di/interfaces/ITerminalService';
import { Logger } from '../utils/logger';

import { ConfigurationService } from './configurationService';

const DIRECTORY_ENV_VAR = 'ACM_TERMINAL_DIRECTORY';
/** Window in which an early non-zero launcher exit counts as a launch failure */
const LAUNCH_GRACE_MS = 300;

/**
 * Terminal Service
 *
 * Cross-platform terminal integration for VS Code with intelligent
 * directory selection and platform-specific terminal support.
 *
 * @description
 * This service provides terminal opening functionality that works across
 * Windows, macOS, and Linux. Supports multiple terminal types and
 * configurable directory opening behavior.
 *
 * Key Features:
 * - Cross-platform terminal integration (Windows, macOS, Linux)
 * - Multiple terminal type support (integrated, external, system-default)
 * - Configurable directory opening behavior
 * - Path validation and resolution
 * - Custom terminal command support with templates
 * - Parent directory detection
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.TerminalService) private terminal: ITerminalService) {}
 *
 * // Using singleton (legacy)
 * const terminalService = TerminalService.getInstance();
 * ```
 *
 * @see ConfigurationService - Provides terminal configuration
 * @see ContextMenuManager - Uses this service for Open in Terminal
 *
 * @category Project Operations
 * @subcategory Terminal Integration
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.2.0
 */
export class TerminalService implements ITerminalService {
  private static instance: TerminalService | undefined;
  private logger: ILogger;
  private configService: IConfigurationService;

  private constructor(logger: ILogger, configService: IConfigurationService) {
    this.logger = logger;
    this.configService = configService;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): TerminalService {
    TerminalService.instance ??= new TerminalService(
      Logger.getInstance(),
      ConfigurationService.getInstance(),
    );
    return TerminalService.instance;
  }

  /**
   * Create a new TerminalService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @param configService - The configuration service instance
   * @returns A new TerminalService instance
   */
  public static create(logger: ILogger, configService: IConfigurationService): TerminalService {
    return new TerminalService(logger, configService);
  }

  public async initialize(): Promise<void> {
    this.logger.info('Initializing TerminalService');
  }

  public async openInTerminal(filePath: string): Promise<void> {
    this.logger.info('Opening terminal for file', { filePath });

    try {
      if (!filePath) {
        throw new Error('File path is required');
      }

      const directoryPath = this.getTargetDirectory(filePath);

      if (!(await this.validatePath(directoryPath))) {
        throw new Error(`Invalid or inaccessible directory: ${directoryPath}`);
      }

      await this.openDirectoryInTerminal(directoryPath);

      vscode.window.showInformationMessage(`Terminal opened in ${path.basename(directoryPath)}`);
      this.logger.info('Terminal opened successfully', { directory: directoryPath });
    } catch (error) {
      this.handleTerminalError(error as Error);
      throw error;
    }
  }

  public async openDirectoryInTerminal(directoryPath: string): Promise<void> {
    this.logger.info('Opening directory in terminal', { directoryPath });

    try {
      const terminalType = this.getTerminalType();

      switch (terminalType) {
        case 'integrated':
          await this.openIntegratedTerminal(directoryPath);
          break;
        case 'external':
          await this.openExternalTerminal(directoryPath);
          break;
        case 'system-default':
          await this.openSystemDefaultTerminal(directoryPath);
          break;
        default:
          throw new Error(`Unsupported terminal type: ${terminalType}`);
      }
    } catch (error) {
      this.logger.error('Failed to open directory in terminal', error);

      if (this.getTerminalType() !== 'integrated') {
        this.logger.info('Falling back to integrated terminal');
        await this.openIntegratedTerminal(directoryPath);
      } else {
        throw error;
      }
    }
  }

  private async openIntegratedTerminal(directoryPath: string): Promise<void> {
    try {
      const terminalName = `Terminal - ${path.basename(directoryPath)}`;

      const terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: directoryPath,
      });

      terminal.show();
      this.logger.debug('Integrated terminal created', { name: terminalName, cwd: directoryPath });
    } catch (error) {
      this.logger.error('Failed to create integrated terminal', error);
      throw new Error('Failed to open integrated terminal', { cause: error });
    }
  }

  private async openExternalTerminal(directoryPath: string): Promise<void> {
    try {
      const externalTerminalCommand = await this.getExternalTerminalCommand();

      if (!externalTerminalCommand) {
        throw new Error('No external terminal command configured');
      }

      const command = this.buildExternalTerminalCommand(externalTerminalCommand);
      const env = {
        ...process.env,
        [DIRECTORY_ENV_VAR]: this.normalizeDirectoryForEnv(directoryPath),
      };

      // User-provided shell string: keep shell semantics, but run detached.
      // The directory is passed via an environment variable so the shell never
      // parses it as syntax (no %VAR%, &, ^, $, backtick or quote injection).
      await this.launchDetached(command, [], { cwd: directoryPath, shell: true, env });

      this.logger.debug('External terminal command executed', { command });
    } catch (error) {
      this.logger.error('Failed to open external terminal', error);
      throw new Error('Failed to open external terminal', { cause: error });
    }
  }

  private async openSystemDefaultTerminal(directoryPath: string): Promise<void> {
    try {
      const platform = process.platform;

      switch (platform) {
        case 'win32': {
          // No string-built `cd /d`: the new console inherits cwd
          await this.launchDetached('cmd', ['/c', 'start', 'cmd', '/k'], {
            cwd: directoryPath,
            windowsHide: false,
          });
          break;
        }
        case 'darwin': {
          const { execFile } = await import('node:child_process');
          await new Promise<void>((resolve, reject) => {
            execFile('open', ['-a', 'Terminal', directoryPath], (err) =>
              err ? reject(err) : resolve(),
            );
          });
          break;
        }
        case 'linux': {
          const linuxTerminals = ['gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];
          const availableTerminal = await this.findAvailableTerminal(linuxTerminals);

          if (!availableTerminal) {
            throw new Error('No suitable terminal found on this Linux system');
          }

          await this.launchDetached(
            availableTerminal,
            this.buildLinuxTerminalArgs(availableTerminal, directoryPath),
            { cwd: directoryPath },
          );
          break;
        }
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      this.logger.debug('System default terminal opened', {
        platform: process.platform,
        directoryPath,
      });
    } catch (error) {
      this.logger.error('Failed to open system default terminal', error);
      throw new Error('Failed to open system default terminal', { cause: error });
    }
  }

  private async findAvailableTerminal(terminals: string[]): Promise<string | null> {
    const { execFile } = await import('node:child_process');
    for (const terminal of terminals) {
      try {
        await new Promise<void>((resolve, reject) => {
          execFile('which', [terminal], (error) => (error ? reject(error) : resolve()));
        });
        return terminal;
      } catch {}
    }
    return null;
  }

  private buildLinuxTerminalArgs(terminal: string, directoryPath: string): string[] {
    switch (terminal) {
      case 'konsole':
        return ['--workdir', directoryPath];
      case 'xterm':
        // spawn cwd option sets the working directory
        return [];
      case 'alacritty':
        return ['--working-directory', directoryPath];
      case 'kitty':
        return ['--directory', directoryPath];
      case 'wezterm':
        return ['start', '--cwd', directoryPath];
      case 'gnome-terminal':
      case 'xfce4-terminal':
      case 'tilix':
      case 'terminator':
      case 'foot':
        return [`--working-directory=${directoryPath}`];
      default:
        // Unknown terminal: rely on spawn cwd rather than guessing a flag
        return [];
    }
  }

  /**
   * Spawn a launcher fully detached from the extension host.
   * Rejects on spawn 'error' or on a non-zero exit within a short grace
   * window (e.g. usage error from a wrong flag) so callers can fall back to
   * the integrated terminal. Failures after the grace window are not detected.
   */
  private launchDetached(
    command: string,
    args: string[],
    options: {
      cwd: string;
      shell?: boolean;
      windowsHide?: boolean;
      env?: NodeJS.ProcessEnv;
    },
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
        ...options,
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onExit = (code: number | null, signal: NodeJS.Signals | null): void => {
        if (timer) clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`Terminal launcher exited early (code ${code}, signal ${signal})`));
        } else {
          resolve();
        }
      };
      child.once('error', (err) => {
        if (timer) clearTimeout(timer);
        child.removeListener('exit', onExit);
        reject(err);
      });
      child.once('exit', onExit);
      child.once('spawn', () => {
        child.unref();
        timer = setTimeout(() => {
          child.removeListener('exit', onExit);
          resolve();
        }, LAUNCH_GRACE_MS);
      });
    });
  }

  /**
   * Substitute `{{directory}}` with a reference to the directory env var,
   * chosen per shell quoting context so the path value itself is never
   * parsed by the shell. Without a placeholder the quoted reference is appended.
   */
  private buildExternalTerminalCommand(terminalCommand: string): string {
    const placeholder = '{{directory}}';
    if (!terminalCommand.includes(placeholder)) {
      return `${terminalCommand} ${this.directoryReference('none')}`;
    }

    const isWin = process.platform === 'win32';
    let state: 'none' | 'single' | 'double' = 'none';
    let out = '';
    for (let i = 0; i < terminalCommand.length; ) {
      if (terminalCommand.startsWith(placeholder, i)) {
        out += this.directoryReference(state);
        i += placeholder.length;
        continue;
      }
      const ch = terminalCommand.charAt(i);
      if (!isWin && ch === '\\' && state !== 'single' && i + 1 < terminalCommand.length) {
        // Escaped char: copy both, no state change (unless it is the placeholder start)
        if (!terminalCommand.startsWith(placeholder, i + 1)) {
          out += ch + terminalCommand.charAt(i + 1);
          i += 2;
          continue;
        }
      } else if (ch === '"' && state !== 'single') {
        state = state === 'double' ? 'none' : 'double';
      } else if (ch === "'" && !isWin && state !== 'double') {
        state = state === 'single' ? 'none' : 'single';
      }
      out += ch;
      i++;
    }
    return out;
  }

  private directoryReference(state: 'none' | 'single' | 'double'): string {
    if (process.platform === 'win32') {
      // cmd expands %VAR% before parsing; inside quotes metacharacters are inert
      return state === 'double' ? `%${DIRECTORY_ENV_VAR}%` : `"%${DIRECTORY_ENV_VAR}%"`;
    }
    switch (state) {
      case 'double':
        return `$${DIRECTORY_ENV_VAR}`;
      case 'single':
        return `'"$${DIRECTORY_ENV_VAR}"'`;
      default:
        return `"$${DIRECTORY_ENV_VAR}"`;
    }
  }

  private normalizeDirectoryForEnv(directoryPath: string): string {
    if (process.platform === 'win32' && /^.{3,}[\\/]$/.test(directoryPath)) {
      // A trailing backslash before the closing quote would escape it
      return directoryPath.replace(/[\\/]+$/, '');
    }
    return directoryPath;
  }

  public getParentDirectory(filePath: string): string {
    try {
      return path.dirname(filePath);
    } catch (error) {
      this.logger.error('Failed to get parent directory', error);
      throw new Error('Failed to resolve parent directory', { cause: error });
    }
  }

  public getTargetDirectory(filePath: string): string {
    const config = this.configService.getConfiguration();
    const openBehavior = config.terminal.openBehavior;

    switch (openBehavior) {
      case 'parent-directory':
        return this.getParentDirectory(filePath);
      case 'workspace-root':
        return this.getWorkspaceRoot();
      case 'current-directory':
        return filePath;
      default:
        this.logger.warn('Unknown open behavior, defaulting to parent directory', { openBehavior });
        return this.getParentDirectory(filePath);
    }
  }

  private getWorkspaceRoot(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const firstWorkspace = workspaceFolders[0];
      if (firstWorkspace) {
        return firstWorkspace.uri.fsPath;
      }
    }

    return process.cwd();
  }

  public getTerminalType(): TerminalType {
    const config = this.configService.getConfiguration();
    return config.terminal.type;
  }

  public getOpenBehavior(): TerminalOpenBehavior {
    const config = this.configService.getConfiguration();
    return config.terminal.openBehavior;
  }

  public async executeCommand(command: string, directoryPath?: string): Promise<void> {
    try {
      const terminalOptions: vscode.TerminalOptions = { name: 'Command Execution' };
      if (directoryPath !== undefined) {
        terminalOptions.cwd = directoryPath;
      }
      const terminal = vscode.window.createTerminal(terminalOptions);
      terminal.sendText(command);
      terminal.show();
    } catch (error) {
      this.logger.error('Failed to execute command in terminal', error);
      vscode.window.showErrorMessage(
        `Failed to open terminal: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async getExternalTerminalCommand(): Promise<string | undefined> {
    const config = this.configService.getConfiguration();
    return config.terminal.externalTerminalCommand;
  }

  public async validatePath(directoryPath: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(directoryPath);
      const stat = await vscode.workspace.fs.stat(uri);

      return (stat.type & vscode.FileType.Directory) !== 0;
    } catch (error) {
      this.logger.warn('Path validation failed', { path: directoryPath, error });
      return false;
    }
  }

  private handleTerminalError(error: Error): void {
    this.logger.error('Terminal operation failed', error);

    const message = error.message.includes('permission')
      ? 'Permission denied. Check if you have access to this directory.'
      : error.message.includes('not found') || error.message.includes('No such file')
        ? 'Directory not found or inaccessible.'
        : 'Failed to open terminal. See output channel for details.';

    vscode.window.showErrorMessage(`Terminal Error: ${message}`);
  }

  public dispose(): void {
    this.logger.debug('Disposing TerminalService');
  }
}
