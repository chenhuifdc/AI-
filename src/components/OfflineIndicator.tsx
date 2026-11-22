import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-offline-indicator"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2 rounded-lg bg-amber-900 text-amber-50 border border-amber-700 px-3.5 py-2.5 text-xs font-medium shadow-lg"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
      <span>当前处于离线模式 · 核心学习内容与安全演练已从本地缓存加载</span>
    </div>
  );
}
