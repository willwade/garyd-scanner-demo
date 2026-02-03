import { describe, it, expect, vi } from 'vitest';
import { LinearScanner } from './LinearScanner';
import { createConfig, createSurface } from './test-utils';

describe('Scan direction', () => {
  it('circular loops forward', () => {
    const { surface } = createSurface(3, 3);
    const configManager = createConfig({ scanDirection: 'circular', scanRate: 10 });
    const scanner = new LinearScanner(surface, configManager.provider, {});
    vi.useFakeTimers();
    scanner.start();
    vi.advanceTimersByTime(40);
    expect((surface.setFocus as any).mock.calls.length).toBeGreaterThan(0);
    scanner.stop();
    vi.useRealTimers();
  });

  it('reverse starts from end', () => {
    const { surface } = createSurface(4, 2);
    const configManager = createConfig({ scanDirection: 'reverse', scanRate: 10 });
    const scanner = new LinearScanner(surface, configManager.provider, {});
    vi.useFakeTimers();
    scanner.start();
    vi.advanceTimersByTime(20);
    const calls = (surface.setFocus as any).mock.calls.filter((call: any) => call[0]?.length);
    const firstCall = calls[0]?.[0]?.[0];
    expect(firstCall).toBe(3);
    scanner.stop();
    vi.useRealTimers();
  });
});
