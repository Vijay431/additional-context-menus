import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the mock module so we can spy on it
import * as vscode from 'vscode';
import { CronJobTimerGeneratorService } from '../../src/services/cronJobTimerGeneratorService';

beforeEach(() => {
  (CronJobTimerGeneratorService as any).instance = undefined;
  vi.restoreAllMocks();
  // Reset window state
  (vscode.window as any).showErrorMessage = vi.fn();
  (vscode.window as any).showInformationMessage = vi.fn();
  (vscode.window as any).showQuickPick = vi.fn();
  (vscode.window as any).activeTextEditor = undefined;
});

describe('CronJobTimerGeneratorService.generateCronExpression', () => {
  it('should return without error when QuickPick is dismissed', async () => {
    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined as any);

    const service = CronJobTimerGeneratorService.getInstance();
    await expect(service.generateCronExpression()).resolves.toBeUndefined();
  });

  it('should show error when no active editor and a schedule is selected', async () => {
    const fakeItem = { label: 'Every minute', value: '* * * * *', description: 'Run every minute' };
    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(fakeItem as any);
    const errorSpy = vi
      .spyOn(vscode.window, 'showErrorMessage')
      .mockResolvedValue(undefined as any);
    (vscode.window as any).activeTextEditor = undefined;

    const service = CronJobTimerGeneratorService.getInstance();
    await service.generateCronExpression();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('No active editor'));
  });

  it('should insert cron expression into editor when a preset is selected', async () => {
    const fakeItem = {
      label: 'Every hour',
      value: '0 * * * *',
      description: 'Run at minute 0 of every hour',
    };
    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(fakeItem as any);

    const editBuilderInsert = vi.fn();
    const fakeEditor = {
      selection: { active: { line: 0, character: 0 } },
      edit: vi.fn((cb: (eb: any) => void) => {
        cb({ insert: editBuilderInsert });
        return Promise.resolve(true);
      }),
    };
    (vscode.window as any).activeTextEditor = fakeEditor;
    vi.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined as any);

    const service = CronJobTimerGeneratorService.getInstance();
    await service.generateCronExpression();

    expect(editBuilderInsert).toHaveBeenCalledWith(fakeEditor.selection.active, '0 * * * *');
  });

  it('should not insert when custom is selected and user cancels input', async () => {
    const customItem = {
      label: 'Custom schedule',
      value: 'custom',
      description: 'Define your own schedule',
    };
    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(customItem as any);
    vi.spyOn(vscode.window, 'showInputBox' as any).mockResolvedValue(undefined);

    const fakeEditor = { selection: { active: { line: 0, character: 0 } }, edit: vi.fn() };
    (vscode.window as any).activeTextEditor = fakeEditor;

    const service = CronJobTimerGeneratorService.getInstance();
    await service.generateCronExpression();

    expect(fakeEditor.edit).not.toHaveBeenCalled();
  });
});
