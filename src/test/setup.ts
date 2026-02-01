import { afterEach, vi } from 'vitest';

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URLSearchParams
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    search: '',
    pathname: '/',
  },
});

// Clear DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
});
