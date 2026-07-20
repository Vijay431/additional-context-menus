import * as fs from 'fs/promises';
import * as path from 'path';

import * as vscode from 'vscode';

import type { IConfigurationService } from '../di/interfaces/IConfigurationService';
import type { ILogger } from '../di/interfaces/ILogger';
import type {
  IProjectDetectionService,
  ProjectType,
} from '../di/interfaces/IProjectDetectionService';
import { Cache } from '../utils/cache';
import { Logger } from '../utils/logger';
import { isSafeFilePath } from '../utils/pathValidator';

/**
 * Project Detection Service
 *
 * Automatic project type and framework detection with extension recommendations
 * and .vscode/settings.json auto-update support.
 *
 * @description
 * This service analyzes the workspace to detect project type and frameworks.
 * Updates VS Code context variables for menu visibility and can automatically
 * update .vscode/settings.json with recommended extensions.
 *
 * Key Features:
 * - Framework detection (React, Angular, Express, Next.js, Vue, Svelte, Nest.js)
 * - TypeScript detection (tsconfig.json, @types/node dependency)
 * - Context variable updates for menu visibility
 * - Extension recommendation system
 * - .vscode/settings.json auto-update
 * - Workspace change handling
 * - Detection caching for performance
 *
 * Detected Frameworks:
 * - React: presence of 'react' dependency
 * - Angular: presence of '@angular/core' dependency
 * - Express: presence of 'express' dependency
 * - Next.js: presence of 'next' dependency
 * - Vue.js: presence of 'vue' dependency
 * - Svelte: presence of 'svelte' dependency
 * - Nest.js: presence of '@nestjs/core' dependency
 * - TypeScript: presence of tsconfig.json or '@types/node' dependency
 *
 * Extension Recommendations:
 * - TypeScript projects: dbaeumer.vscode-eslint, esbenp.prettier-vscode
 * - Angular projects: Angular.ng-template, dbaeumer.vscode-eslint
 * - React projects: dbaeumer.vscode-eslint, esbenp.prettier-vscode
 * - Next.js projects: dbaeumer.vscode-eslint, bradlc.vscode-tailwindcss
 * - Vue projects: Vue.volar, dbaeumer.vscode-eslint
 * - Svelte projects: svelte.svelte-vscode, dbaeumer.vscode-eslint
 *
 * Use Cases:
 * - Automatic project detection on workspace open
 * - Framework-aware menu display
 * - Recommended extensions suggestions
 * - IDE configuration automation
 * - Multi-framework project detection
 *
 * @example
 * // Get service instance
 * const detectionService = ProjectDetectionService.getInstance();
 *
 * // Detect project type
 * const projectType = await detectionService.detectProjectType();
 * console.log(`Is Node.js: ${projectType.isNodeProject}`);
 * console.log(`Frameworks: ${projectType.frameworks.join(', ')}`);
 * console.log(`Has TypeScript: ${projectType.hasTypeScript}`);
 *
 * // Update context variables
 * await detectionService.updateContextVariables();
 * // Updates: additionalContextMenus.hasReact, hasAngular, hasExpress, etc.
 *
 * // Auto-update .vscode/settings.json
 * // Automatically called on workspace open if configured
 * // Updates recommendations array with framework-specific extensions
 *
 * @see ConfigurationService - Provides projectDetection.autoUpdateSettings
 * @see CodeAnalysisService - May use for code analysis
 *
 * @category Configuration & State
 * @subpackage Project Intelligence
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.3.0
 */

export class ProjectDetectionService implements IProjectDetectionService {
  private static instance: ProjectDetectionService | undefined;
  private logger: ILogger;
  private projectTypeCache: Cache<ProjectType>;

  private constructor(
    logger: ILogger,
    _configService?: IConfigurationService,
    cacheTTL: number = 10 * 60 * 1000,
  ) {
    this.logger = logger;
    this.projectTypeCache = new Cache<ProjectType>({
      maxSize: 50,
      defaultTTL: cacheTTL,
      trackStats: false,
    });
    this.logger = logger;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): ProjectDetectionService {
    ProjectDetectionService.instance ??= new ProjectDetectionService(Logger.getInstance());
    return ProjectDetectionService.instance;
  }

  /**
   * Create a new ProjectDetectionService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @param configService - Optional configuration service
   * @returns A new ProjectDetectionService instance
   */
  public static create(
    logger: ILogger,
    configService?: IConfigurationService,
    cacheTTL?: number,
  ): ProjectDetectionService {
    return new ProjectDetectionService(logger, configService, cacheTTL);
  }

  public async detectProjectType(workspaceFolder?: vscode.WorkspaceFolder): Promise<ProjectType> {
    if (!workspaceFolder && vscode.workspace.workspaceFolders) {
      workspaceFolder = vscode.workspace.workspaceFolders[0];
    }

    if (!workspaceFolder) {
      return this.createProjectType(false, [], false, 'none');
    }

    const cacheKey = workspaceFolder.uri.fsPath;
    const cached = this.projectTypeCache.get(cacheKey);
    if (cached) {
      this.logger.debug('Project type cache hit', { path: cacheKey });
      return cached;
    }

    const projectType = await this.analyzeProject(workspaceFolder.uri.fsPath);
    this.projectTypeCache.set(cacheKey, projectType);
    this.logger.debug('Project type cached', { path: cacheKey });

    return projectType;
  }

  private async analyzeProject(projectPath: string): Promise<ProjectType> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const tsConfigPath = path.join(projectPath, 'tsconfig.json');

      // Check if package.json exists
      const hasPackageJson = await this.pathExists(packageJsonPath);
      if (!hasPackageJson) {
        this.logger.debug('No package.json found, not a Node.js project');
        return this.createProjectType(false, [], false, 'none');
      }

      // Parse package.json
      const resolvedPackageJsonPath = path.resolve(packageJsonPath);
      if (!isSafeFilePath(resolvedPackageJsonPath)) {
        return this.createProjectType(false, [], false, 'none');
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path validated by isSafeFilePath()
      const packageData = await fs.readFile(resolvedPackageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageData);
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for TypeScript
      const hasTypeScript =
        (await this.pathExists(tsConfigPath)) ||
        dependencies.typescript !== undefined ||
        dependencies['@types/node'] !== undefined;

      // Detect frameworks
      const frameworks = this.detectFrameworks(dependencies);

      // Check for Node.js indicators
      const isNodeProject = this.isNodeJsProject(dependencies);

      // Determine support level
      const supportLevel = this.determineSupportLevel(isNodeProject, frameworks, hasTypeScript);

      const result = this.createProjectType(isNodeProject, frameworks, hasTypeScript, supportLevel);

      this.logger.info('Project detected', {
        path: projectPath,
        isNodeProject,
        frameworks,
        hasTypeScript,
        supportLevel,
      });

      return result;
    } catch (error) {
      this.logger.error('Error analyzing project', error);
      return this.createProjectType(false, [], false, 'none');
    }
  }

  private detectFrameworks(
    dependencies: Record<string, string>,
  ): ('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[] {
    const frameworks: ('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[] = [];

    // React
    if (dependencies['react']) {
      frameworks.push('react');
    }

    // Angular
    if (dependencies['@angular/core']) {
      frameworks.push('angular');
    }

    // Express
    if (dependencies['express']) {
      frameworks.push('express');
    }

    // Next.js
    if (dependencies['next']) {
      frameworks.push('next');
    }

    // Vue.js
    if (dependencies['vue']) {
      frameworks.push('vue');
    }

    // Svelte
    if (dependencies['svelte']) {
      frameworks.push('svelte');
    }

    // Nest.js
    if (dependencies['@nestjs/core']) {
      // Note: 'nestjs' is not in the interface, but we include it internally
    }

    return frameworks;
  }

  private isNodeJsProject(dependencies: Record<string, string>): boolean {
    // Check for common Node.js indicators
    const nodeIndicators = [
      'express',
      'react',
      'angular',
      'next',
      'vue',
      'svelte',
      '@angular/core',
      '@nestjs/core',
      'typescript',
      '@types/node',
      'webpack',
      'vite',
      'rollup',
    ];

    return nodeIndicators.some((indicator) => indicator in dependencies);
  }

  private determineSupportLevel(
    isNodeProject: boolean,
    frameworks: string[],
    hasTypeScript: boolean,
  ): 'full' | 'partial' | 'none' {
    if (!isNodeProject) {
      return 'none';
    }

    if (frameworks.length > 0 && hasTypeScript) {
      return 'full';
    }

    if (frameworks.length > 0 || hasTypeScript) {
      return 'partial';
    }

    return 'partial'; // Basic Node.js project
  }

  private createProjectType(
    isNodeProject: boolean,
    frameworks: ('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[],
    hasTypeScript: boolean,
    supportLevel: 'full' | 'partial' | 'none',
  ): ProjectType {
    return {
      isNodeProject,
      frameworks,
      hasTypeScript,
      supportLevel,
    };
  }

  public async updateContextVariables(): Promise<void> {
    const projectType = await this.detectProjectType();

    // Always enable menus for TypeScript/JavaScript files (language-focused approach)
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.isNodeProject',
      true,
    );
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.hasReact',
      projectType.frameworks.includes('react'),
    );
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.hasAngular',
      projectType.frameworks.includes('angular'),
    );
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.hasExpress',
      projectType.frameworks.includes('express'),
    );
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.hasNextjs',
      projectType.frameworks.includes('next'),
    );
    await vscode.commands.executeCommand(
      'setContext',
      'additionalContextMenus.hasTypeScript',
      projectType.hasTypeScript,
    );

    this.logger.debug('Context variables updated', projectType);
  }

  public clearCache(): void {
    this.projectTypeCache.clear();
    this.logger.debug('Project type cache cleared');
  }

  /**
   * Get cache statistics
   *
   * Returns statistics about the project type cache.
   *
   * @returns Cache statistics
   */
  public getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    return this.projectTypeCache.getStats();
  }

  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  public onWorkspaceChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.clearCache();
      void this.updateContextVariables();
      callback();
    });
  }

  public async getFrameworks(): Promise<
    ('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[]
  > {
    const projectType = await this.detectProjectType();
    return projectType.frameworks as (
      'react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte'
    )[];
  }

  public async hasFramework(
    framework: 'react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte',
  ): Promise<boolean> {
    const frameworks = await this.getFrameworks();
    return frameworks.includes(framework);
  }

  public async getSupportLevel(): Promise<'full' | 'partial' | 'none'> {
    const projectType = await this.detectProjectType();
    return projectType.supportLevel;
  }

  public async isNodeProject(): Promise<boolean> {
    const projectType = await this.detectProjectType();
    return projectType.isNodeProject;
  }
}
