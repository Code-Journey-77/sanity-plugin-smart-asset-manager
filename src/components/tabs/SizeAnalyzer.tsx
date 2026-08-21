import {AudioIcon, DocumentsIcon, ResetIcon, SearchIcon, SortIcon} from '@/components/common/Icons'
import {SizeAnalyzerSkeleton} from '@/components/common/Skeleton'
import type {Asset, AssetTypeFilter, SizeFilter} from '@/types'
import {fetchAllAssets} from '@/utils/assetQueries'
import {formatBytes} from '@/utils/formatBytes'
import {Badge, Box, Button, Card, Flex, Heading, Select, Stack, Text, TextInput} from '@sanity/ui'
import React, {useEffect, useMemo, useState} from 'react'
import type {SanityClient} from 'sanity'
import * as Sanity from 'sanity'
import styled from 'styled-components'

const TableCard = styled(Card)`
  border: 1px solid var(--card-border-color);
`

const TableHeader = styled(Box)`
  border-bottom: 1px solid var(--card-border-color);
  background-color: var(--card-bg-color);
`

const TableRow = styled(Flex)<{$isLast?: boolean}>`
  border-bottom: ${(props) => (props.$isLast ? 'none' : '1px solid var(--card-border-color)')};
  transition: background 0.2s ease;
  cursor: pointer;

  &:hover {
    background: var(--card-bg-color);
    filter: brightness(0.96);
  }
`

const Thumbnail = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  background-color: var(--card-border-color);
  border: 1px solid var(--card-border-color);
`

const ListVideoPreview = styled.video`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  background: #000;
  border: 1px solid var(--card-border-color);
`

const ListIframeWrapper = styled(Box)`
  width: 48px;
  height: 48px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid var(--card-border-color);
`

const ListIframePreview = styled.iframe`
  width: 140%;
  height: 140%;
  position: absolute;
  top: -20%;
  left: -20%;
  border: none;
  pointer-events: none;
  background: #ffffff;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
`

const IconBox = styled(Box)`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-border-color);
  border-radius: 4px;
`

const SearchBox = styled(Box)`
  flex: 1;
`

const FilterBox = styled(Box)`
  width: 130px;
`

interface SizeAnalyzerProps {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
}

export const SizeAnalyzer: React.FC<SizeAnalyzerProps> = ({
  assets: initialAssets,
  onAssetClick,
}) => {
  const [allAssets, setAllAssets] = useState<Asset[]>(initialAssets)
  const [loadingAll, setLoadingAll] = useState(false)

  useEffect(() => {
    setAllAssets(initialAssets)
  }, [initialAssets])

  let client: SanityClient | null = null
  try {
    client = Sanity?.useClient?.({apiVersion: '2026-07-28'})
  } catch (e) {
    // client unavailable in test environment without Sanity context
  }

  useEffect(() => {
    if (!client) return
    let isMounted = true
    async function loadAll() {
      setLoadingAll(true)
      try {
        const fetched = await fetchAllAssets(client as SanityClient)
        if (isMounted && fetched && fetched.length > 0) {
          setAllAssets(fetched)
        }
      } catch (err) {
        console.error('Error fetching all assets for size analyzer:', err)
      } finally {
        if (isMounted) {
          setLoadingAll(false)
        }
      }
    }
    loadAll()
    return () => {
      isMounted = false
    }
  }, [client])

  const [searchQuery, setSearchQuery] = useState('')
  const [assetType, setAssetType] = useState<AssetTypeFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [sortField, setSortField] = useState<'size' | 'name' | 'dimensions'>('size')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const filteredAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      // Type filter
      if (assetType === 'image' && asset._type !== 'sanity.imageAsset') return false
      if (assetType === 'video' && !asset.mimeType?.startsWith('video/')) return false
      if (assetType === 'audio' && !asset.mimeType?.startsWith('audio/')) return false
      if (
        assetType === 'file' &&
        (asset._type === 'sanity.imageAsset' ||
          asset.mimeType?.startsWith('video/') ||
          asset.mimeType?.startsWith('audio/'))
      )
        return false

      // Size filter
      if (sizeFilter === 'small' && asset.size >= 102400) return false
      if (sizeFilter === 'medium' && (asset.size < 102400 || asset.size >= 1048576)) return false
      if (sizeFilter === 'large' && asset.size < 1048576) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (asset.originalFilename || asset._id).toLowerCase()
        const ext = (asset.extension || '').toLowerCase()
        if (!name.includes(q) && !ext.includes(q)) return false
      }

      return true
    })
  }, [allAssets, assetType, sizeFilter, searchQuery])

  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let comparison = 0
      if (sortField === 'size') {
        comparison = a.size - b.size
      } else if (sortField === 'name') {
        const nameA = a.originalFilename || a._id
        const nameB = b.originalFilename || b._id
        comparison = nameA.localeCompare(nameB)
      } else if (sortField === 'dimensions') {
        const dimA = (a.metadata?.dimensions?.width || 0) * (a.metadata?.dimensions?.height || 0)
        const dimB = (b.metadata?.dimensions?.width || 0) * (b.metadata?.dimensions?.height || 0)
        comparison = dimA - dimB
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [filteredAssets, sortField, sortOrder])

  const handleReset = () => {
    setSearchQuery('')
    setAssetType('all')
    setSizeFilter('all')
    setSortField('size')
    setSortOrder('desc')
  }

  const toggleSort = (field: 'size' | 'name' | 'dimensions') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between">
        <Heading size={1}>Asset Size & Weight Analyzer</Heading>
        <Text size={1} muted>
          Showing {sortedAssets.length} of {allAssets.length} assets
        </Text>
      </Flex>

      {/* Filter Toolbar */}
      <Card padding={3} border radius={2}>
        <Flex align="center" gap={3} wrap="wrap">
          <SearchBox>
            <TextInput
              icon={SearchIcon}
              placeholder="Filter by name or extension..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              fontSize={1}
            />
          </SearchBox>
          <FilterBox>
            <Select
              fontSize={1}
              value={assetType}
              onChange={(e) => setAssetType(e.currentTarget.value as AssetTypeFilter)}
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="file">Other Files</option>
            </Select>
          </FilterBox>
          <FilterBox>
            <Select
              fontSize={1}
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.currentTarget.value as SizeFilter)}
            >
              <option value="all">All Sizes</option>
              <option value="small">&lt; 100 KB</option>
              <option value="medium">100KB - 1MB</option>
              <option value="large">&gt; 1MB</option>
            </Select>
          </FilterBox>
          <Button icon={ResetIcon} mode="ghost" onClick={handleReset} title="Reset filters" />
        </Flex>
      </Card>

      <TableCard border radius={2}>
        <TableHeader padding={3}>
          <Flex align="center" gap={3}>
            <Box style={{width: '52px'}}>
              <Text size={1} weight="bold">
                Preview
              </Text>
            </Box>
            <Box style={{flex: 2}}>
              <Flex
                align="center"
                gap={1}
                style={{cursor: 'pointer'}}
                onClick={() => toggleSort('name')}
              >
                <Text size={1} weight="bold">
                  File Name
                </Text>
                <Button
                  icon={SortIcon}
                  mode="bleed"
                  padding={1}
                  fontSize={1}
                  style={{
                    opacity: sortField === 'name' ? 1 : 0.4,
                    transform:
                      sortField === 'name' && sortOrder === 'asc' ? 'rotate(180deg)' : 'none',
                  }}
                />
              </Flex>
            </Box>
            <Box style={{width: '130px'}}>
              <Flex
                align="center"
                gap={1}
                style={{cursor: 'pointer'}}
                onClick={() => toggleSort('dimensions')}
              >
                <Text size={1} weight="bold">
                  Dimensions
                </Text>
                <Button
                  icon={SortIcon}
                  mode="bleed"
                  padding={1}
                  fontSize={1}
                  style={{
                    opacity: sortField === 'dimensions' ? 1 : 0.4,
                    transform:
                      sortField === 'dimensions' && sortOrder === 'asc' ? 'rotate(180deg)' : 'none',
                  }}
                />
              </Flex>
            </Box>
            <Box style={{width: '140px'}}>
              <Flex
                align="center"
                gap={1}
                style={{cursor: 'pointer'}}
                onClick={() => toggleSort('size')}
              >
                <Text size={1} weight="bold">
                  Weight
                </Text>
                <Button
                  icon={SortIcon}
                  mode="bleed"
                  padding={1}
                  fontSize={1}
                  title={`Sort by weight ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
                  style={{
                    opacity: sortField === 'size' ? 1 : 0.4,
                    transform:
                      sortField === 'size' && sortOrder === 'asc' ? 'rotate(180deg)' : 'none',
                  }}
                />
              </Flex>
            </Box>
          </Flex>
        </TableHeader>

        {loadingAll && allAssets.length === 0 ? (
          <SizeAnalyzerSkeleton count={8} />
        ) : sortedAssets.length === 0 ? (
          <Box padding={5} style={{textAlign: 'center'}}>
            <Text muted>No assets match the current analysis filters.</Text>
          </Box>
        ) : (
          sortedAssets.map((asset, i) => {
            const isImage = asset._type === 'sanity.imageAsset'
            const isVideo = asset?.mimeType?.startsWith('video/')
            const isAudio = asset?.mimeType?.startsWith('audio/')
            const isPdf = asset?.extension === 'pdf' || asset?.mimeType === 'application/pdf'
            const docExtensions = [
              'doc',
              'docx',
              'xls',
              'xlsx',
              'ppt',
              'pptx',
              'txt',
              'csv',
              'rtf',
              'odt',
            ]
            const isDoc =
              docExtensions.includes(asset?.extension?.toLowerCase() || '') ||
              Boolean(asset?.mimeType?.includes('word')) ||
              Boolean(asset?.mimeType?.includes('document')) ||
              Boolean(asset?.mimeType?.includes('excel')) ||
              Boolean(asset?.mimeType?.includes('sheet')) ||
              Boolean(asset?.mimeType?.includes('presentation'))
            return (
              <TableRow
                key={asset._id}
                padding={3}
                align="center"
                gap={3}
                $isLast={i === sortedAssets.length - 1}
                onClick={() => onAssetClick && onAssetClick(asset)}
              >
                <Box style={{width: '52px'}}>
                  {isImage ? (
                    <Thumbnail src={`${asset.url}?w=100&h=100&fit=crop`} alt="" />
                  ) : isVideo ? (
                    <ListVideoPreview src={asset.url} muted playsInline />
                  ) : isPdf ? (
                    <ListIframeWrapper>
                      <ListIframePreview
                        src={`${asset.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={asset.originalFilename || 'PDF Preview'}
                        {...({scrolling: 'no'} as Record<string, string>)}
                      />
                    </ListIframeWrapper>
                  ) : isDoc ? (
                    <ListIframeWrapper>
                      <ListIframePreview
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(asset.url)}&embedded=true`}
                        title={asset.originalFilename || 'Document Preview'}
                        {...({scrolling: 'no'} as Record<string, string>)}
                      />
                    </ListIframeWrapper>
                  ) : isAudio ? (
                    <IconBox>
                      <AudioIcon style={{fontSize: '20px', color: '#ef4444'}} />
                    </IconBox>
                  ) : (
                    <IconBox>
                      <DocumentsIcon style={{fontSize: '20px', color: '#9ca3af'}} />
                    </IconBox>
                  )}
                </Box>
                <Box style={{flex: 2}}>
                  <Text size={1} weight="semibold" textOverflow="ellipsis">
                    {asset.originalFilename || asset._id}
                  </Text>
                </Box>
                <Box style={{width: '130px'}}>
                  <Text size={1}>
                    {asset.metadata?.dimensions?.width
                      ? `${asset.metadata.dimensions.width} × ${asset.metadata.dimensions.height} px`
                      : '—'}
                  </Text>
                </Box>
                <Box style={{width: '140px'}}>
                  <Badge
                    tone={
                      asset.size > 1048576
                        ? 'critical'
                        : asset.size > 500000
                          ? 'caution'
                          : 'positive'
                    }
                  >
                    {formatBytes(asset.size)}
                  </Badge>
                </Box>
              </TableRow>
            )
          })
        )}
      </TableCard>
    </Stack>
  )
}
