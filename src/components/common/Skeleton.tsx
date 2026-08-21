import {Box, Card, Flex, Grid, Stack} from '@sanity/ui'
import React from 'react'
import styled, {keyframes} from 'styled-components'

const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.25;
  }
  100% {
    opacity: 0.6;
  }
`

export const SkeletonBox = styled(Box)<{
  $height?: string
  $width?: string
  $radius?: number
  $aspectRatio?: string
}>`
  background-color: var(--card-border-color, #e5e7eb);
  border-radius: ${(props) => (props.$radius !== undefined ? `${props.$radius}px` : '4px')};
  height: ${(props) => props.$height || '100%'};
  width: ${(props) => props.$width || '100%'};
  aspect-ratio: ${(props) => props.$aspectRatio || 'auto'};
  animation: ${pulse} 1.5s ease-in-out infinite;
`

const StyledCard = styled(Card)`
  overflow: hidden;
  border: 1px solid var(--card-border-color);
`

const ImageSkeletonContainer = styled(Box)`
  width: 100%;
  aspect-ratio: 1.25;
  border-bottom: 1px solid var(--card-border-color);
  overflow: hidden;
`

export const AssetGridSkeleton: React.FC<{count?: number}> = ({count = 12}) => {
  const items = Array.from({length: count}, (_, i) => i)

  return (
    <Grid gridTemplateColumns={[2, 3, 4, 5, 6]} gap={3}>
      {items.map((i) => (
        <StyledCard key={i} radius={3}>
          <ImageSkeletonContainer>
            <SkeletonBox $height="100%" $width="100%" $radius={0} />
          </ImageSkeletonContainer>
          <Box padding={3}>
            <Stack gap={2}>
              <Flex align="center" direction="column" gap={2}>
                <SkeletonBox $height="14px" $width="75%" $radius={3} />
                <SkeletonBox $height="18px" $width="45px" $radius={10} />
              </Flex>
            </Stack>
          </Box>
        </StyledCard>
      ))}
    </Grid>
  )
}

const TableSkeletonCard = styled(Card)`
  border: 1px solid var(--card-border-color);
  overflow: hidden;
`

const TableSkeletonRow = styled(Flex)<{$isLast?: boolean}>`
  border-bottom: ${(props) => (props.$isLast ? 'none' : '1px solid var(--card-border-color)')};
`

export const AssetListSkeleton: React.FC<{count?: number}> = ({count = 8}) => {
  const items = Array.from({length: count}, (_, i) => i)

  return (
    <TableSkeletonCard radius={2}>
      {items.map((i) => (
        <TableSkeletonRow key={i} padding={3} align="center" gap={3} $isLast={i === count - 1}>
          <Box style={{width: '24px'}}>
            <SkeletonBox $height="16px" $width="16px" $radius={3} />
          </Box>

          <Box style={{width: '52px'}}>
            <SkeletonBox $height="48px" $width="48px" $radius={4} />
          </Box>

          <Box style={{flex: 2}}>
            <SkeletonBox $height="14px" $width="60%" $radius={3} />
          </Box>

          <Box style={{width: '90px'}}>
            <SkeletonBox $height="20px" $width="50px" $radius={10} />
          </Box>

          <Box style={{width: '110px'}}>
            <SkeletonBox $height="14px" $width="70px" $radius={3} />
          </Box>

          <Box style={{width: '100px'}}>
            <SkeletonBox $height="20px" $width="60px" $radius={10} />
          </Box>

          <Box style={{width: '50px'}} />
        </TableSkeletonRow>
      ))}
    </TableSkeletonCard>
  )
}

export const SizeAnalyzerSkeleton: React.FC<{count?: number}> = ({count = 8}) => {
  const items = Array.from({length: count}, (_, i) => i)

  return (
    <>
      {items.map((i) => (
        <TableSkeletonRow key={i} padding={3} align="center" gap={3} $isLast={i === count - 1}>
          <Box style={{width: '52px'}}>
            <SkeletonBox $height="48px" $width="48px" $radius={4} />
          </Box>

          <Box style={{flex: 2}}>
            <SkeletonBox $height="14px" $width="55%" $radius={3} />
          </Box>

          <Box style={{width: '130px'}}>
            <SkeletonBox $height="14px" $width="80px" $radius={3} />
          </Box>

          <Box style={{width: '100px'}}>
            <SkeletonBox $height="20px" $width="65px" $radius={10} />
          </Box>
        </TableSkeletonRow>
      ))}
    </>
  )
}
