import {useState, useMemo, useEffect, useRef} from 'react'
import {Box, Grid, Text, Stack, Flex, Spinner, Card, Button, useToast} from '@sanity/ui'
import {useClient} from 'sanity'
import {useAssets} from '@/hooks/useAssets'
import {findUnusedAssets, deleteAssets} from '@/utils/assetQueries'
import {uploadFileWithProgress} from '@/utils/uploadWithProgress'
import {compressImageIfNeeded} from '@/utils/compressImage'
import type {Asset, AssetTab, AssetTypeFilter, SizeFilter, SortOrder} from '@/types'
import type {FileUploadItem} from '@/components/UploadProgressModal'
import {AssetCard} from '@/components/AssetCard'
import {AssetDetailsDialog} from '@/components/AssetDetailsDialog'
import {TopToolbar} from '@/components/TopToolbar'
import {UploadProgressModal} from '@/components/UploadProgressModal'
import {SizeAnalyzer} from '@/components/tabs/SizeAnalyzer'
import {UnusedAssets} from '@/components/tabs/UnusedAssets'
import styled from 'styled-components'

const AppContainer = styled(Card)`
  height: 100vh;
  display: flex;
  flex-direction: column;
`

const ScrollableContent = styled(Box)`
  flex: 1;
  overflow-y: auto;
`

const TabNav = styled(Card)`
  z-index: 10;
`

export function SmartAssetManagerTool() {
  const sanityClient = useClient({apiVersion: '2025-02-07'})
  const [activeTab, setActiveTab] = useState<AssetTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOrder>('_createdAt')
  const [assetType, setAssetType] = useState<AssetTypeFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')

  const limit = 20
  const [currentPage, setCurrentPage] = useState(1)
  const {assets, loading, total, refreshAssets} = useAssets(
    sanityClient,
    searchQuery,
    sortBy,
    assetType,
    (currentPage - 1) * limit,
    limit,
  )

  const [scanning, setScanning] = useState(false)
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([])

  // Per-file AbortControllers so each file can be individually cancelled
  const fileAbortControllers = useRef<Map<string, AbortController>>(new Map())

  const toast = useToast()

  // Derived upload state for the toolbar button
  const uploadState = useMemo(() => {
    const total = uploadItems.length
    const uploaded = uploadItems.filter(
      (i) => i.status === 'done' || i.status === 'skipped' || i.status === 'error',
    ).length
    const isUploading = total > 0 && uploaded < total
    return {isUploading, uploaded, total}
  }, [uploadItems])

  // Auto-clear the modal 2.5 s after all items finish
  useEffect(() => {
    if (uploadItems.length === 0) return
    const allDone = uploadItems.every(
      (i) => i.status === 'done' || i.status === 'error' || i.status === 'skipped',
    )
    if (!allDone) return
    const timer = setTimeout(() => setUploadItems([]), 2500)
    return () => clearTimeout(timer)
  }, [uploadItems])

  const [unusedAssets, setUnusedAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (sizeFilter === 'small') return asset.size < 102400
      if (sizeFilter === 'medium') return asset.size >= 102400 && asset.size < 1048576
      if (sizeFilter === 'large') return asset.size >= 1048576
      return true
    })
  }, [assets, sizeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, assetType, sizeFilter, activeTab])

  const handleFindUnused = async () => {
    setScanning(true)
    const unused = await findUnusedAssets(sanityClient)
    setUnusedAssets(unused)
    setScanning(false)
    setActiveTab('unused')
  }

  const handleDeleteAsset = async (id: string | string[]) => {
    const ids = Array.isArray(id) ? id : [id]
    await deleteAssets(sanityClient, ids)
    refreshAssets()
    setUnusedAssets((prev) => prev.filter((a) => !ids.includes(a._id)))
    if (activeTab === 'unused') handleFindUnused()
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setAssetType('all')
    setSizeFilter('all')
    setCurrentPage(1)
  }

  // Cancel a single file upload by name
  const handleCancelFile = (name: string) => {
    const ctrl = fileAbortControllers.current.get(name)
    if (ctrl) {
      ctrl.abort()
      fileAbortControllers.current.delete(name)
    }
    setUploadItems((prev) =>
      prev.map((i) =>
        i.name === name && (i.status === 'pending' || i.status === 'uploading')
          ? {...i, status: 'error' as const, error: 'Cancelled by user'}
          : i,
      ),
    )
  }

  const handleUpload = async (files: FileList) => {
    if (files.length > 20) {
      toast.push({
        status: 'error',
        title: 'Upload limit exceeded',
        description: 'You can only upload up to 20 files at a time.',
      })
      return
    }

    // Clear any leftover controllers from a previous run
    fileAbortControllers.current.clear()

    const fileArray = Array.from(files)
    const filenames = fileArray.map((f) => f.name)

    // 1. Batch-check which files already exist
    let existingAssetNames: string[] = []
    try {
      existingAssetNames = await sanityClient.fetch<string[]>(
        `*[_type in ["sanity.imageAsset", "sanity.fileAsset"] && originalFilename in $filenames].originalFilename`,
        {filenames},
      )
    } catch {
      toast.push({
        status: 'error',
        title: 'Upload failed',
        description: 'Could not check for existing files.',
      })
      return
    }

    // 2. Build initial UI state
    const initialItems: FileUploadItem[] = fileArray.map((f) => ({
      name: f.name,
      size: f.size,
      percent: 0,
      status: existingAssetNames.includes(f.name) ? 'skipped' : 'pending',
    }))
    setUploadItems(initialItems)

    const filesToUpload = fileArray.filter((f) => !existingAssetNames.includes(f.name))
    const skippedCount = fileArray.length - filesToUpload.length

    if (filesToUpload.length === 0) {
      toast.push({
        status: 'info',
        title: 'No new files were added',
        description: `All ${skippedCount} file(s) already exist in your library.`,
      })
      return
    }

    // 3. Upload all files concurrently
    let successCount = 0

    const updateItem = (name: string, patch: Partial<FileUploadItem>) =>
      setUploadItems((prev) => prev.map((i) => (i.name === name ? {...i, ...patch} : i)))

    await Promise.all(
      filesToUpload.map(async (file) => {
        // Create an individual AbortController per file
        const ctrl = new AbortController()
        fileAbortControllers.current.set(file.name, ctrl)
        const {signal} = ctrl

        if (signal.aborted) {
          updateItem(file.name, {status: 'error', error: 'Cancelled by user'})
          return
        }

        updateItem(file.name, {status: 'uploading', percent: 0})

        try {
          // Always compress images client-side before uploading for speed
          const fileToUpload = await compressImageIfNeeded(file)
          // Update the size in UI to reflect the optimized/compressed file size
          updateItem(file.name, {size: fileToUpload.size})

          await uploadFileWithProgress(
            fileToUpload,
            sanityClient,
            ({percent}) => updateItem(file.name, {percent}),
            signal,
            true,
          )
          successCount++
          updateItem(file.name, {status: 'done', percent: 100})
          fileAbortControllers.current.delete(file.name)
          // Refresh asset list immediately so the new card appears
          refreshAssets()
        } catch (err) {
          const isCancelled = err instanceof DOMException && err.name === 'AbortError'
          const message = isCancelled
            ? 'Cancelled by user'
            : err instanceof Error
              ? err.message
              : 'Unknown error'

          updateItem(file.name, {status: 'error', error: message})

          if (!isCancelled) {
            toast.push({
              status: 'warning',
              title: 'File upload failed',
              description: `${file.name}: ${message}`,
            })
          }
          fileAbortControllers.current.delete(file.name)
        }
      }),
    )

    // 4. Final summary toast
    const anyActive = [...fileAbortControllers.current.values()].some((c) => !c.signal.aborted)
    if (!anyActive) {
      toast.push({
        status: successCount > 0 ? 'success' : 'warning',
        title: 'Upload complete',
        description: `Uploaded ${successCount} file(s).${skippedCount > 0 ? ` Skipped ${skippedCount} already-existing file(s).` : ''}`,
      })
    }
  }

  return (
    <AppContainer height="fill">
      {/* Tab Navigation */}
      <TabNav borderBottom padding={2}>
        <Flex gap={1}>
          {[
            {id: 'all', label: 'All Assets'},
            {id: 'analysis', label: 'Size Analyzer'},
            {id: 'unused', label: 'Unused Assets', onClick: handleFindUnused},
          ].map((tab) => (
            <Button
              key={tab.id}
              mode={activeTab === tab.id ? 'default' : 'bleed'}
              padding={3}
              text={tab.label}
              onClick={() => {
                setActiveTab(tab.id as AssetTab)
                if (tab.onClick) tab.onClick()
              }}
              selected={activeTab === tab.id}
            />
          ))}
        </Flex>
      </TabNav>

      <ScrollableContent>
        {activeTab === 'all' && (
          <TopToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            assetType={assetType}
            setAssetType={setAssetType}
            sizeFilter={sizeFilter}
            setSizeFilter={setSizeFilter}
            onReset={handleResetFilters}
            onUpload={handleUpload}
            uploadState={uploadState}
          />
        )}

        <Box padding={4}>
          {loading || scanning ? (
            <Flex align="center" justify="center" style={{minHeight: '400px'}}>
              <Stack space={4}>
                <Flex align="center" justify="center">
                  <Spinner muted />
                </Flex>
                <Text size={1} muted>
                  Syncing with media library...
                </Text>
              </Stack>
            </Flex>
          ) : (
            <Box>
              {activeTab === 'all' && (
                <Box>
                  {filteredAssets.length === 0 ? (
                    <Card padding={5} border radius={3} style={{textAlign: 'center'}}>
                      <Text muted>No assets found matching your filters.</Text>
                    </Card>
                  ) : (
                    <Grid columns={[2, 3, 4, 5, 6]} gap={3}>
                      {filteredAssets.map((asset) => (
                        <AssetCard key={asset._id} asset={asset} onClick={setSelectedAsset} />
                      ))}
                    </Grid>
                  )}

                  {total > limit && (
                    <Flex justify="center" align="center" gap={3} marginTop={5} marginBottom={2}>
                      <Button
                        padding={3}
                        mode="ghost"
                        text="Previous"
                        disabled={currentPage === 1 || loading}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      />
                      <Card padding={3} radius={2} border>
                        <Text size={1} weight="semibold">
                          Page {currentPage} of {Math.ceil(total / limit)}
                        </Text>
                      </Card>
                      <Button
                        padding={3}
                        mode="ghost"
                        text="Next"
                        disabled={currentPage >= Math.ceil(total / limit) || loading}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      />
                    </Flex>
                  )}
                </Box>
              )}

              {activeTab === 'analysis' && <SizeAnalyzer assets={assets} />}

              {activeTab === 'unused' && (
                <UnusedAssets
                  unusedAssets={unusedAssets}
                  onBulkDelete={handleDeleteAsset}
                  onAssetClick={setSelectedAsset}
                />
              )}
            </Box>
          )}
        </Box>
      </ScrollableContent>

      <UploadProgressModal items={uploadItems} onCancelFile={handleCancelFile} />

      {selectedAsset && (
        <AssetDetailsDialog
          asset={selectedAsset}
          sanityClient={sanityClient}
          onClose={() => setSelectedAsset(null)}
          onUpdate={(_id, newName) => {
            refreshAssets()
            setSelectedAsset((prev) => (prev ? {...prev, originalFilename: newName} : null))
          }}
          onDelete={handleDeleteAsset}
        />
      )}
    </AppContainer>
  )
}
