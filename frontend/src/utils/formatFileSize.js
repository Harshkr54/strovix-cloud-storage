export function formatFileSize(bytes = 0) {
  const num = Number(bytes);
  if (!num || isNaN(num) || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
  if (i <= 0) return `${num} B`;
  const value = num / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export default formatFileSize;
