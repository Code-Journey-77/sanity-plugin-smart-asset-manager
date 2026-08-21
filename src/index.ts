import {FolderIcon} from '@/components/common/Icons'
import {SmartAssetManagerTool} from '@/components/SmartAssetManagerTool'
import type {SmartAssetManagerConfig} from '@/types'
import {definePlugin} from 'sanity'

export const smartAssetManager = definePlugin<SmartAssetManagerConfig | void>(
  (config?: SmartAssetManagerConfig) => {
    return {
      name: 'sanity-plugin-smart-asset-manager',
      tools: [
        {
          name: config?.name || 'smart-asset-manager',
          title: config?.title || 'Smart Asset Manager',
          component: SmartAssetManagerTool,
          icon: config?.icon || FolderIcon,
        },
      ],
    }
  },
)

export {SmartAssetManagerTool} from '@/components/SmartAssetManagerTool'
export type {
  Asset,
  AssetTab,
  AssetTypeFilter,
  ReferencedDocument,
  SizeFilter,
  SmartAssetManagerConfig,
  SortOrder,
  UsageInfo,
  ViewMode,
} from '@/types'
export {formatBytes} from '@/utils/formatBytes'
