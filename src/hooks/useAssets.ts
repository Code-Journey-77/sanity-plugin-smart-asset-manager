import {useState, useEffect} from 'react'
import type {SanityClient} from 'sanity'
import type {Asset, AssetTypeFilter, SizeFilter, SortOrder} from '@/types'

export function useAssets(
  sanityClient: SanityClient,
  searchQuery: string,
  sortBy: SortOrder,
  type: AssetTypeFilter,
  sizeFilter: SizeFilter,
  offset: number,
  limit: number,
) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const [refreshSeed, setRefreshSeed] = useState(0)
  const refreshAssets = () => setRefreshSeed((s) => s + 1)

  useEffect(() => {
    async function fetchAssets() {
      setLoading(true)
      try {
        let filterParts = ['_type in ["sanity.imageAsset", "sanity.fileAsset"]']

        if (type === 'image') {
          filterParts.push('_type == "sanity.imageAsset"')
        } else if (type === 'video') {
          filterParts.push(
            '(_type == "sanity.fileAsset" && (mimeType match "video/*" || extension in ["mp4", "webm", "mov", "mkv", "avi", "m4v"]))',
          )
        } else if (type === 'audio') {
          filterParts.push(
            '(_type == "sanity.fileAsset" && (mimeType match "audio/*" || extension in ["mp3", "wav", "ogg", "m4a", "flac", "aac"]))',
          )
        } else if (type === 'file') {
          filterParts.push(
            '_type == "sanity.fileAsset" && !(mimeType match "video/*") && !(mimeType match "audio/*") && !(extension in ["mp4", "webm", "mov", "mkv", "avi", "m4v", "mp3", "wav", "ogg", "m4a", "flac", "aac"])',
          )
        }

        if (sizeFilter === 'small') {
          filterParts.push('size < 102400')
        } else if (sizeFilter === 'medium') {
          filterParts.push('size >= 102400 && size < 1048576')
        } else if (sizeFilter === 'large') {
          filterParts.push('size >= 1048576')
        }

        const trimmedSearch = searchQuery.trim()
        const params: Record<string, string> = {}
        if (trimmedSearch) {
          filterParts.push(
            '(originalFilename match $searchQuery || _id match $searchQuery || extension match $searchQuery)',
          )
          params.searchQuery = `*${trimmedSearch}*`
        }

        let orderClause = '_createdAt desc'
        if (sortBy === '_createdAt') {
          orderClause = '_createdAt desc'
        } else if (sortBy === '_createdAt_asc') {
          orderClause = '_createdAt asc'
        } else if (sortBy === 'originalFilename' || sortBy === 'name_asc') {
          orderClause = 'lower(originalFilename) asc'
        } else if (sortBy === 'name_desc') {
          orderClause = 'lower(originalFilename) desc'
        } else if (sortBy === 'size' || sortBy === 'size_desc') {
          orderClause = 'size desc'
        } else if (sortBy === 'size_asc') {
          orderClause = 'size asc'
        }

        const filter = filterParts.join(' && ')
        const countQuery = `count(*[${filter}])`
        const query = `*[${filter}] | order(${orderClause}) [${offset}...${offset + limit}] {
          _id,
          _type,
          url,
          extension,
          size,
          mimeType,
          originalFilename,
          _createdAt,
          metadata {
            dimensions
          }
        }`

        const [totalCount, results] = await Promise.all([
          sanityClient.fetch(countQuery, params),
          sanityClient.fetch(query, params),
        ])

        setTotal(totalCount)
        setAssets(results || [])
      } catch (error) {
        console.error('Error fetching assets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [sanityClient, searchQuery, sortBy, type, sizeFilter, refreshSeed, offset, limit])

  return {assets, loading, total, refreshAssets}
}
