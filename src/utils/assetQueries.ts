import type {SanityClient} from 'sanity'
import type {Asset, ReferencedDocument} from '@/types'

/**
 * Checks where a specific asset is used in the studio.
 */
export async function getAssetUsage(
  sanityClient: SanityClient,
  assetId: string,
): Promise<ReferencedDocument[]> {
  const query = `*[references($assetId)] {
    _id,
    _type,
    "title": coalesce(title, name, label, _id)
  }`

  return await sanityClient.fetch(query, {assetId})
}

/**
 * Finds all assets that are not referenced by any other document.
 */
export async function findUnusedAssets(sanityClient: SanityClient): Promise<Asset[]> {
  const query = `*[
    _type in ["sanity.imageAsset", "sanity.fileAsset"] &&
    count(*[references(^._id)]) == 0
  ] {
    _id,
    _type,
    url,
    size,
    extension,
    mimeType,
    originalFilename,
    _createdAt,
    metadata { dimensions }
  }`

  return await sanityClient.fetch(query)
}

/**
 * Bulk delete assets.
 */
export async function deleteAssets(
  sanityClient: SanityClient,
  assetIds: string[],
): Promise<unknown> {
  const transaction = sanityClient.transaction()
  assetIds.forEach((id) => transaction.delete(id))
  return await transaction.commit()
}

/**
 * Update asset original filename.
 */
export async function updateAssetFilename(
  sanityClient: SanityClient,
  assetId: string,
  filename: string,
): Promise<unknown> {
  return await sanityClient.patch(assetId).set({originalFilename: filename}).commit()
}

/**
 * Fetches all assets without pagination for full dataset size analysis.
 */
export async function fetchAllAssets(sanityClient: SanityClient): Promise<Asset[]> {
  try {
    const query = `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]] | order(size desc) {
      _id,
      _type,
      url,
      extension,
      size,
      mimeType,
      originalFilename,
      _createdAt,
      metadata { dimensions }
    }`
    return await sanityClient.fetch(query)
  } catch (error) {
    console.error('Error fetching all assets:', error)
    return []
  }
}
