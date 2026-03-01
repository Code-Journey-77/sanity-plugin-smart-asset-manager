import React from 'react'
import {Stack, Heading, Card, Box, Flex, Text, Badge, Button} from '@sanity/ui'
import type {Asset} from '@/types'
import {formatBytes} from '@/utils/formatBytes'
import {DocumentsIcon, PdfIcon, AudioIcon, SortIcon} from '@/components/common/Icons'
import styled from 'styled-components'

const TableCard = styled(Card)`
  border: 1px solid var(--card-border-color);
`

const TableHeader = styled(Box)`
  border-bottom: 1px solid var(--card-border-color);
`

const TableRow = styled(Flex)<{$isLast?: boolean}>`
  border-bottom: ${(props) => (props.$isLast ? 'none' : '1px solid var(--card-border-color)')};
  transition: background 0.2s ease;
  &:hover {
    background: var(--card-bg-color);
    filter: brightness(0.95);
  }
`

const Thumbnail = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  background-color: var(--card-border-color);
`

interface SizeAnalyzerProps {
  assets: Asset[]
}

export const SizeAnalyzer: React.FC<SizeAnalyzerProps> = ({assets}) => {
  const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>('desc')

  const sortedAssets = React.useMemo(() => {
    return [...assets].sort((a, b) => {
      return sortOrder === 'desc' ? b.size - a.size : a.size - b.size
    })
  }, [assets, sortOrder])

  const toggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <Stack space={4}>
      <Heading size={1}>Image Size Analysis</Heading>
      <TableCard border radius={2}>
        <TableHeader padding={2}>
          <Flex align="center" gap={3}>
            <Box style={{flex: 1}} paddingLeft={3}>
              <Text size={1} weight="bold">
                File
              </Text>
            </Box>
            <Box style={{width: '120px'}}>
              <Text size={1} weight="bold">
                Dimensions
              </Text>
            </Box>
            <Box style={{width: '140px'}}>
              <Flex align="center" gap={1}>
                <Text size={1} weight="bold">
                  Weight
                </Text>
                <Button
                  icon={SortIcon}
                  mode="bleed"
                  padding={2}
                  onClick={toggleSort}
                  fontSize={1}
                  title={`Sort by weight ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
                  style={{transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none'}}
                />
              </Flex>
            </Box>
          </Flex>
        </TableHeader>
        {sortedAssets.slice(0, 50).map((asset, i) => (
          <TableRow
            key={asset._id}
            padding={3}
            align="center"
            gap={3}
            $isLast={i === (sortedAssets.length < 50 ? sortedAssets.length - 1 : 49)}
          >
            {asset._type === 'sanity.imageAsset' ? (
              <Thumbnail src={`${asset.url}?w=40&h=40&fit=crop`} alt="" />
            ) : (
              <Box
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--card-border-color)',
                  borderRadius: '4px',
                }}
              >
                {asset.mimeType?.startsWith('video/') ? (
                  <DocumentsIcon style={{fontSize: '20px', color: '#3b82f6'}} />
                ) : asset.mimeType?.startsWith('audio/') ? (
                  <AudioIcon style={{fontSize: '20px', color: '#ef4444'}} />
                ) : asset.extension === 'pdf' || asset.mimeType === 'application/pdf' ? (
                  <PdfIcon style={{fontSize: '20px', color: '#ef4444'}} />
                ) : (
                  <DocumentsIcon style={{fontSize: '20px', color: '#9ca3af'}} />
                )}
              </Box>
            )}
            <Box style={{flex: 1}}>
              <Text size={1} weight="semibold">
                {asset.originalFilename || asset._id}
              </Text>
            </Box>
            <Box style={{width: '120px'}}>
              <Text size={1}>
                {asset.metadata?.dimensions?.width || '—'} x{' '}
                {asset.metadata?.dimensions?.height || '—'}
              </Text>
            </Box>
            <Box style={{width: '140px'}}>
              <Badge
                tone={
                  asset.size > 1048576 ? 'critical' : asset.size > 500000 ? 'caution' : 'positive'
                }
              >
                {formatBytes(asset.size)}
              </Badge>
            </Box>
          </TableRow>
        ))}
      </TableCard>
    </Stack>
  )
}
