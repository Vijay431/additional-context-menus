/**
 * Environment File Generator Service Interface
 *
 * Defines the contract for generating .env files from code patterns.
 *
 * @description
 * The environment file generator service interface provides:
 * - Environment variable detection from code
 * - .env file generation
 * - Pattern recognition for process.env usage
 * - Value suggestion for detected variables
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IEnvFileGeneratorService
 */

/**
 * Detected environment variable information
 */
export interface EnvVariable {
  /** Variable name */
  name: string;
  /** Files where this variable is used */
  files: string[];
  /** Suggested default value (if available) */
  suggestedValue?: string;
  /** Whether the variable appears to be required */
  isRequired: boolean;
}

/**
 * Environment File Generator Service Interface
 *
 * All environment file generation operations must implement this interface.
 * The service is responsible for detecting environment variable usage
 * and generating .env files.
 */
export interface IEnvFileGeneratorService {
  /**
   * Generate a .env file from detected environment variables
   *
   * Scans the workspace for process.env usage and creates
   * a .env file with all detected variables.
   *
   * @returns Promise that resolves when .env file is generated
   */
  generateEnvFile(): Promise<void>;

  /**
   * Detect environment variables in the workspace
   *
   * Scans all compatible files for process.env usage.
   *
   * @returns Promise resolving to array of detected variables
   */
  detectEnvVariables(): Promise<EnvVariable[]>;

  /**
   * Scan a single document for environment variables
   *
   * Parses a document to find all process.env references.
   *
   * @param document - The document to scan
   * @returns Array of environment variable names found
   */
  scanDocumentForEnvVars(document: { getText(): string; fileName?: string }): string[];

  /**
   * Generate .env file content from variables
   *
   * Creates the text content for a .env file.
   *
   * @param variables - Array of environment variables
   * @param includeComments - Whether to include descriptive comments
   * @returns The .env file content as a string
   */
  generateEnvContent(variables: EnvVariable[], includeComments: boolean): string;

  /**
   * Check if a .env file already exists
   *
   * Checks the workspace root for an existing .env file.
   *
   * @returns true if .env file exists
   */
  envFileExists(): Promise<boolean>;
}
