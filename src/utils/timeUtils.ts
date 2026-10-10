export function formatTimeAgo(timestampMs?: number, fallbackString?: string): string {
  if (!timestampMs) {
    return fallbackString || 'Hace un momento';
  }

  const diffMs = Date.now() - timestampMs;
  if (diffMs < 0) return 'Hace un momento';

  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) {
    return 'Hace un momento';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Hace ${diffMin} min`;
  }

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `Hace ${diffHr} ${diffHr === 1 ? 'hora' : 'horas'}`;
  }

  const diffDays = Math.floor(diffHr / 24);
  return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
}
