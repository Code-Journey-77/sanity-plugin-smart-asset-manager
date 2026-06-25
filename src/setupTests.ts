import '@testing-library/jest-dom'
import {vi} from 'vitest'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn().mockImplementation((cb) => setTimeout(cb, 0)),
)
vi.stubGlobal(
  'cancelAnimationFrame',
  vi.fn().mockImplementation((id) => clearTimeout(id)),
)

vi.stubGlobal(
  'IntersectionObserver',
  class IntersectionObserver {
    root: Element | Document | null = null
    rootMargin: string = ''
    thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  },
)
