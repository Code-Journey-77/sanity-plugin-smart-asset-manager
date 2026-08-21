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

// Polyfill DataTransfer for jsdom (not implemented natively)
class DataTransferItemList {
  private _files: File[] = []

  add(file: File) {
    this._files.push(file)
  }

  get length() {
    return this._files.length
  }

  [Symbol.iterator]() {
    return this._files[Symbol.iterator]()
  }
}

class DataTransferPolyfill {
  items: DataTransferItemList = new DataTransferItemList()

  get files(): FileList {
    const files = (this.items as unknown as {_files: File[]})._files
    return Object.assign(files, {
      item: (i: number) => files[i] ?? null,
    }) as unknown as FileList
  }
}

if (typeof globalThis.DataTransfer === 'undefined') {
  vi.stubGlobal('DataTransfer', DataTransferPolyfill)
}
