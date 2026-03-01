import {render, screen, fireEvent} from '@testing-library/react'
import {describe, it, expect} from 'vitest'
import {SizeAnalyzer} from '../SizeAnalyzer'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import React from 'react'

const mockAssets = [
  {
    _id: 'asset-1',
    _type: 'sanity.imageAsset',
    url: 'https://example.com/small.jpg',
    originalFilename: 'small.jpg',
    size: 1024, // 1 KB
    extension: 'jpg',
    mimeType: 'image/jpeg',
    metadata: {dimensions: {width: 10, height: 10}},
  },
  {
    _id: 'asset-2',
    _type: 'sanity.imageAsset',
    url: 'https://example.com/medium.jpg',
    originalFilename: 'medium.jpg',
    size: 512000, // ~500 KB
    extension: 'jpg',
    mimeType: 'image/jpeg',
    metadata: {dimensions: {width: 100, height: 100}},
  },
  {
    _id: 'asset-3',
    _type: 'sanity.imageAsset',
    url: 'https://example.com/large.jpg',
    originalFilename: 'large.jpg',
    size: 2048576, // 2 MB
    extension: 'jpg',
    mimeType: 'image/jpeg',
    metadata: {dimensions: {width: 1000, height: 1000}},
  },
]

describe('SizeAnalyzer', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  it('renders correctly with multiple assets', () => {
    renderWithTheme(<SizeAnalyzer assets={mockAssets} />)

    expect(screen.getByText('small.jpg')).toBeDefined()
    expect(screen.getByText('medium.jpg')).toBeDefined()
    expect(screen.getByText('large.jpg')).toBeDefined()
  })

  it('sorts assets by size correctly', () => {
    renderWithTheme(<SizeAnalyzer assets={mockAssets} />)

    // Initially descending by default
    // We expect large first, then medium, then small
    const renderedNames = screen.getAllByText(/jpg$/).map((el) => el.textContent)
    expect(renderedNames).toEqual(['large.jpg', 'medium.jpg', 'small.jpg'])
  })

  it('toggles sort order', () => {
    renderWithTheme(<SizeAnalyzer assets={mockAssets} />)

    const sortButton = screen.getByTitle(/Sort by weight/)
    fireEvent.click(sortButton)

    // Now should be ascending
    const renderedNames = screen.getAllByText(/jpg$/).map((el) => el.textContent)
    expect(renderedNames).toEqual(['small.jpg', 'medium.jpg', 'large.jpg'])
  })
})
