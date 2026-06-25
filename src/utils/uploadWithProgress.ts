/**
 * Uploads a single file using a standard XMLHttpRequest to track progress.
 * Supports cancellation via an AbortSignal.
 */
import type {SanityClient} from 'sanity'

export interface UploadProgressEvent {
  percent: number
}

export interface UploadResult {
  _id: string
  _type: string
  url: string
  originalFilename: string
  size: number
}

export function uploadFileWithProgress(
  file: File,
  client: SanityClient,
  onProgress: (event: UploadProgressEvent) => void,
  signal?: AbortSignal,
  fastUpload?: boolean,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Bail immediately if already cancelled before we start
    if (signal?.aborted) {
      reject(new DOMException('Upload cancelled', 'AbortError'))
      return
    }

    const config = client.config()
    const {projectId, dataset, token} = config
    const type = file.type.startsWith('image/') ? 'images' : 'files'
    let url = `https://${projectId}.api.sanity.io/v1/assets/${type}/${dataset}?filename=${encodeURIComponent(file.name)}`

    if (fastUpload && type === 'images') {
      url += '&meta=exif'
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)

    // Automatically send session cookies for authentication
    xhr.withCredentials = true

    // Set authorization header if a token is present
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    // Set Content-Type of the file
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress({percent})
      }
    })

    // Handle complete
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          const result = response.document || response
          resolve(result)
        } catch (err) {
          reject(new Error('Failed to parse upload response'))
        }
      } else {
        let errorMsg = `Upload failed with status ${xhr.status}`
        try {
          const errRes = JSON.parse(xhr.responseText)
          if (errRes.message) {
            errorMsg = errRes.message
          }
        } catch {}
        reject(new Error(errorMsg))
      }
    })

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    // Handle abort
    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload cancelled', 'AbortError'))
    })

    // Wire up abort signal
    if (signal) {
      const abortHandler = () => {
        xhr.abort()
      }
      signal.addEventListener('abort', abortHandler)
      // Clean up event listener when finished
      const cleanup = () => {
        signal.removeEventListener('abort', abortHandler)
      }
      xhr.addEventListener('load', cleanup)
      xhr.addEventListener('error', cleanup)
      xhr.addEventListener('abort', cleanup)
    }

    // Send the binary data
    xhr.send(file)
  })
}
