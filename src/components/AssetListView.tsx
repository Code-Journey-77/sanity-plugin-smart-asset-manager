import React from 'react'
import {Box, Flex, Text, Badge, Button, Card, Checkbox} from '@sanity/ui'
import type {Asset} from '@/types'
import {formatBytes} from '@/utils/formatBytes'
import {DocumentsIcon, DownloadIcon, AudioIcon} from '@/components/common/Icons'
import styled from 'styled-components'

const TableCard = styled(Card)`
  border: 1px solid var(--card-border-color);
  overflow: hidden;
`

const TableHeader = styled(Box)`
  border-bottom: 1px solid var(--card-border-color);
  background-color: var(--card-bg-color);
`

const TableRow = styled(Flex)<{$selected?: boolean; $isLast?: boolean}>`
  border-bottom: ${(props) => (props.$isLast ? 'none' : '1px solid var(--card-border-color)')};
  background-color: ${(props) => (props.$selected ? 'var(--card-accent-bg-color)' : 'inherit')};
  transition: background 0.15s ease;
  cursor: pointer;

  &:hover {
    background-color: var(--card-bg-color);
    filter: brightness(0.97);
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

interface AssetListViewProps {
  assets: Asset[]
  onClick: (asset: Asset) => void
  selectedIds?: string[]
  onSelect?: (id: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  onClick,
  selectedIds = [],
  onSelect,
  onSelectAll,
}) => {
  const allSelected = assets.length > 0 && selectedIds.length === assets.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < assets.length

  return (
    <TableCard radius={2}>
      <TableHeader padding={3}>
        <Flex align="center" gap={3}>
          {onSelectAll && (
            <Box style={{width: '24px'}}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => onSelectAll(e.currentTarget.checked)}
              />
            </Box>
          )}
          <Box style={{width: '52px'}}>
            <Text size={1} weight="bold">
              Preview
            </Text>
          </Box>
          <Box style={{flex: 2}}>
            <Text size={1} weight="bold">
              Name / ID
            </Text>
          </Box>
          <Box style={{width: '90px'}}>
            <Text size={1} weight="bold">
              Type
            </Text>
          </Box>
          <Box style={{width: '110px'}}>
            <Text size={1} weight="bold">
              Dimensions
            </Text>
          </Box>
          <Box style={{width: '100px'}}>
            <Text size={1} weight="bold">
              Size
            </Text>
          </Box>
          <Box style={{width: '50px'}} />
        </Flex>
      </TableHeader>

      {assets.map((asset, index) => {
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
        const isSelected = selectedIds.includes(asset._id)

        return (
          <TableRow
            key={asset._id}
            padding={3}
            align="center"
            gap={3}
            $selected={isSelected}
            $isLast={index === assets.length - 1}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button, input')) return
              onClick(asset)
            }}
          >
            {onSelect && (
              <Box style={{width: '24px'}} onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onChange={(e) => onSelect(asset._id, e.target.checked)}
                />
              </Box>
            )}

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

            <Box style={{width: '90px'}}>
              <Badge tone="default" fontSize={0}>
                {(asset.extension || asset.mimeType?.split('/')[1])?.toUpperCase() || 'FILE'}
              </Badge>
            </Box>

            <Box style={{width: '110px'}}>
              <Text size={1} muted>
                {asset.metadata?.dimensions
                  ? `${asset.metadata.dimensions.width}×${asset.metadata.dimensions.height}`
                  : '—'}
              </Text>
            </Box>

            <Box style={{width: '100px'}}>
              <Badge tone={asset.size > 1048576 ? 'caution' : 'default'} fontSize={0}>
                {formatBytes(asset.size)}
              </Badge>
            </Box>

            <Box style={{width: '50px'}}>
              <Button
                icon={DownloadIcon}
                mode="bleed"
                fontSize={1}
                padding={2}
                title="Download asset"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(asset.url)
                }}
              />
            </Box>
          </TableRow>
        )
      })}
    </TableCard>
  )
}
