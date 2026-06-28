import { BASE_URL } from '../../lib/api'

export function getListingCoverUrl(listing) {
  if (!listing?.cover_image_path) {
    return ''
  }
  return `${BASE_URL}/${listing.cover_image_path}`
}

export function getFirstImagePath(mediaItems) {
  return mediaItems.find((item) => item.media_type === 'image')?.file_path || ''
}

export function getMediaUrl(filePath) {
  if (!filePath) {
    return ''
  }
  return `${BASE_URL}/${filePath}`
}