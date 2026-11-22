import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Search, X } from 'lucide-react';
import {
  GLOSSARY_ENTRIES,
  type GlossaryCategory,
} from '../data/glossaryData';
import { useGlossaryMode } from '../context/GlossaryContext';
import { filterGlossaryTerms } from '../utils/glossary';

const CATEGORY_TABS: Array<{ id: GlossaryCategory | 'ALL'; label: string }> = [
  { id: 'ALL', label: `全部 (${GLOSSARY_ENTRIES.length})` },
  { id: 'AI 与开源底座', label: 'AI 与开源底座' },
  { id: '协议与开发接口', label: '协议与开发接口' },
  { id: '网络安全与攻防', label: '网络安全与攻防' },
];

export function GlossaryControlsButton() {
  const {
    inlineGlossEnabled,
    setInlineGlossEnabled,
    globalAutoEnabled,
    setGlobalAutoEnabled,
    autoDetectedCount,
  } = useGlossaryMode();
  const [open, setOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<GlossaryCategory | 'ALL'>('ALL');
  const [query, setQuery] = useState<string>('');

  const filtered = useMemo(
    () => filterGlossaryTerms(GLOSSARY_ENTRIES, category, query),
    [category, query]
  );

  const modalNode = open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-modal-title"
        data-testid="glossary-dictionary-modal"
        data-glossary-ignore="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 id="glossary-modal-title" className="text-base font-bold text-slate-900">
              专业英文术语中英注解词典
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              页面中带虚线下划线的英文名词均支持鼠标悬浮或手机轻点查看大白话释义
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭术语词典"
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Display Mode Switch & Global Auto-Scan Control */}
        <div className="px-6 py-3.5 bg-[#F7F8FA] border-b border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900">正文注解显示方式：</span>
              <span>
                {inlineGlossEnabled
                  ? '已开启「中文旁注 + 悬浮详释」（如 WAF（网页应用防火墙））'
                  : '仅「悬浮/轻点弹窗释义」（保持正文极简清爽）'}
              </span>
            </div>
            <div
              role="group"
              aria-label="切换英文术语注解模式"
              className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0"
            >
              <button
                type="button"
                aria-pressed={inlineGlossEnabled}
                onClick={() => setInlineGlossEnabled(true)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  inlineGlossEnabled
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                旁注 + 悬浮
              </button>
              <button
                type="button"
                aria-pressed={!inlineGlossEnabled}
                onClick={() => setInlineGlossEnabled(false)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  !inlineGlossEnabled
                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                仅悬浮注解
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs">
            <span className="text-slate-600" data-testid="global-glossary-status">
              全局自动识别装饰：
              {globalAutoEnabled
                ? `已开启（额外自动高亮页面中 ${autoDetectedCount} 处英文术语）`
                : '已暂停全局自动识别'}
            </span>
            <label className="inline-flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="global-glossary-toggle"
                checked={globalAutoEnabled}
                onChange={(e) => setGlobalAutoEnabled(e.target.checked)}
                className="rounded border-slate-300 accent-blue-700 cursor-pointer"
              />
              <span>自动识别全页术语</span>
            </label>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="px-6 py-3.5 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索英文缩写或中文含义，例如：MCP、WAF、RAG、量化、木马..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Term List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              未找到匹配「{query}」的术语，可换一个关键词试试。
            </div>
          ) : (
            filtered.map((entry) => (
              <div key={entry.term} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {entry.term}
                  </span>
                  {entry.aliases && entry.aliases.length > 0 && (
                    <span className="font-mono text-xs text-slate-500">
                      / {entry.aliases.join(' / ')}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-blue-700">
                    {entry.shortCn}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-400">{entry.category}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{entry.plainExplain}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        data-testid="glossary-controls-button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <BookOpen className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">术语</span>
        <span className="hidden sm:inline">术语注解</span>
      </button>

      {modalNode && typeof document !== 'undefined'
        ? createPortal(modalNode, document.body)
        : null}
    </>
  );
}
