import * as path from 'node:path';

import * as vscode from 'vscode';

/**
 * Accessibility Helper Utilities
 *
 * Utility functions for creating accessible UI components and announcements.
 * Provides centralized accessibility helpers for consistent behavior.
 *
 * @description
 * These utilities help create accessible QuickPick items, InputBox prompts,
 * and screen reader announcements throughout the extension.
 *
 * Key Functions:
 * - getAccessibleLabel: Generate informative ARIA labels
 * - announceToScreenReader: Use accessibility API for announcements
 * - formatAccessiblePlaceholder: Create accessible placeholder text with counts
 * - getAccessibleQuickPickItem: Wrap QuickPick items with accessibility properties
 * - formatAccessibleInputPrompt: Create accessible InputBox prompts
 *
 * Use Cases:
 * - Adding ARIA labels to QuickPick items
 * - Creating accessible placeholder text with item counts
 * - Making screen reader announcements
 * - Formatting accessible InputBox prompts
 *
 * @category Accessibility
 * @subcategory Utilities
 *
 * @author Vijay Gangatharan <vijayanand431@gmail.com>
 * @since 2.1.0
 */

/**
 * Generate an informative ARIA label for a QuickPick item
 * Combines label, description, and detail into a single accessible label
 *
 * @param label - The primary label text
 * @param description - Optional description text
 * @param detail - Optional detail text
 * @returns A comprehensive ARIA label for screen readers
 *
 * @example
 * const label = getAccessibleLabel('Save All', 'Save all open files', '3 files');
 * // Returns: "Save All. Save all open files. 3 files"
 */
export function getAccessibleLabel(label: string, description?: string, detail?: string): string {
  const parts = [label];

  if (description) {
    parts.push(description);
  }

  if (detail) {
    parts.push(detail);
  }

  return parts.join('. ');
}

/**
 * Announce a message to screen readers using VS Code's accessibility API
 *
 * @param message - The message to announce
 * @param _priority - Whether this is a priority announcement (errors, critical info)
 * @returns Promise that resolves when announcement is made
 *
 * @example
 * await announceToScreenReader('File saved successfully');
 * await announceToScreenReader('Error: File not found', true);
 */
export async function announceToScreenReader(message: string, _priority = false): Promise<void> {
  try {
    const vsCodeAny = vscode as unknown as {
      accessibility?: { announce(msg: string): Promise<void> };
    };
    if (vsCodeAny.accessibility) {
      await vsCodeAny.accessibility.announce(message);
    }
  } catch (error) {
    console.error('Failed to announce to screen reader:', error);
  }
}

/**
 * Create accessible placeholder text with item count
 * Helps screen reader users understand scope of a selection
 *
 * @param baseText - The base placeholder text
 * @param count - The number of items available
 * @returns Accessible placeholder with count information
 *
 * @example
 * const placeholder = formatAccessiblePlaceholder('Select file', 15);
 * // Returns: "Select file (15 items available)"
 */
export function formatAccessiblePlaceholder(baseText: string, count: number): string {
  if (count === 0) {
    return `${baseText} (no items available)`;
  }

  if (count === 1) {
    return `${baseText} (1 item available)`;
  }

  return `${baseText} (${count} items available)`;
}

/**
 * Create a QuickPick item with proper accessibility attributes
 *
 * @param item - The base QuickPick item
 * @param options - Accessibility options
 * @returns QuickPick item with accessibility properties
 *
 * @example
 * const item = getAccessibleQuickPickItem({
 *   label: 'Save All',
 *   description: 'Save all modified files'
 * }, {
 *   ariaLabel: 'Save all modified files in workspace',
 *   ariaDescription: 'Saves all unsaved changes'
 * });
 */
export function getAccessibleQuickPickItem<T = unknown>(
  item: vscode.QuickPickItem & { value?: T } & Record<string, unknown>,
  options: {
    ariaLabel?: string;
    ariaDescription?: string;
  } = {},
): vscode.QuickPickItem & { value?: T } & Record<string, unknown> {
  return {
    ...item,
    ariaLabel: options.ariaLabel ?? item.label,
    ariaDescription: options.ariaDescription ?? item.description,
  };
}

/**
 * Create accessible QuickPick items from an array
 * Automatically generates ARIA labels and descriptions
 *
 * @param items - Array of QuickPick items
 * @param itemType - Optional type description for ARIA labels (e.g., "file", "command")
 * @returns Array of QuickPick items with accessibility properties
 *
 * @example
 * const files = [{ label: 'file1.ts', description: 'src' }];
 * const accessibleItems = getAccessibleQuickPickItems(files, 'file');
 */
export function getAccessibleQuickPickItems<T = unknown>(
  items: (vscode.QuickPickItem & { value?: T })[],
  itemType?: string,
): (vscode.QuickPickItem & { value?: T })[] {
  return items.map((item, index) => {
    const ariaLabel = itemType
      ? `${item.label}. ${item.description ?? ''}. ${itemType} ${index + 1} of ${items.length}`
      : item.label;

    return {
      ...item,
      ariaLabel,
      ariaDescription: item.description,
    };
  });
}

/**
 * Format an accessible InputBox prompt with clear instructions
 *
 * @param prompt - The primary prompt text
 * @param validationHint - Optional hint about validation requirements
 * @returns Formatted prompt string
 *
 * @example
 * const prompt = formatAccessibleInputPrompt('Enter file name', 'Must start with a dot');
 * // Returns: "Enter file name. Validation: Must start with a dot"
 */
export function formatAccessibleInputPrompt(prompt: string, validationHint?: string): string {
  if (!validationHint) {
    return prompt;
  }

  return `${prompt}. Validation: ${validationHint}`;
}

/**
 * Create an accessible validation message for InputBox
 * Provides clear, actionable feedback for screen reader users
 *
 * @param isValid - Whether the input is valid
 * @param errorMessage - The error message if invalid
 * @param successMessage - Optional success message
 * @returns Validation message string or undefined
 *
 * @example
 * const validation = createAccessibleValidationMessage(false, 'Name cannot be empty');
 * // Returns: "Error: Name cannot be empty"
 */
export function createAccessibleValidationMessage(
  isValid: boolean,
  errorMessage?: string,
  successMessage?: string,
): string | undefined {
  if (isValid) {
    return successMessage;
  }

  if (errorMessage) {
    return `Error: ${errorMessage}`;
  }

  return undefined;
}

/**
 * Generate a keyboard navigation hint for QuickPick items
 *
 * @param hasMoreItems - Whether there are more items below
 * @param currentIndex - Current item index (optional)
 * @param totalItems - Total number of items (optional)
 * @returns Keyboard navigation hint string
 */
export function getKeyboardNavigationHint(
  hasMoreItems: boolean,
  currentIndex?: number,
  totalItems?: number,
): string {
  const hints = ['Use arrow keys to navigate'];

  if (currentIndex !== undefined && totalItems !== undefined) {
    hints.push(`Item ${currentIndex + 1} of ${totalItems}`);
  }

  if (hasMoreItems) {
    hints.push('Press Enter to select, Escape to cancel');
  }

  return hints.join('. ');
}

/**
 * Create an accessible description for file list items
 * Combines file name, directory, and modification info
 *
 * @param fileName - The file name
 * @param relativePath - The relative path from workspace root
 * @param lastModified - Optional last modified date
 * @returns Accessible description string
 *
 * @example
 * const desc = createAccessibleFileDescription('component.ts', 'src/components', date);
 * // Returns: "component.ts in src/components, last modified 2 hours ago"
 */
export function createAccessibleFileDescription(
  fileName: string,
  relativePath: string,
  lastModified?: Date,
): string {
  const directory = path.dirname(relativePath);
  const parts = [`${fileName} in ${directory}`];

  if (lastModified) {
    const now = new Date();
    const diffMs = now.getTime() - lastModified.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeAgo: string;
    if (diffMins < 1) {
      timeAgo = 'just now';
    } else if (diffMins < 60) {
      timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    parts.push(`last modified ${timeAgo}`);
  }

  return parts.join(', ');
}

/**
 * Truncate text for accessibility while preserving meaning
 * Ensures labels are not too long for screen readers
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default 100)
 * @param suffix - Suffix to add when truncated (default "...")
 * @returns Truncated text
 */
export function truncateForAccessibility(text: string, maxLength = 100, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}
