import {describe, it, expect} from 'vitest'
import {formatBytes} from '../formatBytes'

describe('formatBytes', () => {
  it('should format 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('should format bytes correctly', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('should format KB correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(2048)).toBe('2 KB')
  })

  it('should format MB correctly', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('should format decimals correctly', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
