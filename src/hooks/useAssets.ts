import {useState, useEffect} from 'react'
import type {SanityClient} from 'sanity'
import type {Asset, AssetTypeFilter, SortOrder} from '@/types'

export function useAssets(
  sanityClient: SanityClient,
  searchQuery: string,
  sortBy: SortOrder,
  type: AssetTypeFilter,
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
        } else if (type === 'file') {
          filterParts.push(
            '_type == "sanity.fileAsset" && !(mimeType match "video/*") && !(mimeType match "audio/*")',
          )
        } else if (type === 'video') {
          filterParts.push('_type == "sanity.fileAsset" && mimeType match "video/*"')
        } else if (type === 'audio') {
          filterParts.push('_type == "sanity.fileAsset" && mimeType match "audio/*"')
        }

        if (searchQuery) {
          filterParts.push('(originalFilename match $searchQuery || _id match $searchQuery)')
        }

        const filter = filterParts.join(' && ')
        const countQuery = `count(*[${filter}])`
        const query = `*[${filter}] | order(${sortBy} desc) [${offset}...${offset + limit}] {
                                 _id,
                                 _type,
                                 url,
                                 extension,
                                 size,
                                 mimeType,
                                 originalFilename,
                                 metadata {
                                     dimensions
                                 }
                                 }`

        const [totalCount, results] = await Promise.all([
          sanityClient.fetch(countQuery, {searchQuery: `*${searchQuery}*`}),
          sanityClient.fetch(query, {searchQuery: `*${searchQuery}*`}),
        ])

        setTotal(totalCount)
        setAssets(results)
      } catch (error) {
        console.error('Error fetching assets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [sanityClient, searchQuery, sortBy, type, refreshSeed, offset, limit])

  return {assets, loading, total, refreshAssets}
}
