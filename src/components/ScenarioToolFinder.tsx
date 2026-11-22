import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Globe,
  Play,
  RotateCcw,
  Search,
  SkipForward,
  X,
} from 'lucide-react';
import { LIFE_SCENARIO_PRESETS } from '../data/scenarioMatcherData';
import type { PrincipleDiagramNode } from '../types/learning';
import { matchLifeScenarioTools } from '../utils/scenarioMatcher';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';

interface ScenarioToolFinderProps {
  onJumpToEcosystemTool: (ecosystemToolId: string) => void;
  onLookupOnline: (term: string) => void;
}

const NODE_ACCENT_STYLES: Record<
  PrincipleDiagramNode['accent'],
  { activeBox: string; stageText: string; circleFill: string }
> = {
  blue: {
    activeBox: 'border-blue-600 bg-blue-50/75 ring-2 ring-blue-100',
    stageText: 'text-blue-700',
    circleFill: '#1D4ED8',
  },
  indigo: {
    activeBox: 'border-indigo-600 bg-indigo-50/75 ring-2 ring-indigo-100',
    stageText: 'text-indigo-700',
    circleFill: '#4338CA',
  },
  amber: {
    activeBox: 'border-amber-600 bg-amber-50/75 ring-2 ring-amber-100',
    stageText: 'text-amber-800',
    circleFill: '#B45309',
  },
  emerald: {
    activeBox: 'border-emerald-600 bg-emerald-50/75 ring-2 ring-emerald-100',
    stageText: 'text-emerald-700',
    circleFill: '#047857',
  },
};

export function ScenarioToolFinder({
  onJumpToEcosystemTool,
  onLookupOnline,
}: ScenarioToolFinderProps) {
  const [query, setQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('doc-n8n');
  const [activeNodeIdx, setActiveNodeIdx] = useState<number>(0);

  const matchResponse = useMemo(() => matchLifeScenarioTools(query), [query]);
  const matches = matchResponse.matches;

  useEffect(() => {
    if (matches.length > 0 && !matches.some((m) => m.entry.id === selectedId)) {
      setSelectedId(matches[0].entry.id);
      setActiveNodeIdx(0);
    }
  }, [matches, selectedId]);

  const activeMatch =
    matches.find((m) => m.entry.id === selectedId) ?? matches[0] ?? null;
  const activeEntry = activeMatch?.entry ?? null;
  const activeNode = activeEntry
    ? activeEntry.diagramNodes[activeNodeIdx] ?? activeEntry.diagramNodes[0]
    : null;

  const handleSelectPreset = (presetQuery: string) => {
    setQuery(presetQuery);
    setActiveNodeIdx(0);
  };

  const handleClear = () => {
    setQuery('');
    setActiveNodeIdx(0);
  };

  const handleSelectEntry = (id: string) => {
    setSelectedId(id);
    setActiveNodeIdx(0);
  };

  const handleNextStep = () => {
    if (!activeEntry) return;
    setActiveNodeIdx((prev) => (prev + 1) % activeEntry.diagramNodes.length);
  };

  return (
    <section
      id="scenario-tool-finder"
      aria-label="按生活场景搜索开源工具与应用原理图"
      className="scroll-mt-24 bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <p className="text-xs font-medium text-blue-700">
            01. 生活场景匹配开源工具 · 秒出简要应用原理图
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            输入你的真实生活场景，立刻推荐开源工具并看懂原理图
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            不知道某个想法该用什么开源工具？直接输入「整理文档」「监控股票」「智能家居」或日常痛点，系统实时过滤推荐工具并生成该场景下的 4 步运行原理图。
          </p>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
          {matchResponse.isDefaultView
            ? `精选 ${matches.length} 个高频场景原理图`
            : `已为「${matchResponse.normalizedQuery}」匹配 ${matches.length} 套开源方案`}
        </div>
      </div>

      {/* Interactive Search Bar + Quick Scenario Presets */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => e.preventDefault()}
          role="search"
          aria-label="按生活场景过滤开源工具"
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <label htmlFor="life-scenario-search-input" className="sr-only">
              输入生活或工作场景，例如整理文档、监控股票、智能家居
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="life-scenario-search-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveNodeIdx(0);
              }}
              placeholder="输入生活或工作场景，例如：整理文档、监控股票、智能家居、处理发票、部署网站..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="清空生活场景搜索"
                className="p-1.5 text-slate-400 hover:text-slate-700 absolute right-2 top-1/2 -translate-y-1/2 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              重置筛选
            </button>
          )}
        </form>

        {/* Preset Scenario Buttons */}
        <div
          role="group"
          aria-label="常见生活场景快捷选择"
          data-glossary-ignore="true"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-slate-500 mr-0.5">试试这些场景：</span>
          {LIFE_SCENARIO_PRESETS.map((preset) => {
            const isActive =
              matchResponse.normalizedQuery.toLowerCase() ===
              preset.query.toLowerCase();
            return (
              <button
                key={preset.query}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelectPreset(preset.query)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Area: Two-Zone Recommendation List + Interactive Schematic Diagram */}
      {matches.length === 0 ? (
        <div
          data-testid="scenario-empty-state"
          className="rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center space-y-4"
        >
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-semibold text-slate-900">
              内置场景库暂未找到「{matchResponse.normalizedQuery}」的直接匹配
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              可以换更通用的生活关键词（如「文档」「股票」「提醒」「家居」「部署」），或直接把需求交给下方联网搜索实时生成图解。
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:border-slate-400 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              返回精选场景列表
            </button>
            <button
              type="button"
              onClick={() => onLookupOnline(matchResponse.normalizedQuery)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>联网图解「{matchResponse.normalizedQuery}」</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Zone: Filtered Open-Source Tool Recommendations */}
          <div className="lg:col-span-5 space-y-2.5" data-testid="scenario-match-list">
            <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
              <span>
                {matchResponse.isDefaultView
                  ? '推荐开源工具方案（点选查看对应原理图）'
                  : '按场景匹配度排序'}
              </span>
              <span className="tabular-nums">共 {matches.length} 项</span>
            </div>

            <div className="space-y-2.5">
              {matches.map((item) => {
                const isSelected = activeEntry?.id === item.entry.id;
                return (
                  <button
                    key={item.entry.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSelectEntry(item.entry.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/55 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        data-glossary-ignore="true"
                        className="text-base font-bold text-slate-900"
                      >
                        {item.entry.toolName}
                      </span>
                      <span className="text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
                        {item.entry.scenarioCategory}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.entry.licenseLabel}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mt-2">
                      {item.entry.oneLineReason}
                    </p>
                    {item.matchedTerms.length > 0 && !matchResponse.isDefaultView && (
                      <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        匹配关键词：{item.matchedTerms.join(' · ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Zone: Interactive Application Principle Schematic Diagram */}
          {activeEntry && activeNode && (
            <div
              data-testid="scenario-principle-diagram"
              className="lg:col-span-7 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5"
            >
              {/* Diagram Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">简要应用原理图</span>
                    <span aria-hidden="true">·</span>
                    <span data-glossary-ignore="true" className="font-medium text-slate-800">
                      {activeEntry.toolName}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {activeEntry.scenarioTitle}
                  </h3>
                  <p className="text-xs text-slate-500">{activeEntry.deployHint}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {activeNodeIdx === 0 ? (
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span className="tabular-nums">
                      逐步推演（{activeNodeIdx + 1}/4）
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNodeIdx(0)}
                    aria-label="重置原理图步骤"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>重置</span>
                  </button>
                </div>
              </div>

              {/* SVG Architectural Schematic Track with Labeled Data Flow Arrows */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="hidden md:block" aria-hidden="true">
                  <svg
                    viewBox="0 0 800 80"
                    className="w-full h-[80px] overflow-visible"
                  >
                    {activeEntry.dataFlowLabels.map((flowLabel, segIdx) => {
                      const x1 = 95 + segIdx * 203;
                      const x2 = 95 + (segIdx + 1) * 203;
                      const midX = (x1 + x2) / 2;
                      const isPassed = segIdx < activeNodeIdx;
                      return (
                        <g key={flowLabel}>
                          <line
                            x1={x1 + 22}
                            y1={48}
                            x2={x2 - 26}
                            y2={48}
                            stroke={isPassed ? '#1D4ED8' : '#CBD5E1'}
                            strokeWidth={isPassed ? 2.5 : 2}
                            strokeDasharray={isPassed ? 'none' : '4 4'}
                          />
                          <polygon
                            points={`${x2 - 28},42 ${x2 - 17},48 ${x2 - 28},54`}
                            fill={isPassed ? '#1D4ED8' : '#CBD5E1'}
                          />
                          <text
                            x={midX}
                            y={26}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="600"
                            fill={isPassed ? '#1D4ED8' : '#475569'}
                          >
                            {flowLabel}
                          </text>
                        </g>
                      );
                    })}
                    {activeEntry.diagramNodes.map((node, idx) => {
                      const cx = 95 + idx * 203;
                      const isReached = idx <= activeNodeIdx;
                      const isCurrent = idx === activeNodeIdx;
                      const accentStyle = NODE_ACCENT_STYLES[node.accent];
                      return (
                        <g key={node.stepNumber}>
                          <circle
                            cx={cx}
                            cy={48}
                            r={isCurrent ? 18 : 15}
                            fill={isReached ? accentStyle.circleFill : '#FFFFFF'}
                            stroke={isReached ? accentStyle.circleFill : '#94A3B8'}
                            strokeWidth={2}
                          />
                          <text
                            x={cx}
                            y={53}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="700"
                            fill={isReached ? '#FFFFFF' : '#475569'}
                          >
                            0{node.stepNumber}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* 4 Clickable Schematic Nodes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeEntry.diagramNodes.map((node, idx) => {
                    const isSelected = idx === activeNodeIdx;
                    const accentStyle = NODE_ACCENT_STYLES[node.accent];
                    return (
                      <button
                        key={node.stepNumber}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setActiveNodeIdx(idx)}
                        className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                          isSelected
                            ? accentStyle.activeBox
                            : 'border-slate-200 bg-slate-50/50 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1 tabular-nums">
                          <span className={`font-semibold ${accentStyle.stageText}`}>
                            0{node.stepNumber} · {node.stageLabel}
                          </span>
                          {idx < activeEntry.dataFlowLabels.length && (
                            <span className="text-[11px] text-slate-400 md:hidden">
                              → {activeEntry.dataFlowLabels[idx]}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {node.title}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {node.techDetail}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Node Principle Callout */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">
                    当前焦点（0{activeNode.stepNumber} {activeNode.stageLabel}）：
                  </span>
                  {activeNode.title} — {activeNode.techDetail}
                </div>
              </div>

              {/* Plain-Language Principle Summary */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-900">
                  场景运行原理解读
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  <GlossaryText text={activeEntry.principleSummary} />
                </p>
                <p className="text-xs text-slate-500">
                  落地建议：{activeEntry.quickStartHint}
                </p>
              </div>

              {/* Quick Command + Action Links */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {activeEntry.ecosystemToolId && (
                    <button
                      type="button"
                      data-glossary-ignore="true"
                      onClick={() =>
                        onJumpToEcosystemTool(activeEntry.ecosystemToolId!)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>看 {activeEntry.toolName} 完整案例详解</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    data-glossary-ignore="true"
                    onClick={() => onLookupOnline(activeEntry.toolName)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>联网查更多用法</span>
                  </button>
                </div>

                {activeEntry.quickCommand && (
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 max-w-full">
                    <code className="text-[11px] font-mono text-slate-800 truncate max-w-[200px] sm:max-w-[220px]">
                      {activeEntry.quickCommand}
                    </code>
                    <CopyButton
                      text={activeEntry.quickCommand}
                      label="复制"
                      ariaLabel={`复制 ${activeEntry.toolName} 启动命令`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
