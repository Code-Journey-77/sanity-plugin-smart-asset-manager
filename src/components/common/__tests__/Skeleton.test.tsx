import {render} from '@testing-library/react'
import {describe, it, expect} from 'vitest'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import React from 'react'
import {AssetGridSkeleton, AssetListSkeleton, SizeAnalyzerSkeleton} from '../Skeleton'

describe('Skeleton Loading Components', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={buildTheme()}>{ui}</ThemeProvider>)
  }

  it('renders AssetGridSkeleton correctly', () => {
    const {container} = renderWithTheme(<AssetGridSkeleton count={6} />)
    expect(container.firstChild).toBeDefined()
  })

  it('renders AssetListSkeleton correctly', () => {
    const {container} = renderWithTheme(<AssetListSkeleton count={4} />)
    expect(container.firstChild).toBeDefined()
  })

  it('renders SizeAnalyzerSkeleton correctly', () => {
    const {container} = renderWithTheme(<SizeAnalyzerSkeleton count={4} />)
    expect(container.firstChild).toBeDefined()
  })
})
