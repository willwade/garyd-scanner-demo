import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { createConfig, createSurface } from './test-utils';

describe('Initial item pause', () => {
  it('uses initialItemPause for first step', () => {
    const { surface } = createSurface(4, 2);
    const configManager = createConfig({
      scanInputMode: 'auto',
      scanRate: 100,
      initialItemPause: 300,
    });
    const scanner = new LinearScanner(surface, configManager.provider, {});

    vi.useFakeTimers();
    scanner.start();
    vi.advanceTimersByTime(150);
    const nonEmptyBefore = (surface.setFocus as any).mock.calls.filter((call: any) => call[0]?.length).length;
    expect(nonEmptyBefore).toBe(0);
    vi.advanceTimersByTime(200);
    const nonEmptyAfter = (surface.setFocus as any).mock.calls.filter((call: any) => call[0]?.length).length;
    expect(nonEmptyAfter).toBeGreaterThan(0);
    scanner.stop();
    vi.useRealTimers();
  });
});
