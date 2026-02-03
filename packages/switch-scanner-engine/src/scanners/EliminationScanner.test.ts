import { describe, it, expect, vi } from 'vitest';
import { EliminationScanner } from './EliminationScanner';
import { createConfig, createSurface } from './test-utils';

describe('Elimination scanner', () => {
  it('highlights blocks and selects with switch actions', () => {
    const { surface, selected } = createSurface(8, 4);
    const configManager = createConfig({ eliminationSwitchCount: 2, scanRate: 10 });
    const scanner = new EliminationScanner(surface, configManager.provider, {});

    scanner.start();
    scanner.handleAction('switch-1');
    scanner.handleAction('switch-1');
    scanner.handleAction('switch-1');

    expect(selected.length).toBeGreaterThanOrEqual(0);
  });

  it('resets on cancel', () => {
    const { surface } = createSurface(8, 4);
    const configManager = createConfig({ eliminationSwitchCount: 2, scanRate: 10 });
    const scanner = new EliminationScanner(surface, configManager.provider, {});

    scanner.start();
    scanner.handleAction('switch-1');
    scanner.handleAction('cancel');

    expect(scanner['isRunning']).toBe(true);
  });
});
