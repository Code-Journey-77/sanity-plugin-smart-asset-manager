/**
 * Compresses JPEG/WebP images using HTML5 Canvas resizing and JPEG quality encoding.
 * Skips PNGs to preserve transparency.
 */
export function compressImageIfNeeded(file: File, maxSizeMB = 1.5, quality = 0.82): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(file)
  }

  // Skip PNGs as canvas.toBlob for PNG is lossless and doesn't reduce size much,
  // and converting PNG to JPEG would destroy transparency.
  if (file.type === 'image/png') {
    return Promise.resolve(file)
  }

  // If already smaller than threshold, do not compress
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return Promise.resolve(file)
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Downscale image if it exceeds typical web-friendly max resolution
        const MAX_WIDTH = 2048
        const MAX_HEIGHT = 2048
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          } else {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          file.type,
          quality,
        )
      }
      img.onerror = () => resolve(file)
      img.src = event.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
