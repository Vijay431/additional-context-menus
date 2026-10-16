/**
 * Project Detection Service Interface
 *
 * Defines the contract for detecting Node.js projects and framework types.
 *
 * @description
 * The project detection service interface provides:
 * - Node.js project detection
 * - Framework type detection (React, Angular, Express, Next.js)
 * - TypeScript detection
 * - Context variable management
 * - Workspace change monitoring
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IProjectDetectionService
 */

/**
 * Detected project type information
 *
 * Contains metadata about the detected project.
 */
export interface ProjectType {
  /** @deprecated Always true - kept for backward compatibility. Extension now works with any TS/JS file. */
  isNodeProject: boolean;
  /** Detected frameworks in the project */
  frameworks: ('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[];
  /** Whether TypeScript is used in the project */
  hasTypeScript: boolean;
  /** Support level for the extension (full, partial, none) */
  supportLevel: 'full' | 'partial' | 'none';
}

/**
 * Project Detection Service Interface
 *
 * All project detection operations must implement this interface.
 * The service is responsible for detecting the project type
 * and managing VS Code context variables for menu visibility.
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(
 *     @inject(TYPES.ProjectDetectionService)
 *     private projectDetection: IProjectDetectionService
 *   ) {}
 *
 *   async checkSupport() {
 *     const project = await this.projectDetection.detectProjectType();
 *     if (project.isNodeProject && project.hasTypeScript) {
 *       console.log('Full TypeScript support available');
 *     }
 *   }
 * }
 * ```
 */
export interface IProjectDetectionService {
  /**
   * Detect the current project type
   *
   * Analyzes the workspace to determine if it's a Node.js project
   * and what frameworks are in use.
   *
   * @param workspaceFolder - Optional workspace folder to analyze
   * @returns Project type information
   */
  detectProjectType(workspaceFolder?: { uri: { fsPath: string } }): Promise<ProjectType>;

  /**
   * Check if the current workspace is a Node.js project
   *
   * Quick check for package.json existence.
   *
   * @returns true if workspace has package.json
   */
  isNodeProject(): Promise<boolean>;

  /**
   * Get detected frameworks
   *
   * Returns the list of frameworks detected in the project.
   *
   * @returns Array of framework names
   */
  getFrameworks(): Promise<('react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte')[]>;

  /**
   * Update VS Code context variables
   *
   * Sets the context variables that control menu visibility.
   * This should be called on workspace changes.
   *
   * @returns Promise that resolves when context is updated
   */
  updateContextVariables(): Promise<void>;

  /**
   * Listen for workspace changes
   *
   * Sets up listeners for workspace folder changes that
   * might affect project detection.
   *
   * @param callback - Function to call when workspace changes
   * @returns Disposable that stops listening when disposed
   */
  onWorkspaceChanged(callback: () => void): { dispose: () => void };

  /**
   * Clear the project detection cache
   *
   * Clears cached project type information to force re-detection.
   * Call this when the workspace structure changes.
   */
  clearCache(): void;

  /**
   * Check if a framework is detected
   *
   * Checks if a specific framework is present in the project.
   *
   * @param framework - The framework name to check
   * @returns true if framework is detected
   */
  hasFramework(
    framework: 'react' | 'angular' | 'express' | 'next' | 'vue' | 'svelte',
  ): Promise<boolean>;

  /**
   * Get the support level for the current project
   *
   * Returns how well the extension supports the current project type.
   *
   * @returns Support level (full, partial, or none)
   */
  getSupportLevel(): Promise<'full' | 'partial' | 'none'>;
}
