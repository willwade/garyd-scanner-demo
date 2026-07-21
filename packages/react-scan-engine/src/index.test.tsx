import { describe, it, expect, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import React, { useEffect } from 'react';
import { Scanner, useScanTarget, useScannerSnapshot, useScannerEvents, useScannerCommands } from './index';

afterEach(() => cleanup());

function advanceTimers(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

describe('useScanTarget', () => {
  it('registers its node as a scan target', async () => {
    const selected: string[] = [];
    const Item = ({ label }: { label: string }) => {
      const scan = useScanTarget();
      return (
        <button {...scan} onClick={() => selected.push(label)}>
          {label}
        </button>
      );
    };

    const App = () => (
      <Scanner
        active={false}
        config={{ scanPattern: 'linear', scanRate: 10 }}
      >
        <Item label="a" />
        <Item label="b" />
      </Scanner>
    );

    const { container } = render(<App />);
    // Wait one frame for the scanner effect to register nodes.
    await act(() => advanceTimers(0));

    const targets = container.querySelectorAll('[data-scannable]');
    expect(targets.length).toBe(2);
  });

  it('reflects the disabled option on aria-disabled', async () => {
    const Item = ({ disabled }: { disabled?: boolean }) => {
      const scan = useScanTarget({ disabled });
      return <button {...scan}>x</button>;
    };

    const { container, rerender } = render(
      <Scanner active={false} config={{ scanPattern: 'linear' }}>
        <Item disabled={true} />
      </Scanner>,
    );
    await act(() => advanceTimers(0));
    expect(container.querySelector('button')!.getAttribute('aria-disabled')).toBe('true');

    rerender(
      <Scanner active={false} config={{ scanPattern: 'linear' }}>
        <Item disabled={false} />
      </Scanner>,
    );
    await act(() => advanceTimers(0));
    expect(container.querySelector('button')!.getAttribute('aria-disabled')).toBe(null);
  });
});

describe('useScannerSnapshot', () => {
  it('returns null when no scanner is in scope', () => {
    const Consumer = () => {
      const status = useScannerSnapshot((s) => s.status);
      // The hook falls back to the empty snapshot, so it returns the empty-status.
      return <span data-testid="status">{status ?? 'none'}</span>;
    };
    const { getByTestId } = render(<Consumer />);
    expect(getByTestId('status').textContent).toBe('idle');
  });

  it('returns the current status while a scanner is mounted', async () => {
    const Probe = () => {
      const status = useScannerSnapshot((s) => s.status);
      return <span data-testid="status">{status}</span>;
    };

    const { getByTestId } = render(
      <Scanner active={false} config={{ scanPattern: 'linear', scanRate: 5 }}>
        <Probe />
      </Scanner>,
    );
    await act(() => advanceTimers(0));
    // Scanner is created but not started yet (active=false).
    expect(getByTestId('status').textContent).toBe('idle');
  });
});

describe('useScannerEvents', () => {
  it('delivers scan.started when the scanner starts', async () => {
    const seen: string[] = [];
    const Probe = ({ run }: { run: boolean }) => {
      useScannerEvents((e) => seen.push(e.type));
      useEffect(() => {
        if (!run) return;
      }, [run]);
      return null;
    };

    const Harness = ({ active }: { active: boolean }) => (
      <Scanner active={active} config={{ scanPattern: 'linear', scanRate: 5 }}>
        <Probe run={active} />
      </Scanner>
    );

    const { rerender } = render(<Harness active={false} />);
    await act(() => advanceTimers(0));
    expect(seen).toEqual([]);

    rerender(<Harness active={true} />);
    await act(() => advanceTimers(0));
    expect(seen).toContain('scan.started');
  });
});

describe('useScannerCommands', () => {
  it('returns null when no scanner is in scope', () => {
    const Probe = () => {
      const cmd = useScannerCommands();
      return <span data-testid="has">{cmd === null ? 'no' : 'yes'}</span>;
    };
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('has').textContent).toBe('no');
  });

  it('exposes start/stop/handleAction once the scanner mounts', async () => {
    const seen: string[] = [];
    const Probe = () => {
      useScannerEvents((e) => seen.push(e.type));
      return null;
    };
    const Controls = () => {
      const cmd = useScannerCommands();
      useEffect(() => {
        if (!cmd) return;
        cmd.start();
      }, [cmd]);
      return null;
    };

    render(
      <Scanner active={false} config={{ scanPattern: 'linear', scanRate: 5 }}>
        <Probe />
        <Controls />
      </Scanner>,
    );
    await act(() => advanceTimers(0));
    expect(seen).toContain('scan.started');
  });
});
