import {render, screen, fireEvent, waitFor, act} from '@testing-library/react'
import {describe, it, expect, vi, beforeEach} from 'vitest'
import {SmartAssetManagerTool} from '../SmartAssetManagerTool'
import {useClient} from 'sanity'
import {useToast, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useAssets} from '@/hooks/useAssets'
import {uploadFileWithProgress} from '@/utils/uploadWithProgress'
import React from 'react'

// Mock dependencies
vi.mock('sanity', () => ({
  useClient: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    useToast: vi.fn(),
  }
})

vi.mock('@/hooks/useAssets', () => ({
  useAssets: vi.fn(),
}))

vi.mock('@/utils/uploadWithProgress', () => ({
  uploadFileWithProgress: vi.fn(),
}))

// We need to mock TopToolbar to easily trigger the upload function
vi.mock('../TopToolbar', () => ({
  TopToolbar: ({onUpload, uploadState}: any) => (
    <div data-testid="mock-top-toolbar">
      <span data-testid="upload-state">{JSON.stringify(uploadState)}</span>
      <button
        data-testid="mock-upload-btn"
        onClick={() => {
          // Simulate uploading 2 mock files
          const files = [
            new File([''], 'test1.jpg', {type: 'image/jpeg'}),
            new File([''], 'test2.pdf', {type: 'application/pdf'}),
          ] as any
          onUpload(files)
        }}
      >
        Trigger Upload
      </button>
    </div>
  ),
}))

describe('SmartAssetManagerTool Upload Logic', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  const mockToastPush = vi.fn()
  const mockRefreshAssets = vi.fn()
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useToast as any).mockReturnValue({
      push: mockToastPush,
    })
    ;(useAssets as any).mockReturnValue({
      assets: [],
      loading: false,
      total: 0,
      refreshAssets: mockRefreshAssets,
    })
    ;(useClient as any).mockReturnValue({
      fetch: mockFetch,
      config: () => ({
        projectId: 'test-project',
        dataset: 'test-dataset',
        apiVersion: '2025-02-07',
        token: 'test-token',
      }),
    })
  })

  it('handles uploading concurrently and tracks progress', async () => {
    // 1. Setup mock resolves
    // No existing files (all new)
    mockFetch.mockResolvedValueOnce([])
    // Upload mock
    ;(uploadFileWithProgress as any).mockImplementation(
      (file: File, client: any, onProgress: any) => {
        onProgress({percent: 100})
        return Promise.resolve({
          _id: 'mock-id',
          _type: 'sanity.imageAsset',
          url: 'mock-url',
          originalFilename: file.name,
          size: file.size,
        })
      },
    )

    renderWithTheme(<SmartAssetManagerTool />)

    // Check initial state
    const uploadStateSpan = screen.getByTestId('upload-state')
    expect(uploadStateSpan.innerHTML).toContain('"isUploading":false')

    // Trigger upload
    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-upload-btn'))
    })

    // Assert that fetch was called to check duplicates
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
      filenames: ['test1.jpg', 'test2.pdf'],
    })

    // Wait for the sequential/concurrent batching to complete
    await waitFor(() => {
      expect(uploadFileWithProgress).toHaveBeenCalledTimes(2)
    })

    // Assert correct arguments passed
    expect(uploadFileWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({name: 'test1.jpg'}),
      expect.any(Object),
      expect.any(Function),
      expect.any(Object),
      expect.any(Boolean),
    )
    expect(uploadFileWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({name: 'test2.pdf'}),
      expect.any(Object),
      expect.any(Function),
      expect.any(Object),
      expect.any(Boolean),
    )

    // Ensure refresh was called
    expect(mockRefreshAssets).toHaveBeenCalled()

    // Ensure success toast was fired
    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          description: expect.stringContaining('Uploaded 2 file(s)'),
        }),
      )
    })
  })

  it('handles partial duplicate files cleanly', async () => {
    // Mock that test1.jpg already exists
    mockFetch.mockResolvedValueOnce(['test1.jpg'])
    ;(uploadFileWithProgress as any).mockResolvedValue({})

    renderWithTheme(<SmartAssetManagerTool />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-upload-btn'))
    })

    await waitFor(() => {
      // Should only upload the second file
      expect(uploadFileWithProgress).toHaveBeenCalledTimes(1)
      expect(uploadFileWithProgress).toHaveBeenCalledWith(
        expect.objectContaining({name: 'test2.pdf'}),
        expect.any(Object),
        expect.any(Function),
        expect.any(Object),
        expect.any(Boolean),
      )
    })

    // Ensure skip notification was correctly appended
    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          description: expect.stringContaining('Skipped 1 already-existing file(s)'),
        }),
      )
    })
  })

  it('reports warning if partial upload failure occurs', async () => {
    mockFetch.mockResolvedValueOnce([])
    // First upload succeeds, second upload fails
    ;(uploadFileWithProgress as any)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Network error'))

    renderWithTheme(<SmartAssetManagerTool />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-upload-btn'))
    })

    await waitFor(() => {
      expect(uploadFileWithProgress).toHaveBeenCalledTimes(2)
    })

    // Check warning toast for specific file
    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'warning',
          title: 'File upload failed',
          description: 'test2.pdf: Network error',
        }),
      )
    })

    // Final success toast should say 1 was uploaded (even though 2 were attempted)
    await waitFor(() => {
      expect(mockToastPush).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          title: 'Upload complete',
          description: expect.stringContaining('Uploaded 1 file(s)'),
        }),
      )
    })
  })
})
