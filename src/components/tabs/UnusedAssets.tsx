import {AssetCard} from '@/components/AssetCard'
import {AssetListView} from '@/components/AssetListView'
import {GridIcon, ListIcon, ResetIcon, SearchIcon, TrashIcon} from '@/components/common/Icons'
import {AssetGridSkeleton, AssetListSkeleton} from '@/components/common/Skeleton'
import type {Asset, AssetTypeFilter, SizeFilter, ViewMode} from '@/types'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Heading,
  Select,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import React, {useMemo, useState} from 'react'
import styled from 'styled-components'

type UnusedSortOrder = 'date' | 'size_desc' | 'size_asc' | 'name_asc' | 'name_desc'

const SearchBox = styled(Box)`
  flex: 1;
`

const FilterBox = styled(Box)`
  width: 130px;
`

interface UnusedAssetsProps {
  unusedAssets: Asset[]
  onBulkDelete: (ids: string[]) => void
  onAssetClick: (asset: Asset) => void
  loading?: boolean
}

export const UnusedAssets: React.FC<UnusedAssetsProps> = ({
  unusedAssets,
  onBulkDelete,
  onAssetClick,
  loading = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [assetType, setAssetType] = useState<AssetTypeFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [sortBy, setSortBy] = useState<UnusedSortOrder>('date')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean; ids: string[]}>({
    show: false,
    ids: [],
  })

  // Filter unused assets
  const filteredUnused = useMemo(() => {
    return unusedAssets.filter((asset) => {
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

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (asset.originalFilename || asset._id).toLowerCase()
        const ext = (asset.extension || '').toLowerCase()
        if (!name.includes(q) && !ext.includes(q)) return false
      }

      return true
    })
  }, [unusedAssets, assetType, sizeFilter, searchQuery])

  // Sort filtered unused assets
  const sortedUnused = useMemo(() => {
    return [...filteredUnused].sort((a, b) => {
      if (sortBy === 'size_desc') return b.size - a.size
      if (sortBy === 'size_asc') return a.size - b.size
      if (sortBy === 'name_asc')
        return (a.originalFilename || a._id).localeCompare(b.originalFilename || b._id)
      if (sortBy === 'name_desc')
        return (b.originalFilename || b._id).localeCompare(a.originalFilename || a._id)
      // default: 'date' (_createdAt desc)
      const dateA = a._createdAt ? new Date(a._createdAt).getTime() : 0
      const dateB = b._createdAt ? new Date(b._createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [filteredUnused, sortBy])

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((i) => i !== id)))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? sortedUnused.map((a) => a._id) : [])
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setAssetType('all')
    setSizeFilter('all')
    setSortBy('date')
  }

  const triggerBulkDelete = (ids: string[]) => {
    setConfirmDelete({show: true, ids})
  }

  const handleConfirmDelete = () => {
    onBulkDelete(confirmDelete.ids)
    setSelectedIds((prev) => prev.filter((id) => !confirmDelete.ids.includes(id)))
    setConfirmDelete({show: false, ids: []})
  }

  const allFilteredSelected =
    sortedUnused.length > 0 && sortedUnused.every((a) => selectedIds.includes(a._id))
  const someFilteredSelected =
    sortedUnused.some((a) => selectedIds.includes(a._id)) && !allFilteredSelected

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
        <Stack gap={2}>
          <Heading size={1}>Bulk Deletion of Unused Assets</Heading>
          <Text size={1} muted>
            Showing {sortedUnused.length} of {unusedAssets.length} unused assets
          </Text>
        </Stack>

        <Flex gap={2} align="center">
          {selectedIds.length > 0 && (
            <Button
              icon={TrashIcon}
              tone="critical"
              text={`Delete Selected (${selectedIds.length})`}
              onClick={() => triggerBulkDelete(selectedIds)}
            />
          )}
          {unusedAssets.length > 0 && selectedIds.length !== unusedAssets.length && (
            <Button
              mode="ghost"
              icon={TrashIcon}
              tone="critical"
              text={`Delete All Unused (${unusedAssets.length})`}
              onClick={() => triggerBulkDelete(unusedAssets.map((a) => a._id))}
            />
          )}
        </Flex>
      </Flex>

      {/* Filter and View Toolbar */}
      <Card padding={3} border radius={2}>
        <Flex align="center" gap={3} wrap="wrap">
          {sortedUnused.length > 0 && (
            <Flex align="center" gap={2}>
              <Checkbox
                id="select-all-unused"
                checked={allFilteredSelected}
                indeterminate={someFilteredSelected}
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              />
              <Text size={1} weight="semibold" muted>
                Select All
              </Text>
            </Flex>
          )}
          <SearchBox>
            <TextInput
              icon={SearchIcon}
              placeholder="Search unused by name, ext, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              fontSize={1}
            />
          </SearchBox>
          <Box style={{width: '130px'}}>
            <Select
              fontSize={1}
              value={sortBy}
              onChange={(e) => setSortBy(e.currentTarget.value as UnusedSortOrder)}
            >
              <option value="date">Upload Date</option>
              <option value="size_desc">Size (High to Low)</option>
              <option value="size_asc">Size (Low to High)</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </Select>
          </Box>
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
          <Flex gap={1}>
            <Button
              icon={GridIcon}
              mode={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            />
            <Button
              icon={ListIcon}
              mode={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              title="List View"
            />
          </Flex>
          <Button
            icon={ResetIcon}
            mode="ghost"
            onClick={handleResetFilters}
            title="Reset filters"
          />
        </Flex>
      </Card>

      {loading ? (
        viewMode === 'grid' ? (
          <AssetGridSkeleton count={8} />
        ) : (
          <AssetListSkeleton count={6} />
        )
      ) : unusedAssets.length === 0 ? (
        <Card padding={5} border radius={3}>
          <Text align="center">No unused assets found.</Text>
        </Card>
      ) : sortedUnused.length === 0 ? (
        <Card padding={5} border radius={3}>
          <Text align="center">No unused assets match your filter criteria.</Text>
        </Card>
      ) : viewMode === 'grid' ? (
        <Grid gridTemplateColumns={[2, 3, 4, 5, 6]} gap={3}>
          {sortedUnused.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              onClick={onAssetClick}
              isSelected={selectedIds.includes(asset._id)}
              onSelect={handleSelect}
            />
          ))}
        </Grid>
      ) : (
        <AssetListView
          assets={sortedUnused}
          onClick={onAssetClick}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      {confirmDelete.show && (
        <Dialog
          id="confirm-bulk-delete"
          header={`Delete ${confirmDelete.ids.length} Asset(s)?`}
          onClose={() => setConfirmDelete({show: false, ids: []})}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button
                  text="Cancel"
                  mode="ghost"
                  onClick={() => setConfirmDelete({show: false, ids: []})}
                />
                <Button text="Delete Permanently" tone="critical" onClick={handleConfirmDelete} />
              </Flex>
            </Box>
          }
        >
          <Box padding={4}>
            <Text>
              Are you sure you want to delete <strong>{confirmDelete.ids.length}</strong> asset(s)?
              This action cannot be undone and will permanently remove them from your project.
            </Text>
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
