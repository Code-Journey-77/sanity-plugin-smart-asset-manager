import {definePlugin} from 'sanity'
import {SmartAssetManagerTool} from '@/components/SmartAssetManagerTool'
import {FolderIcon} from '@/components/common/Icons'

export const smartAssetManager = definePlugin(() => {
  return {
    name: 'sanity-plugin-smart-asset-manager',
    tools: [
      {
        name: 'smart-asset-manager',
        title: 'Smart Asset Manager',
        component: SmartAssetManagerTool,
        icon: FolderIcon,
      },
    ],
  }
})
