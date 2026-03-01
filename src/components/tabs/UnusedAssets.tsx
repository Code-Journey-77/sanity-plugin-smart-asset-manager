import React, {useState} from 'react'
import {Stack, Flex, Heading, Button, Card, Text, Grid, Dialog, Box, Checkbox} from '@sanity/ui'
import type {Asset} from '@/types'
import {TrashIcon} from '@/components/common/Icons'
import {AssetCard} from '@/components/AssetCard'

interface UnusedAssetsProps {
  unusedAssets: Asset[]
  onBulkDelete: (ids: string[]) => void
  onAssetClick: (asset: Asset) => void
}

export const UnusedAssets: React.FC<UnusedAssetsProps> = ({
  unusedAssets,
  onBulkDelete,
  onAssetClick,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean; ids: string[]}>({
    show: false,
    ids: [],
  })

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((i) => i !== id)))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? unusedAssets.map((a) => a._id) : [])
  }

  const triggerBulkDelete = (ids: string[]) => {
    setConfirmDelete({show: true, ids})
  }

  const handleConfirmDelete = () => {
    onBulkDelete(confirmDelete.ids)
    setSelectedIds((prev) => prev.filter((id) => !confirmDelete.ids.includes(id)))
    setConfirmDelete({show: false, ids: []})
  }

  return (
    <Stack space={4}>
      <Flex align="center" justify="space-between">
        <Stack space={3}>
          <Heading size={1}>Bulk Deletion of Unused Assets</Heading>
          {unusedAssets.length > 0 && (
            <Flex align="center" gap={3}>
              <Checkbox
                id="select-all-unused"
                checked={selectedIds.length === unusedAssets.length && unusedAssets.length > 0}
                indeterminate={selectedIds.length > 0 && selectedIds.length < unusedAssets.length}
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              />
              <Text size={1} weight="semibold" muted>
                {selectedIds.length > 0 ? `${selectedIds.length} Selected` : 'Select All'}
              </Text>
            </Flex>
          )}
        </Stack>

        <Flex gap={2}>
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

      {unusedAssets.length === 0 ? (
        <Card padding={5} border radius={3}>
          <Text align="center">No unused assets found.</Text>
        </Card>
      ) : (
        <Grid columns={[2, 3, 4, 5, 6]} gap={3}>
          {unusedAssets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              onClick={onAssetClick}
              isSelected={selectedIds.includes(asset._id)}
              onSelect={handleSelect}
            />
          ))}
        </Grid>
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
