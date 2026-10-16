import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface MenuContribution {
  command?: string;
  when?: string;
}

const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'),
) as {
  contributes: {
    menus: Record<string, MenuContribution[]>;
  };
};

describe('package contributions', () => {
  it('should hide Copy Function submenu item outside functions', () => {
    const submenuItems = packageJson.contributes.menus[
      'additionalContextMenus.submenu'
    ] as MenuContribution[];
    const copyFunctionItem = submenuItems.find(
      (item) => item.command === 'additionalContextMenus.copyFunction',
    );

    expect(copyFunctionItem?.when).toContain('additionalContextMenus.isInFunction');
  });
});
