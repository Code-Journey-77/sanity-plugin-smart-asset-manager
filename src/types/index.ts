export interface Asset {
  _id: string
  _ref?: string
  _type: string
  url: string
  extension: string
  mimeType?: string
  size: number
  originalFilename?: string
  _createdAt?: string
  metadata?: {
    dimensions?: {
      width: number
      height: number
    }
  }
}

export interface ReferencedDocument {
  _id: string
  _type: string
  title: string
}

export type UsageInfo = {[assetId: string]: ReferencedDocument[]}

export type AssetTab = 'all' | 'analysis' | 'unused'
export type SortOrder =
  | '_createdAt'
  | '_createdAt_asc'
  | 'size'
  | 'size_desc'
  | 'size_asc'
  | 'originalFilename'
  | 'name_asc'
  | 'name_desc'
export type AssetTypeFilter = 'all' | 'image' | 'file' | 'video' | 'audio'
export type SizeFilter = 'all' | 'small' | 'medium' | 'large'
export type ViewMode = 'grid' | 'list'

export interface SmartAssetManagerConfig {
  title?: string
  name?: string
  icon?: React.ComponentType
  apiVersion?: string
}
