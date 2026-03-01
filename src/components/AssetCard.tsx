import React from 'react'
import {Box, Flex, Stack, Text, Badge, Button, Card, Checkbox} from '@sanity/ui'
import type {Asset} from '@/types'
import {formatBytes} from '@/utils/formatBytes'
import {DocumentsIcon, DownloadIcon, PdfIcon, AudioIcon} from '@/components/common/Icons'
import styled from 'styled-components'

const StyledCard = styled(Card)`
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  border: 1px solid
    ${(props) => (props.selected ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)')};
  background-color: ${(props) => (props.selected ? 'var(--card-accent-bg-color)' : 'inherit')};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    border-color: var(--card-focus-ring-color);
  }
`

const ImageContainer = styled(Box)`
  width: 100%;
  aspect-ratio: 1.25;
  background-color: transparent;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--card-border-color);
  overflow: hidden;
`

const SelectOverlay = styled(Box)`
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
`

const AssetPreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  ${StyledCard}:hover & {
    transform: scale(1.05);
  }
`

const VideoPreview = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
`

const ActionBar = styled(Flex)`
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--card-bg-color);
  opacity: 0.95;
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 2px;
  opacity: 0;
  border: 1px solid var(--card-border-color);
  transition: opacity 0.2s ease;

  ${StyledCard}:hover & {
    opacity: 1;
  }
`

interface AssetCardProps {
  asset: Asset
  onClick: (asset: Asset) => void
  isSelected?: boolean
  onSelect?: (id: string, selected: boolean) => void
}

export const AssetCard: React.FC<AssetCardProps> = ({asset, onClick, isSelected, onSelect}) => {
  const isImage = asset._type === 'sanity.imageAsset'
  const isVideo = asset?.mimeType?.startsWith('video/')
  const isAudio = asset?.mimeType?.startsWith('audio/')
  const isPdf = asset?.extension === 'pdf' || asset?.mimeType === 'application/pdf'

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onClick(asset)
  }

  return (
    <StyledCard radius={3} onClick={handleCardClick} selected={isSelected}>
      <ImageContainer>
        {onSelect && (
          <SelectOverlay onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={(e) => onSelect(asset._id, e.target.checked)}
            />
          </SelectOverlay>
        )}
        {isImage ? (
          <AssetPreview
            src={`${asset.url}?w=400&h=320&fit=crop`}
            alt={asset.originalFilename || ''}
          />
        ) : isVideo ? (
          <VideoPreview src={asset.url} muted playsInline />
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={3}
            style={{height: '100%', width: '100%'}}
          >
            {isPdf ? (
              <PdfIcon
                style={{
                  fontSize: '48px',
                  color: '#ef4444',
                }}
              />
            ) : isAudio ? (
              <AudioIcon
                style={{
                  fontSize: '48px',
                  color: '#ef4444',
                }}
              />
            ) : (
              <DocumentsIcon
                style={{
                  fontSize: '48px',
                  color: '#9ca3af',
                }}
              />
            )}
            <Text size={1} weight="bold" muted>
              {(asset.extension || asset.mimeType?.split('/')[1])?.toUpperCase() || 'OTHER'}
            </Text>
          </Flex>
        )}
        <ActionBar gap={1}>
          <Button
            icon={DownloadIcon}
            mode="bleed"
            fontSize={1}
            padding={2}
            onClick={(e) => {
              e.stopPropagation()
              window.open(asset.url)
            }}
          />
        </ActionBar>
      </ImageContainer>
      <Box padding={3}>
        <Stack space={3}>
          <Flex align="center" direction="column" gap={2}>
            <Text size={1} weight="semibold" textOverflow="ellipsis" style={{flex: 1}}>
              {asset.originalFilename || asset._id.substring(0, 10)}
            </Text>
            <Badge tone={asset.size > 1048576 ? 'caution' : 'default'} fontSize={0}>
              {formatBytes(asset.size)}
            </Badge>
          </Flex>
        </Stack>
      </Box>
    </StyledCard>
  )
}
