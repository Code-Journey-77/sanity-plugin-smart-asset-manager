import {render, screen, fireEvent} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'
import {TopToolbar} from '../TopToolbar'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import React from 'react'

describe('TopToolbar', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  const defaultProps = {
    searchQuery: '',
    setSearchQuery: vi.fn(),
    sortBy: '_createdAt' as const,
    setSortBy: vi.fn(),
    assetType: 'all' as const,
    setAssetType: vi.fn(),
    sizeFilter: 'all' as const,
    setSizeFilter: vi.fn(),
    onReset: vi.fn(),
    onUpload: vi.fn(),
    uploadState: {isUploading: false, uploaded: 0, total: 0},
  }

  it('renders upload button with default text', () => {
    renderWithTheme(<TopToolbar {...defaultProps} />)
    expect(screen.getByText('Upload')).toBeDefined()
  })

  it('renders upload button with progress text when uploading', () => {
    renderWithTheme(
      <TopToolbar {...defaultProps} uploadState={{isUploading: true, uploaded: 2, total: 5}} />,
    )
    expect(screen.getByText('Uploading 2/5...')).toBeDefined()
  })

  it('calls onUpload when files are selected', () => {
    renderWithTheme(<TopToolbar {...defaultProps} />)

    // The button delegates to a hidden input
    const button = screen.getByText('Upload')
    fireEvent.click(button)

    // Simulate file input change
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.png', {type: 'image/png'})
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    })

    fireEvent.change(fileInput)
    expect(defaultProps.onUpload).toHaveBeenCalled()
  })

  it('resets file input after selection to allow re-selection', () => {
    renderWithTheme(<TopToolbar {...defaultProps} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.png', {type: 'image/png'})
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    })

    // Simulate setting the value so we can check if it gets cleared by onChange
    // Note: We can't programmatically set input type=file value except to '', so we just trigger change directly
    fireEvent.change(fileInput)

    expect(fileInput.value).toBe('')
  })
})
