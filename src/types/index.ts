export interface Asset {
  _id: string
  _ref?: string
  _type: string
  url: string
  extension: string
  mimeType?: string
  size: number
  originalFilename?: string
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
export type SortOrder = '_createdAt' | 'size' | 'originalFilename'
export type AssetTypeFilter = 'all' | 'image' | 'file' | 'video' | 'audio'
export type SizeFilter = 'all' | 'small' | 'medium' | 'large'
