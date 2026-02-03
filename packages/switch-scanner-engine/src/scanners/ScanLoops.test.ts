import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { createConfig, createSurface } from './test-utils';

describe('Scan loops', () => {
  it('stops after configured loops', () => {
    const { surface } = createSurface(2, 2);
    const configManager = createConfig({ scanLoops: 1, scanRate: 10 });
    const scanner = new LinearScanner(surface, configManager.provider, {});

    vi.useFakeTimers();
    scanner.start();
    vi.advanceTimersByTime(100);
    expect(scanner['isRunning']).toBe(false);
    vi.useRealTimers();
  });
});
