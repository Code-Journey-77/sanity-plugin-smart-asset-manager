import React, {useState, useEffect} from 'react'
import {
  Box,
  Flex,
  Stack,
  Text,
  Badge,
  Button,
  Dialog,
  TextInput,
  Label,
  Card,
  Grid,
  Spinner,
  useToast,
  Tooltip,
} from '@sanity/ui'
import type {Asset, ReferencedDocument} from '@/types'
import {formatBytes} from '@/utils/formatBytes'
import {DocumentsIcon, DownloadIcon, TrashIcon, PdfIcon, AudioIcon} from '@/components/common/Icons'
import {type SanityClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {getAssetUsage, updateAssetFilename} from '@/utils/assetQueries'
import styled from 'styled-components'

const PreviewContainer = styled(Box)`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  margin-bottom: 16px;
  border: 1px solid var(--card-border-color);
`

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const VideoPreview = styled.video`
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #000;
`

const PdfPreview = styled.iframe`
  width: 100%;
  height: 400px;
  border: none;
  border-radius: 4px;
`

const AudioPreview = styled.audio`
  width: 100%;
  margin-top: 16px;
`

const UsageCard = styled(Card)`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 1px solid var(--card-border-color);
  &:hover {
    background: var(--card-bg-color);
    border-color: var(--card-focus-ring-color);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
`

const ViewText = styled(Text)`
  transition: all 0.2s ease;
  color: var(--card-focus-ring-color);
`

interface AssetDetailsDialogProps {
  asset: Asset
  onClose: () => void
  sanityClient: SanityClient
  onUpdate: (id: string, newName: string) => void
  onDelete: (id: string) => void
}

export const AssetDetailsDialog: React.FC<AssetDetailsDialogProps> = ({
  asset,
  onClose,
  sanityClient,
  onUpdate,
  onDelete,
}) => {
  const [newName, setNewName] = useState(asset.originalFilename || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [usage, setUsage] = useState<ReferencedDocument[]>([])
  const [loadingUsage, setLoadingUsage] = useState(true)
  const toast = useToast()
  const router = useRouter()

  useEffect(() => {
    async function fetchUsage() {
      setLoadingUsage(true)
      try {
        const results = await getAssetUsage(sanityClient, asset._id)
        setUsage(results)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingUsage(false)
      }
    }
    fetchUsage()
  }, [asset._id, sanityClient])

  const handleUpdate = async () => {
    if (!newName.trim()) return
    setIsUpdating(true)
    try {
      await updateAssetFilename(sanityClient, asset._id, newName)
      onUpdate(asset._id, newName)
      toast.push({
        status: 'success',
        title: 'Filename updated',
      })
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Failed to update filename',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      onDelete(asset._id)
      onClose()
      toast.push({
        status: 'success',
        title: 'Asset deleted',
      })
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Failed to delete asset',
      })
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleDocClick = (docId: string, docType: string) => {
    if (router && typeof router.navigateIntent === 'function') {
      router.navigateIntent('edit', {id: docId, type: docType})
      onClose()
    } else {
      // Fallback for cases where router might not be fully available
      window.location.hash = `intent/edit/id=${docId};type=${docType}`
      onClose()
    }
  }

  const isImage = asset._type === 'sanity.imageAsset'
  const isVideo = asset?.mimeType?.startsWith('video/')
  const isAudio = asset?.mimeType?.startsWith('audio/')
  const isPdf = asset?.extension === 'pdf' || asset?.mimeType === 'application/pdf'

  return (
    <Dialog
      id="asset-details-dialog"
      header="Asset Details"
      onClose={onClose}
      width={2}
      footer={
        <Box padding={3}>
          <Flex justify="space-between" align="center">
            <Tooltip
              content={
                <Box padding={2} style={{maxWidth: '350px'}}>
                  <Text size={1}>
                    {usage.length > 0
                      ? 'This asset is being used by documents and cannot be deleted. Remove all references first.'
                      : 'Delete this asset permanently'}
                  </Text>
                </Box>
              }
              placement="top"
              portal
            >
              <Box>
                <Button
                  icon={TrashIcon}
                  text="Delete Asset"
                  tone="critical"
                  mode="ghost"
                  onClick={() => setConfirmDelete(true)}
                  disabled={usage.length > 0 || loadingUsage}
                />
              </Box>
            </Tooltip>
            <Flex gap={2}>
              <Button text="Close" mode="ghost" onClick={onClose} />
            </Flex>
          </Flex>
        </Box>
      }
    >
      <Box padding={4}>
        {confirmDelete && (
          <Dialog
            id="confirm-asset-delete"
            header="Delete Asset?"
            onClose={() => setConfirmDelete(false)}
            footer={
              <Box padding={3}>
                <Flex gap={2} justify="flex-end">
                  <Button text="Cancel" mode="ghost" onClick={() => setConfirmDelete(false)} />
                  <Button
                    text="Delete Permanently"
                    tone="critical"
                    onClick={handleDelete}
                    loading={isDeleting}
                  />
                </Flex>
              </Box>
            }
          >
            <Box padding={4}>
              <Text>
                Are you sure you want to delete{' '}
                <strong>{asset.originalFilename || 'this asset'}</strong>? This action cannot be
                undone.
              </Text>
            </Box>
          </Dialog>
        )}
        <Grid columns={[1, 1, 2]} gap={4}>
          <Stack space={4}>
            <PreviewContainer>
              {isImage ? (
                <PreviewImage src={`${asset.url}?w=800`} alt="" />
              ) : isVideo ? (
                <VideoPreview src={asset.url} controls muted playsInline />
              ) : isPdf ? (
                <PdfPreview src={asset.url} title="PDF Preview" />
              ) : isAudio ? (
                <Flex direction="column" align="center" gap={4} style={{width: '100%'}}>
                  <AudioIcon style={{fontSize: '64px', color: '#ef4444'}} />
                  <AudioPreview src={asset.url} controls />
                </Flex>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap={3}
                  style={{height: '300px', width: '100%'}}
                >
                  {isPdf ? (
                    <PdfIcon style={{fontSize: '80px', color: '#ef4444'}} />
                  ) : isAudio ? (
                    <AudioIcon style={{fontSize: '80px', color: '#ef4444'}} />
                  ) : (
                    <DocumentsIcon
                      style={{
                        fontSize: '80px',
                        color: '#9ca3af',
                      }}
                    />
                  )}
                </Flex>
              )}
            </PreviewContainer>

            <Stack space={3}>
              <Box>
                <Label size={1}>Original Filename</Label>
                <Flex gap={2} marginTop={2}>
                  <Box style={{flex: 1}}>
                    <TextInput
                      value={newName}
                      onChange={(e) => setNewName(e.currentTarget.value)}
                      placeholder="Enter filename..."
                    />
                  </Box>
                  <Button
                    text="Save"
                    tone="primary"
                    onClick={handleUpdate}
                    loading={isUpdating}
                    disabled={newName === asset.originalFilename}
                  />
                </Flex>
              </Box>

              <Card padding={3} border radius={2}>
                <Stack space={3}>
                  <Text weight="bold" size={1}>
                    File Information
                  </Text>
                  <Stack space={3}>
                    <Flex align="flex-start" gap={3}>
                      <Box style={{minWidth: '85px'}}>
                        <Text size={1} muted>
                          ID:
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text size={1} style={{wordBreak: 'break-all'}}>
                          {asset._id}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex align="center" gap={3}>
                      <Box style={{minWidth: '85px'}}>
                        <Text size={1} muted>
                          Type:
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Badge tone="primary" mode="outline" fontSize={0}>
                          {(asset.extension || asset.mimeType?.split('/')[1])?.toUpperCase() ||
                            'OTHER'}
                        </Badge>
                      </Box>
                    </Flex>

                    <Flex align="center" gap={3}>
                      <Box style={{minWidth: '85px'}}>
                        <Text size={1} muted>
                          Size:
                        </Text>
                      </Box>
                      <Box flex={1}>
                        <Text size={1}>{formatBytes(asset.size)}</Text>
                      </Box>
                    </Flex>

                    {asset.metadata?.dimensions && (
                      <Flex align="center" gap={3}>
                        <Box style={{minWidth: '85px'}}>
                          <Text size={1} muted>
                            Dimensions:
                          </Text>
                        </Box>
                        <Box flex={1}>
                          <Text size={1}>
                            {asset.metadata.dimensions.width} × {asset.metadata.dimensions.height}{' '}
                            px
                          </Text>
                        </Box>
                      </Flex>
                    )}
                  </Stack>
                  <Button
                    icon={DownloadIcon}
                    text="Download File"
                    mode="ghost"
                    onClick={() => window.open(asset.url)}
                  />
                </Stack>
              </Card>
            </Stack>
          </Stack>

          <Stack space={4}>
            <Text weight="bold" size={1}>
              Usage in Documents
            </Text>
            {loadingUsage ? (
              <Flex align="center" justify="center" style={{padding: '40px'}}>
                <Spinner />
              </Flex>
            ) : usage?.length > 0 ? (
              <Stack space={2} style={{maxHeight: '500px', overflowY: 'auto'}}>
                {usage?.map((doc) => (
                  <UsageCard
                    key={doc._id}
                    padding={3}
                    border
                    radius={2}
                    onClick={() => handleDocClick(doc._id, doc._type)}
                  >
                    <Flex align="center" justify="space-between" gap={3}>
                      <Flex direction="column" align="flex-start" gap={2}>
                        <Text size={1} weight="semibold">
                          {doc.title}
                        </Text>
                        <Badge tone="caution" fontSize={0}>
                          {doc._type}
                        </Badge>
                      </Flex>
                      <Flex align="center" gap={3}>
                        <ViewText size={0} weight="bold" className="view-text">
                          VIEW →
                        </ViewText>
                      </Flex>
                    </Flex>
                  </UsageCard>
                ))}
              </Stack>
            ) : (
              <Card padding={4} border radius={2} tone="transparent" style={{textAlign: 'center'}}>
                <Text size={1} muted>
                  No references found for this asset.
                </Text>
              </Card>
            )}
          </Stack>
        </Grid>
      </Box>
    </Dialog>
  )
}
