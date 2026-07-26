import {render, screen, fireEvent} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'
import {AssetListView} from '../AssetListView'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import React from 'react'

const mockAssets = [
  {
    _id: 'asset-1',
    _type: 'sanity.imageAsset' as const,
    url: 'https://example.com/test1.jpg',
    originalFilename: 'test1.jpg',
    size: 1024,
    extension: 'jpg',
    mimeType: 'image/jpeg',
    metadata: {dimensions: {width: 800, height: 600}},
  },
  {
    _id: 'asset-2',
    _type: 'sanity.fileAsset' as const,
    url: 'https://example.com/doc.pdf',
    originalFilename: 'doc.pdf',
    size: 2048576,
    extension: 'pdf',
    mimeType: 'application/pdf',
  },
]

describe('AssetListView', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  it('renders assets in list view correctly with metadata', () => {
    renderWithTheme(<AssetListView assets={mockAssets} onClick={vi.fn()} />)

    expect(screen.getByText('test1.jpg')).toBeDefined()
    expect(screen.getByText('doc.pdf')).toBeDefined()
    expect(screen.getByText('800×600')).toBeDefined()
  })

  it('triggers onClick when a row is clicked', () => {
    const handleClick = vi.fn()
    renderWithTheme(<AssetListView assets={mockAssets} onClick={handleClick} />)

    fireEvent.click(screen.getByText('test1.jpg'))
    expect(handleClick).toHaveBeenCalledWith(mockAssets[0])
  })

  it('handles row selection when checkboxes are used', () => {
    const handleSelect = vi.fn()
    renderWithTheme(
      <AssetListView
        assets={mockAssets}
        onClick={vi.fn()}
        selectedIds={['asset-1']}
        onSelect={handleSelect}
      />,
    )

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })
})
