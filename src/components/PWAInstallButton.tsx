import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { actionMode, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Suppress install UI automatically when running as an installed standalone PWA
  if (actionMode === 'hidden') {
    return null;
  }

  const handleCopyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  if (actionMode === 'native-prompt') {
    return (
      <button
        type="button"
        data-testid="pwa-install-button"
        onClick={() => {
          void install();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">安装</span>
        <span className="hidden sm:inline">安装应用</span>
      </button>
    );
  }

  const modalContent = showGuide ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      onClick={() => setShowGuide(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-ios-guide-title"
        data-testid="pwa-ios-guide-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/apple-touch-icon.png"
              alt="开源复用实验室应用图标"
              className="w-11 h-11 rounded-xl border border-slate-200 shrink-0"
            />
            <div>
              <h3
                id="pwa-ios-guide-title"
                className="text-base font-bold text-slate-900"
              >
                添加到 iPhone 主屏幕（支持离线学习）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                开源实验室 · 独立全屏模式 + 离线资源缓存
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭安装引导"
            onClick={() => setShowGuide(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ol className="space-y-3 text-xs text-slate-700">
          <li className="flex items-start gap-3 rounded-lg bg-[#F7F8FA] border border-slate-200/80 p-3">
            <span className="w-5 h-5 rounded-md bg-blue-700 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <div className="leading-relaxed">
              在 iPhone 上使用 <strong>Safari 浏览器</strong>打开本应用链接（若当前在电脑端，可点击下方按钮复制链接发送到手机）。
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-[#F7F8FA] border border-slate-200/80 p-3">
            <span className="w-5 h-5 rounded-md bg-blue-700 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <div className="leading-relaxed">
              点击 Safari 底部工具栏的{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                <Share className="w-3.5 h-3.5 inline" aria-hidden="true" />
                分享
              </span>{' '}
              图标，向上滑动菜单找到并点击 <strong>「添加到主屏幕」</strong>。
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-lg bg-[#F7F8FA] border border-slate-200/80 p-3">
            <span className="w-5 h-5 rounded-md bg-blue-700 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <div className="leading-relaxed">
              点击右上角 <strong>「添加」</strong>。之后从桌面图标启动即可享受无地址栏全屏体验；核心课程、交互架构图与安全攻防演练已通过 Service Worker 自动缓存，断网也可学习。
            </div>
          </li>
        </ol>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyCurrentUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>已复制当前链接</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>复制链接发到 iPhone</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        data-testid="pwa-install-button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Smartphone className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">安装</span>
        <span className="hidden sm:inline">{isIOS ? '添加到主屏幕' : '安装到 iPhone'}</span>
      </button>

      {modalContent && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
