import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Globe,
  Loader2,
  RotateCcw,
  Search,
} from 'lucide-react';
import { ONLINE_TOOL_QUICK_SEARCHES } from '../data/ecosystemData';
import type { ToolExplainerResult } from '../types/learning';
import { validateToolSearchQuery } from '../utils/toolExplainer';
import { GlossaryText } from './GlossaryText';

interface OnlineToolExplainerProps {
  externalQuery?: { term: string; nonce: number } | null;
}

const STEP_ACCENTS = [
  { border: 'border-blue-300', bg: 'bg-blue-50/70', text: 'text-blue-700', stroke: '#1D4ED8' },
  { border: 'border-indigo-300', bg: 'bg-indigo-50/70', text: 'text-indigo-700', stroke: '#4338CA' },
  { border: 'border-amber-300', bg: 'bg-amber-50/70', text: 'text-amber-800', stroke: '#B45309' },
  { border: 'border-emerald-300', bg: 'bg-emerald-50/70', text: 'text-emerald-700', stroke: '#047857' },
];

export function OnlineToolExplainer({ externalQuery }: OnlineToolExplainerProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ToolExplainerResult | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const runSearch = async (rawQuery: string) => {
    const check = validateToolSearchQuery(rawQuery);
    if (!check.valid) {
      setValidationError(check.error ?? '请输入有效的工具名称');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setLoading(true);
    setInputValue(check.query);

    try {
      const response = await fetch('/api/tool-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: check.query }),
      });

      const payload = (await response.json()) as ToolExplainerResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || '联网检索失败，请稍后重试。');
      }

      setResult(payload);
      setActiveStepIndex(0);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : '网络请求异常，请检查连接后重试。'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalQuery && externalQuery.term.trim()) {
      void runSearch(externalQuery.term);
    }
  }, [externalQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runSearch(inputValue);
  };

  const activeStep = result?.steps[activeStepIndex] ?? result?.steps[0];

  return (
    <section
      id="online-tool-explainer"
      aria-label="联网搜工具与场景化图解"
      className="scroll-mt-24 bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-blue-700">
            02. 联网实时查工具 · 自动生成大白话与场景流程图
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            遇到陌生的 AI 或建站工具？联网搜一下，直接用场景图看懂
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            输入任意工具名或技术概念（如 Supabase、Directus、Zapier、Vercel、FastGPT），系统实时联网核实后，自动给出生活类比、真实落地案例与可点击流程拆解。
          </p>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap shrink-0">
          实时联网检索 · 附官方网页来源引用
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <label htmlFor="online-tool-search-input" className="sr-only">
              输入想联网查询的工具或技术名词
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="online-tool-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="输入任意工具名，例如：Cloudflare、n8n、Supabase、Directus、Coze..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>联网检索图解中...</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span>联网图解含义</span>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <p role="alert" className="text-xs text-rose-700 font-medium">
            {validationError}
          </p>
        )}

        {/* Quick Search Buttons */}
        <div data-glossary-ignore="true" className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-500 mr-1">一键试查：</span>
          {ONLINE_TOOL_QUICK_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              disabled={loading}
              onClick={() => void runSearch(term)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {term}
            </button>
          ))}
        </div>
      </form>

      {/* API Error State */}
      {apiError && !loading && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="text-sm text-rose-800">{apiError}</div>
          <button
            type="button"
            onClick={() => void runSearch(inputValue)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-800 bg-white border border-rose-300 hover:bg-rose-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>重新搜索</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="border-t border-slate-200 pt-6 space-y-4" aria-live="polite">
          <div className="text-sm font-medium text-blue-700">
            正在联网检索「{inputValue}」的最新资料并生成场景化可视化流程...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      )}

      {/* Grounded Visual Explanation Result */}
      {result && !loading && (
        <div className="border-t border-slate-200 pt-6 space-y-6">
          {/* Header summary */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-blue-700">{result.categoryLayer}</span>
                <span aria-hidden="true">·</span>
                <span>{result.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span>{result.grounded ? '已通过实时联网核验' : '已完成结构化解析'}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {result.toolName}
                <span className="font-normal text-slate-500 text-base ml-2.5">
                  — {result.chineseSubtitle}
                </span>
              </h3>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                一句话类比：{result.oneLineAnalogy}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                <GlossaryText text={result.plainDefinition} />
              </p>
            </div>
            <div className="lg:w-72 shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
              <div className="text-xs font-semibold text-slate-700">最适合什么情况？</div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.bestFor}</p>
            </div>
          </div>

          {/* Visual Scenario Flowchart */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-slate-900">{result.scenarioTitle}</h4>
              <span className="text-xs text-slate-500">点击下方任意流程节点查看数据细节</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {result.steps.map((step, idx) => {
                const style = STEP_ACCENTS[idx % STEP_ACCENTS.length];
                const isSelected = idx === activeStepIndex;
                return (
                  <div key={step.stepNumber} className="relative flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveStepIndex(idx)}
                      aria-pressed={isSelected}
                      className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        isSelected
                          ? `${style.border} ${style.bg} ring-2 ring-blue-100`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
                        <span className={`font-semibold ${style.text}`}>
                          步骤 0{step.stepNumber}
                        </span>
                        <span>{step.role}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mb-1.5">
                        {step.nodeName}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {step.action}
                      </p>
                    </button>
                    {idx < result.steps.length - 1 && (
                      <div
                        aria-hidden="true"
                        className="hidden xl:flex items-center justify-center text-slate-400 shrink-0"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Step Callout */}
            {activeStep && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 tabular-nums">
                    当前查看：步骤 0{activeStep.stepNumber} · {activeStep.role} · {activeStep.nodeName}
                  </div>
                  <p className="text-sm text-slate-800">{activeStep.action}</p>
                </div>
                <div className="md:max-w-sm shrink-0 bg-white border border-slate-200 rounded-md px-3 py-2 font-mono text-xs text-slate-700">
                  示例数据：{activeStep.sampleData}
                </div>
              </div>
            )}

            {/* Before vs After */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                <div className="text-xs font-semibold text-slate-700">没用之前（痛点）</div>
                <p className="text-sm text-slate-600 leading-relaxed">{result.painBefore}</p>
              </div>
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1">
                <div className="text-xs font-semibold text-emerald-800">用上之后（效果）</div>
                <p className="text-sm text-slate-700 leading-relaxed">{result.outcomeAfter}</p>
              </div>
            </div>
          </div>

          {/* Related Tools + Verified Web Sources */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            {result.relatedTools.length > 0 && (
              <div data-glossary-ignore="true" className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">继续对比或搭配查询：</span>
                {result.relatedTools.map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => void runSearch(rel)}
                    className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    查 {rel}
                  </button>
                ))}
              </div>
            )}

            {result.sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>联网参考来源：</span>
                {result.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline max-w-[200px] truncate"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
