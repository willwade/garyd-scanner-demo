import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { OverscanState } from '../Scanner';
import { createConfig, createSurface } from './test-utils';

describe('Critical Overscan Feature', () => {
  it('transitions from fast to slow_backward on first select', () => {
    const { surface } = createSurface(5, 5);
    const configManager = createConfig({
      scanInputMode: 'manual',
      criticalOverscan: { enabled: true, fastRate: 50, slowRate: 200 },
    });
    const scanner = new LinearScanner(surface, configManager.provider, {});

    scanner.start();
    expect(scanner['overscanState']).toBe(OverscanState.FAST);
    scanner.handleAction('select');
    expect(scanner['overscanState']).toBe(OverscanState.SLOW_BACKWARD);
  });

  it('triggers selection on second select', () => {
    const { surface, selected } = createSurface(5, 5);
    const configManager = createConfig({
      scanInputMode: 'manual',
      criticalOverscan: { enabled: true, fastRate: 50, slowRate: 200 },
    });
    const scanner = new LinearScanner(surface, configManager.provider, {});

    scanner.start();
    scanner.handleAction('step');
    scanner.handleAction('select');
    scanner.handleAction('select');
    expect(selected.length).toBe(1);
  });

  it('selects immediately when overscan disabled', () => {
    const { surface, selected } = createSurface(5, 5);
    const configManager = createConfig({
      scanInputMode: 'manual',
      criticalOverscan: { enabled: false, fastRate: 50, slowRate: 200 },
    });
    const scanner = new LinearScanner(surface, configManager.provider, {});

    scanner.start();
    scanner.handleAction('step');
    scanner.handleAction('select');
    expect(selected.length).toBe(1);
  });
});
