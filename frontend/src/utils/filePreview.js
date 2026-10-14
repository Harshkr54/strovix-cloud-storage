import { resolveApiUrl } from './apiUrl.js';

function guessMimeFromName(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  return '';
}

export function isPdfFile(mimeType = '', name = '') {
  return mimeType.includes('pdf') || /\.pdf$/i.test(name);
}

export function isImageFile(mimeType = '') {
  return mimeType.startsWith('image/');
}

/**
 * Fetch file bytes and return a typed blob URL suitable for in-browser preview.
 */
export async function loadPreviewObjectUrl(file, downloadUrl) {
  if (!downloadUrl) throw new Error('Preview URL is missing');

  // Handle direct HTTP/HTTPS presigned S3 URLs
  if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
    try {
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const headerType = response.headers.get('Content-Type')?.split(';')[0]?.trim();
        const contentType =
          file?.mimeType ||
          headerType ||
          guessMimeFromName(file?.name) ||
          'application/octet-stream';

        const blob = new Blob([buffer], { type: contentType });
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn('Direct fetch of presigned URL failed (likely S3 CORS). Falling back to direct presigned URL:', err);
    }
    return downloadUrl;
  }

  const token = localStorage.getItem('accessToken');
  let fetchUrl = downloadUrl;

  if (fetchUrl.startsWith('/')) {
    const separator = fetchUrl.includes('?') ? '&' : '?';
    const mime = encodeURIComponent(file?.mimeType || guessMimeFromName(file?.name) || 'application/octet-stream');
    fetchUrl = resolveApiUrl(`${fetchUrl}${separator}inline=1&mimeType=${mime}`);
  }

  const needsAuth = fetchUrl.includes('/api/') || fetchUrl.startsWith(resolveApiUrl('/'));
  const response = await fetch(fetchUrl, {
    headers: needsAuth && token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to load file preview');
  }

  const buffer = await response.arrayBuffer();
  const headerType = response.headers.get('Content-Type')?.split(';')[0]?.trim();
  const contentType =
    file?.mimeType ||
    headerType ||
    guessMimeFromName(file?.name) ||
    'application/octet-stream';

  const blob = new Blob([buffer], { type: contentType });
  return URL.createObjectURL(blob);
}

export function revokePreviewObjectUrl(url) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export default {
  isPdfFile,
  isImageFile,
  loadPreviewObjectUrl,
  revokePreviewObjectUrl,
};
