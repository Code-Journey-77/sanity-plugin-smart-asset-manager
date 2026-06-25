import {describe, it, expect} from 'vitest'
import {compressImageIfNeeded} from '../compressImage'

describe('compressImageIfNeeded', () => {
  it('should return non-image files as-is', async () => {
    const file = new File(['hello'], 'text.txt', {type: 'text/plain'})
    const result = await compressImageIfNeeded(file)
    expect(result).toBe(file)
  })

  it('should return PNG files as-is to preserve transparency', async () => {
    const file = new File(['png-data'], 'image.png', {type: 'image/png'})
    const result = await compressImageIfNeeded(file)
    expect(result).toBe(file)
  })

  it('should return small JPEG files as-is without compression', async () => {
    const file = new File(['jpeg-data'], 'image.jpg', {type: 'image/jpeg'})
    const result = await compressImageIfNeeded(file)
    expect(result).toBe(file)
  })
})
