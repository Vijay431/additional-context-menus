import { describe, expect, it } from 'vitest';
import {
  createAccessibleFileDescription,
  createAccessibleValidationMessage,
  formatAccessibleInputPrompt,
  formatAccessiblePlaceholder,
  getAccessibleLabel,
  truncateForAccessibility,
} from '../../src/utils/accessibilityHelper';

describe('getAccessibleLabel', () => {
  it('should return the label only when no optional args are provided', () => {
    expect(getAccessibleLabel('Save All')).toBe('Save All');
  });

  it('should join label and description', () => {
    expect(getAccessibleLabel('Save All', 'Save all files')).toBe('Save All. Save all files');
  });

  it('should join label, description, and detail', () => {
    expect(getAccessibleLabel('Save All', 'Save all files', '3 files')).toBe(
      'Save All. Save all files. 3 files',
    );
  });

  it('should skip undefined description but include detail', () => {
    expect(getAccessibleLabel('Label', undefined, 'detail')).toBe('Label. detail');
  });
});

describe('formatAccessiblePlaceholder', () => {
  it('should return a no-items message for count 0', () => {
    expect(formatAccessiblePlaceholder('Select file', 0)).toBe('Select file (no items available)');
  });

  it('should return singular for count 1', () => {
    expect(formatAccessiblePlaceholder('Select file', 1)).toBe('Select file (1 item available)');
  });

  it('should return plural for count greater than 1', () => {
    expect(formatAccessiblePlaceholder('Select file', 5)).toBe('Select file (5 items available)');
  });
});

describe('formatAccessibleInputPrompt', () => {
  it('should return the prompt only when no validation hint is provided', () => {
    expect(formatAccessibleInputPrompt('Enter name')).toBe('Enter name');
  });

  it('should append the validation hint to the prompt', () => {
    expect(formatAccessibleInputPrompt('Enter name', 'Must not be empty')).toBe(
      'Enter name. Validation: Must not be empty',
    );
  });
});

describe('createAccessibleValidationMessage', () => {
  it('should return undefined when valid and no success message is provided', () => {
    expect(createAccessibleValidationMessage(true)).toBeUndefined();
  });

  it('should return the success message when valid', () => {
    expect(createAccessibleValidationMessage(true, undefined, 'Looks good')).toBe('Looks good');
  });

  it('should prefix the error message with "Error:"', () => {
    expect(createAccessibleValidationMessage(false, 'Name is empty')).toBe('Error: Name is empty');
  });

  it('should return undefined when invalid and no error message is provided', () => {
    expect(createAccessibleValidationMessage(false)).toBeUndefined();
  });
});

describe('createAccessibleFileDescription', () => {
  it('should include the file name and directory', () => {
    const result = createAccessibleFileDescription('index.ts', 'src/index.ts');
    expect(result).toContain('index.ts');
    expect(result).toContain('src');
  });

  it('should include "just now" for a very recent modification date', () => {
    const recent = new Date(Date.now() - 30000);
    const result = createAccessibleFileDescription('index.ts', 'src/index.ts', recent);
    expect(result).toContain('just now');
  });

  it('should show minutes ago for a modification a few minutes back', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000);
    const result = createAccessibleFileDescription('index.ts', 'src/index.ts', past);
    expect(result).toContain('minutes ago');
  });
});

describe('truncateForAccessibility', () => {
  it('should return text unchanged when within the limit', () => {
    expect(truncateForAccessibility('short text')).toBe('short text');
  });

  it('should truncate long text with an ellipsis', () => {
    const long = 'a'.repeat(110);
    const result = truncateForAccessibility(long);
    expect(result.length).toBe(100);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should respect a custom maxLength', () => {
    const result = truncateForAccessibility('hello world', 5);
    expect(result.length).toBe(5);
  });
});
