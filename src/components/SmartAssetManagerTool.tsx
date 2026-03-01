import {useState, useMemo, useEffect} from 'react'
import {Box, Grid, Text, Stack, Flex, Spinner, Card, Button, useToast} from '@sanity/ui'
import {useClient} from 'sanity'
import {useAssets} from '@/hooks/useAssets'
import {findUnusedAssets, deleteAssets} from '@/utils/assetQueries'
import type {Asset, AssetTab, AssetTypeFilter, SizeFilter, SortOrder} from '@/types'
import {AssetCard} from '@/components/AssetCard'
import {AssetDetailsDialog} from '@/components/AssetDetailsDialog'
import {TopToolbar} from '@/components/TopToolbar'
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
  const [isUploading, setIsUploading] = useState(false)
  const toast = useToast()

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

  const handleUpload = async (files: FileList) => {
    if (files.length > 5) {
      toast.push({
        status: 'error',
        title: 'Upload limit exceeded',
        description: 'You can only upload up to 5 files at a time.',
      })
      return
    }

    setIsUploading(true)
    const fileArray = Array.from(files)
    const filenames = fileArray.map((f) => f.name)

    try {
      // 1. Batch check which files already exist
      const existingAssetNames = await sanityClient.fetch<string[]>(
        `*[_type in ["sanity.imageAsset", "sanity.fileAsset"] && originalFilename in $filenames].originalFilename`,
        {filenames},
      )

      const filesToUpload = fileArray.filter((f) => !existingAssetNames.includes(f.name))
      const skippedCount = fileArray.length - filesToUpload.length

      if (filesToUpload.length === 0) {
        setIsUploading(false)
        if (skippedCount > 0) {
          toast.push({
            status: 'info',
            title: 'No new files were added',
            description: `All ${skippedCount} file(s) already exist in your library.`,
          })
        }
        return
      }

      // 2. Upload only the new files
      const uploadPromises = filesToUpload.map(async (file) => {
        const type = file.type.startsWith('image/') ? 'image' : 'file'
        return sanityClient.assets.upload(type, file, {
          filename: file.name,
        })
      })

      await Promise.all(uploadPromises)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 3. Refresh and Notify
      refreshAssets()
      setIsUploading(false)

      toast.push({
        status: 'success',
        title: 'Upload successful',
        description: `Uploaded ${filesToUpload.length} new file(s). ${skippedCount > 0 ? `Skipped ${skippedCount} existing files.` : ''}`,
      })
    } catch (err) {
      console.error('Upload failed:', err)
      setIsUploading(false)
      toast.push({
        status: 'error',
        title: 'Upload failed',
        description: 'An error occurred while uploading your files.',
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
            isUploading={isUploading}
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
