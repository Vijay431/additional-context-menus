/**
 * Enum Generator Service Interface
 *
 * Defines the contract for generating enums from union types.
 *
 * @description
 * The enum generator service interface provides:
 * - Enum generation from union type selections
 * - Multiple enum naming conventions
 * - Automatic value formatting
 * - Insertion at cursor position
 *
 * @category Dependency Injection
 * @category Interfaces
 * @module di/interfaces/IEnumGeneratorService
 */

/**
 * Enum naming convention options
 */
export type EnumNamingConvention = 'PascalCase' | 'UPPER_CASE' | 'camelCase';

/**
 * Enum Generator Service Interface
 *
 * All enum generation operations must implement this interface.
 * The service is responsible for generating enum declarations
 * from selected union type values.
 */
export interface IEnumGeneratorService {
  /**
   * Generate enum from current editor selection
   *
   * Reads the selected text, extracts union values, and generates
   * an enum declaration. The user can choose the enum name and
   * naming convention through quick pick dialogs.
   *
   * @returns Promise that resolves when enum is generated
   */
  generateEnumFromSelection(): Promise<void>;

  /**
   * Generate enum from an array of string values
   *
   * Creates an enum declaration from the provided values.
   *
   * @param values - Array of enum values
   * @param enumName - Name for the enum type
   * @param convention - Naming convention for enum members
   * @returns The generated enum declaration as a string
   */
  generateEnum(values: string[], enumName: string, convention: EnumNamingConvention): string;

  /**
   * Format a value as an enum member name
   *
   * Converts a string value to a valid enum member name
   * following the specified convention.
   *
   * @param value - The value to format
   * @param convention - The naming convention to apply
   * @returns Formatted enum member name
   */
  formatEnumMember(value: string, convention: EnumNamingConvention): string;

  /**
   * Extract union values from selected text
   *
   * Parses the selected text to find union type values.
   *
   * @param selectedText - The text to parse
   * @returns Array of extracted union values
   */
  extractUnionValues(selectedText: string): string[];
}
