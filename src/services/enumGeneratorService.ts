import * as vscode from 'vscode';

import type { IAccessibilityService } from '../di/interfaces/IAccessibilityService';
import type {
  EnumNamingConvention,
  IEnumGeneratorService,
} from '../di/interfaces/IEnumGeneratorService';
import type { ILogger } from '../di/interfaces/ILogger';
import { AccessibilityService } from '../services/accessibilityService';
import { formatAccessibleInputPrompt } from '../utils/accessibilityHelper';
import { Logger } from '../utils/logger';

/**
 * Enum Generator Service
 *
 * Generates TypeScript enum types from string literal union types
 * with smart value conversion and code formatting.
 *
 * @description
 * This service converts TypeScript union types to enum definitions.
 * e.g., type Status = "pending" | "approved" | "rejected"
 * Handles value name conversion and validation.
 *
 * @example
 * ```typescript
 * // Using DI (recommended)
 * constructor(@inject(TYPES.EnumGeneratorService) private enumGen: IEnumGeneratorService) {}
 *
 * // Using singleton (legacy)
 * const enumService = EnumGeneratorService.getInstance();
 * ```
 *
 * @see ConfigurationService - Not used directly but follows patterns
 * @see CodeAnalysisService - Works with code analysis
 *
 * @category Code Generation
 * @subcategory TypeScript
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 1.3.0
 */

export class EnumGeneratorService implements IEnumGeneratorService {
  private static instance: EnumGeneratorService | undefined;
  private logger: ILogger;
  private accessibilityService: IAccessibilityService;

  private constructor(logger: ILogger, accessibilityService: IAccessibilityService) {
    this.logger = logger;
    this.accessibilityService = accessibilityService;
  }

  /**
   * Get the singleton instance (legacy pattern)
   *
   * @deprecated Use DI injection instead
   */
  public static getInstance(): EnumGeneratorService {
    EnumGeneratorService.instance ??= new EnumGeneratorService(
      Logger.getInstance(),
      AccessibilityService.getInstance(),
    );
    return EnumGeneratorService.instance;
  }

  /**
   * Create a new EnumGeneratorService instance (DI pattern)
   *
   * This method is used by the DI container.
   *
   * @param logger - The logger instance to use
   * @param accessibilityService - The accessibility service instance
   * @returns A new EnumGeneratorService instance
   */
  public static create(
    logger: ILogger,
    accessibilityService: IAccessibilityService,
  ): EnumGeneratorService {
    return new EnumGeneratorService(logger, accessibilityService);
  }

  public async generateEnumFromSelection(): Promise<void> {
    this.logger.info('Generate Enum from Selection command triggered');

    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        await this.accessibilityService.announceError('Generate Enum', 'No active editor found');
        return;
      }

      const document = editor.document;

      if (document.isUntitled) {
        vscode.window.showErrorMessage(
          'Cannot generate enum from untitled file. Please save the file first.',
        );
        await this.accessibilityService.announceError(
          'Generate Enum',
          'Cannot generate enum from untitled file. Please save the file first.',
        );
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showWarningMessage('No code selected. Please select a type definition.');
        await this.accessibilityService.announce(
          'No code selected. Please select a type definition.',
          'minimal',
        );
        return;
      }

      const selectedText = document.getText(selection);
      const unionType = this.parseUnionType(selectedText);

      if (!unionType) {
        vscode.window.showWarningMessage(
          'Selected code does not appear to be a TypeScript union type.',
        );
        await this.accessibilityService.announce(
          'Selected code is not a valid TypeScript union type',
          'minimal',
        );
        return;
      }

      const enumName = await this.promptForEnumName(unionType.variableName);
      if (!enumName) {
        return;
      }

      const enumCode = this.generateEnumCode(enumName, unionType.values);
      const insertPosition = new vscode.Position(selection.start.line, 0);

      await editor.edit((editBuilder) => {
        editBuilder.insert(insertPosition, `${enumCode}\n\n`);
      });

      await document.save();

      const valueCount = unionType.values.length;
      vscode.window.showInformationMessage(
        `Generated enum '${enumName}' with ${valueCount} values`,
      );
      await this.accessibilityService.announceSuccess(
        'Generate Enum',
        `Enum '${enumName}' generated with ${valueCount} values`,
      );
      this.logger.info(`Enum generated successfully: ${enumName}`, {
        variableName: unionType.variableName,
        valueCount,
      });
    } catch (error) {
      this.logger.error('Error generating enum', error);
      vscode.window.showErrorMessage(`Failed to generate enum: ${(error as Error).message}`);
      await this.accessibilityService.announceError('Generate Enum', (error as Error).message);
    }
  }

  public parseUnionType(text: string): { variableName: string; values: string[] } | null {
    const trimmedText = text.trim();

    const typeAliasMatch = trimmedText.match(/^type\s+(\w+)\s*=\s*(.+);?$/);
    if (typeAliasMatch) {
      const variableName = typeAliasMatch[1] ?? '';
      const typeDefinition = typeAliasMatch[2] ?? '';

      const values = this.extractStringLiterals(typeDefinition);
      if (values.length > 0) {
        return { variableName, values };
      }
    }

    const inlineMatch = trimmedText.match(/(\w+)\s*:\s*(.+);?$/);
    if (inlineMatch) {
      const variableName = inlineMatch[1] ?? '';
      const typeDefinition = inlineMatch[2] ?? '';

      const values = this.extractStringLiterals(typeDefinition);
      if (values.length > 0) {
        return { variableName, values };
      }
    }

    return null;
  }

  private extractStringLiterals(text: string): string[] {
    const values: string[] = [];

    // biome-ignore lint/correctness/noEmptyCharacterClassInRegex: legacy pattern kept as-is; changing it would change which literals are extracted
    const patterns = [/(['"])([^'"]*)\1/g, /(['])([^]]*)\1/g, /(['`])([^'`]*)\1/g];

    for (const pattern of patterns) {
      for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
        const value = match[2]?.trim() ?? '';
        if (value && !values.includes(value)) {
          values.push(value);
        }
      }
    }

    return values;
  }

  private async promptForEnumName(defaultName: string): Promise<string | undefined> {
    const prompt = formatAccessibleInputPrompt(
      'Enter enum name',
      'Must start with uppercase letter and contain only letters and numbers',
    );

    const enumName = await vscode.window.showInputBox({
      prompt,
      placeHolder: defaultName,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Error: Enum name cannot be empty';
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
          return 'Error: Enum name must start with uppercase letter and contain only letters and numbers';
        }
        return undefined;
      },
    });

    if (enumName) {
      await this.accessibilityService.announce(`Enum name set to ${enumName}`, 'normal');
    }

    return enumName;
  }

  private generateEnumCode(enumName: string, values: string[]): string {
    const lines: string[] = [`export enum ${enumName} {`, ''];

    for (const value of values) {
      const enumValueName = this.convertToEnumValueName(value);
      lines.push(`  ${enumValueName} = '${value}',`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private convertToEnumValueName(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^_+/, '')
      .replace(/_+(.)/g, (_match, letter) => letter.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1_$2');
  }

  public generateEnum(
    values: string[],
    enumName: string,
    convention: EnumNamingConvention,
  ): string {
    const enumEntries = values.map((value) => ({
      name: this.formatEnumMember(value, convention),
      value,
    }));
    const lines = [
      `export enum ${enumName} {`,
      ...enumEntries.map((entry) => `  ${entry.name} = '${entry.value}'`),
      '}',
    ];
    return lines.join('\n');
  }

  public formatEnumMember(value: string, convention: EnumNamingConvention): string {
    switch (convention) {
      case 'PascalCase':
        return this.toPascalCase(value);
      case 'UPPER_CASE':
        return this.toUpperCaseSnake(value);
      case 'camelCase':
        return this.toCamelCase(value);
      default:
        return this.convertToEnumValueName(value);
    }
  }

  private toPascalCase(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .replace(/\s/g, '');
  }

  private toUpperCaseSnake(value: string): string {
    return this.convertToEnumValueName(value).toUpperCase();
  }

  private toCamelCase(value: string): string {
    const pascalCase = this.toPascalCase(value);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  public extractUnionValues(selectedText: string): string[] {
    // Extract all quoted strings from the selection
    const values = selectedText.match(/"[^"]+"/g);
    return values ? values.map((v) => v.slice(1, -1)) : [];
  }
}
