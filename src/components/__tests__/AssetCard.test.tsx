import {render, screen, fireEvent} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'
import {AssetCard} from '../AssetCard'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import React from 'react'

vi.mock('@/components/common/Icons', () => ({
  DocumentsIcon: () => <div data-testid="documents-icon" />,
  DownloadIcon: () => <div data-testid="download-icon" />,
  PdfIcon: () => <div data-testid="pdf-icon" />,
  AudioIcon: () => <div data-testid="audio-icon" />,
}))

const mockAsset = {
  _id: 'asset-1',
  _type: 'sanity.imageAsset',
  url: 'https://example.com/image.jpg',
  originalFilename: 'test-image.jpg',
  size: 1024,
  extension: 'jpg',
  mimeType: 'image/jpeg',
  metadata: {
    dimensions: {width: 100, height: 100},
  },
}

describe('AssetCard', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  it('renders correctly with image asset', () => {
    renderWithTheme(<AssetCard asset={mockAsset} onClick={vi.fn()} />)

    expect(screen.getByText('test-image.jpg')).toBeDefined()
    expect(screen.getByText('1 KB')).toBeDefined()
    const img = screen.getByAltText('test-image.jpg')
    expect(img).toBeDefined()

    expect(img.getAttribute('src')).toContain('w=400')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    renderWithTheme(<AssetCard asset={mockAsset} onClick={handleClick} />)

    fireEvent.click(screen.getByText('test-image.jpg'))
    expect(handleClick).toHaveBeenCalledWith(mockAsset)
  })

  it('shows checkbox when onSelect is provided', () => {
    const handleSelect = vi.fn()
    renderWithTheme(
      <AssetCard asset={mockAsset} onClick={vi.fn()} isSelected={false} onSelect={handleSelect} />,
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDefined()
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
  })
})
