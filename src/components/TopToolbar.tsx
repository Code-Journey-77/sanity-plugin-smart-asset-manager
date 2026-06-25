import React from 'react'
import {Flex, Box, TextInput, Select, Button, Card} from '@sanity/ui'
import {SearchIcon, ResetIcon, UploadIcon} from '@/components/common/Icons'
import type {AssetTypeFilter, SizeFilter, SortOrder} from '@/types'
import styled from 'styled-components'

const StickyCard = styled(Card)`
  position: sticky;
  top: 0;
  z-index: 10;
`

const SearchBox = styled(Box)`
  flex: 1;
`

const FilterBox = styled(Box)`
  width: 140px;
`

interface TopToolbarProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  sortBy: SortOrder
  setSortBy: (val: SortOrder) => void
  assetType: AssetTypeFilter
  setAssetType: (val: AssetTypeFilter) => void
  sizeFilter: SizeFilter
  setSizeFilter: (val: SizeFilter) => void
  onReset: () => void
  onUpload: (files: FileList) => void
  uploadState: {isUploading: boolean; uploaded: number; total: number}
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  assetType,
  setAssetType,
  sizeFilter,
  setSizeFilter,
  onReset,
  onUpload,
  uploadState,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
      // Reset input so the same file can be uploaded again
      e.target.value = ''
    }
  }

  return (
    <StickyCard padding={3} borderBottom>
      <Flex align="center" gap={3}>
        <input
          type="file"
          ref={fileInputRef}
          style={{display: 'none'}}
          onChange={handleFileChange}
          multiple
          accept="image/*,video/*,audio/*,application/*,text/*"
        />
        <SearchBox>
          <TextInput
            icon={SearchIcon}
            placeholder="Search name, extension, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            fontSize={1}
          />
        </SearchBox>
        <Box>
          <Select
            fontSize={1}
            value={sortBy}
            onChange={(e) => setSortBy(e.currentTarget.value as SortOrder)}
          >
            <option value="_createdAt">Upload Date</option>
            <option value="size">File Size</option>
            <option value="originalFilename">Name A-Z</option>
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
        <Button icon={ResetIcon} mode="ghost" onClick={onReset} title="Reset filters" />
        <Button
          icon={UploadIcon}
          text={
            uploadState.isUploading
              ? `Uploading ${uploadState.uploaded}/${uploadState.total}...`
              : 'Upload'
          }
          tone="primary"
          onClick={handleUploadClick}
          loading={uploadState.isUploading}
        />
      </Flex>
    </StickyCard>
  )
}
