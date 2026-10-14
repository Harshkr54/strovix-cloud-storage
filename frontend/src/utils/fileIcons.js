import {
  File,
  FileImage,
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  Folder,
} from 'lucide-react';

export function getFileIcon(mimeType = '', isFolder = false) {
  if (isFolder) return Folder;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return FileText;
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return FileSpreadsheet;
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
    return FileArchive;
  }
  return File;
}

export function canPreview(mimeType = '') {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/json'
  );
}

export default { getFileIcon, canPreview };
