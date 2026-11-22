import { useEffect, useMemo, useState } from 'react';
import { Globe, Play, RotateCcw, SkipForward } from 'lucide-react';
import {
  ECOSYSTEM_COMPARE_ROWS,
  ECOSYSTEM_TOOL_SCENARIOS,
} from '../data/ecosystemData';
import type { EcosystemToolCategory, ToolFlowStep } from '../types/learning';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';

interface EcosystemToolExplorerProps {
  onLookupOnline: (toolName: string) => void;
  externalToolSelection?: { id: string; nonce: number } | null;
}

const CATEGORY_TABS: Array<{ id: EcosystemToolCategory; label: string }> = [
  { id: 'all', label: '全部 9 款' },
  { id: 'edge-infra', label: '公网部署与边缘' },
  { id: 'workflow', label: '自动化流水线' },
  { id: 'ai-agent-platform', label: 'AI 智能体平台' },
  { id: 'iot-script', label: '脚本与物联网' },
];

const ACCENT_MAP: Record<
  ToolFlowStep['accent'],
  { stroke: string; activeBox: string; text: string }
> = {
  blue: {
    stroke: '#1D4ED8',
    activeBox: 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100',
    text: 'text-blue-700',
  },
  indigo: {
    stroke: '#4338CA',
    activeBox: 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-100',
    text: 'text-indigo-700',
  },
  amber: {
    stroke: '#B45309',
    activeBox: 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-100',
    text: 'text-amber-800',
  },
  emerald: {
    stroke: '#047857',
    activeBox: 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100',
    text: 'text-emerald-700',
  },
};

export function EcosystemToolExplorer({
  onLookupOnline,
  externalToolSelection,
}: EcosystemToolExplorerProps) {
  const [category, setCategory] = useState<EcosystemToolCategory>('all');
  const [selectedToolId, setSelectedToolId] = useState<string>(ECOSYSTEM_TOOL_SCENARIOS[0].id);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  useEffect(() => {
    if (!externalToolSelection?.id) return;
    const matched = ECOSYSTEM_TOOL_SCENARIOS.find((t) => t.id === externalToolSelection.id);
    if (matched) {
      setCategory('all');
      setSelectedToolId(matched.id);
      setActiveStepIdx(0);
    }
  }, [externalToolSelection]);

  const visibleTools = useMemo(() => {
    if (category === 'all') return ECOSYSTEM_TOOL_SCENARIOS;
    return ECOSYSTEM_TOOL_SCENARIOS.filter((t) => t.category === category);
  }, [category]);

  const activeTool =
    visibleTools.find((t) => t.id === selectedToolId) ??
    ECOSYSTEM_TOOL_SCENARIOS.find((t) => t.id === selectedToolId) ??
    ECOSYSTEM_TOOL_SCENARIOS[0];

  const activeStep = activeTool.steps[activeStepIdx] ?? activeTool.steps[0];

  const handleCategoryChange = (nextCategory: EcosystemToolCategory) => {
    setCategory(nextCategory);
    const matching =
      nextCategory === 'all'
        ? ECOSYSTEM_TOOL_SCENARIOS
        : ECOSYSTEM_TOOL_SCENARIOS.filter((t) => t.category === nextCategory);
    if (matching.length > 0 && !matching.some((t) => t.id === selectedToolId)) {
      setSelectedToolId(matching[0].id);
      setActiveStepIdx(0);
    }
  };

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveStepIdx(0);
  };

  const handleNextStep = () => {
    setActiveStepIdx((prev) => (prev + 1) % activeTool.steps.length);
  };

  return (
    <section
      id="ecosystem-tools"
      aria-label="九大热门部署、自动化与智能体工具场景图解"
      className="scroll-mt-24 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <p className="text-xs font-medium text-blue-700">
            03. 九大热门工具真实场景可视化图谱
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            九大核心工具实战场景：从公网部署到自动化编排
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            涵盖 Cloudflare、Vercel、Render、n8n、Activepieces、Windmill、Node-RED、Coze 与腾讯元器——点选下方工具，通过真实案例 4 步流转图一眼看懂。
          </p>
        </div>

        {/* Category Filter Segmented Control */}
        <div
          role="group"
          aria-label="按工具分类筛选"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0"
        >
          {CATEGORY_TABS.map((tab) => {
            const isSelected = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleCategoryChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Selector Row */}
      <div
        role="tablist"
        aria-label="选择具体工具查看可视化案例"
        data-glossary-ignore="true"
        className="flex flex-wrap items-center gap-2"
      >
        {visibleTools.map((tool) => {
          const isSelected = tool.id === activeTool.id;
          return (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectTool(tool.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isSelected
                  ? 'bg-blue-700 border-blue-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {tool.name}
            </button>
          );
        })}
      </div>

      {/* Active Tool Interactive Visual Stage */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6">
        {/* Top Metadata + Intro */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-100">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-blue-700">{activeTool.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{activeTool.deploymentMode}</span>
              <span aria-hidden="true">·</span>
              <span>{activeTool.zeroCodeLevel}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeTool.name}
              <span className="text-base font-normal text-slate-500 ml-2.5">
                — {activeTool.cnTitle}
              </span>
            </h3>
            <p className="text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              一句话秒懂：{activeTool.oneLineAnalogy}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              <GlossaryText text={activeTool.plainExplain} />
            </p>
          </div>

          <div className="lg:w-72 shrink-0 space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
              <div className="text-xs font-semibold text-slate-800">核心擅长场景</div>
              <p className="text-xs text-slate-600 leading-relaxed">{activeTool.bestFor}</p>
            </div>
            <button
              type="button"
              data-glossary-ignore="true"
              onClick={() => onLookupOnline(activeTool.name)}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>联网查 {activeTool.name} 更多新案例</span>
            </button>
          </div>
        </div>

        {/* Visual Scenario Pipeline Diagram */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-slate-900">{activeTool.caseTitle}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                点击任意步骤节点或使用右侧步进按钮，观察真实数据如何逐步流转
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                {activeStepIdx === 0 ? (
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>下一步（{activeStepIdx + 1}/{activeTool.steps.length}）</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStepIdx(0)}
                aria-label="重置流程演示步骤"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>重置</span>
              </button>
            </div>
          </div>

          {/* Desktop SVG Connector Track + Interactive Nodes */}
          <div className="space-y-3">
            <div className="hidden lg:block px-8 pt-1" aria-hidden="true">
              <svg viewBox="0 0 1000 36" className="w-full h-9 overflow-visible">
                {[0, 1, 2].map((segIdx) => {
                  const x1 = 125 + segIdx * 250;
                  const x2 = 125 + (segIdx + 1) * 250;
                  const isPassed = segIdx < activeStepIdx;
                  const isCurrentEdge = segIdx === activeStepIdx - 1;
                  return (
                    <g key={segIdx}>
                      <line
                        x1={x1}
                        y1={18}
                        x2={x2}
                        y2={18}
                        stroke={isPassed ? '#1D4ED8' : '#CBD5E1'}
                        strokeWidth={isCurrentEdge ? 3 : 2}
                        strokeDasharray={isPassed ? 'none' : '5 5'}
                      />
                      <polygon
                        points={`${x2 - 8},12 ${x2 + 2},18 ${x2 - 8},24`}
                        fill={isPassed ? '#1D4ED8' : '#CBD5E1'}
                      />
                    </g>
                  );
                })}
                {activeTool.steps.map((step, idx) => {
                  const cx = 125 + idx * 250;
                  const isReached = idx <= activeStepIdx;
                  const isCurrent = idx === activeStepIdx;
                  return (
                    <g key={step.stepNumber}>
                      <circle
                        cx={cx}
                        cy={18}
                        r={isCurrent ? 13 : 10}
                        fill={isReached ? '#1D4ED8' : '#FFFFFF'}
                        stroke={isReached ? '#1D4ED8' : '#94A3B8'}
                        strokeWidth={2}
                      />
                      <text
                        x={cx}
                        y={22}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={isReached ? '#FFFFFF' : '#475569'}
                      >
                        {step.stepNumber}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeTool.steps.map((step, idx) => {
                const isSelected = idx === activeStepIdx;
                const accent = ACCENT_MAP[step.accent];
                return (
                  <button
                    key={step.stepNumber}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`text-left p-4 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      isSelected
                        ? accent.activeBox
                        : idx < activeStepIdx
                        ? 'border-blue-200 bg-slate-50/70 hover:border-blue-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 tabular-nums">
                      <span className={`font-semibold ${accent.text}`}>
                        第 {step.stepNumber} 步
                      </span>
                      <span>{step.role}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mb-1.5">
                      {step.nodeName}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.action}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Live Data Packet Detail */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-700 tabular-nums">
                当前聚焦：第 {activeStep.stepNumber} 步 · {activeStep.nodeName}（{activeStep.role}）
              </div>
              <p className="text-sm text-slate-700">{activeStep.action}</p>
            </div>
            <div className="md:max-w-md shrink-0 bg-white border border-slate-200 rounded-md px-3.5 py-2 font-mono text-xs text-slate-800">
              流转数据：{activeStep.sampleData}
            </div>
          </div>

          {/* Before / After + Pairing Tip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <div className="text-xs font-semibold text-slate-700">没用 {activeTool.name} 之前</div>
              <p className="text-sm text-slate-600 leading-relaxed">{activeTool.painBefore}</p>
            </div>
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1">
              <div className="text-xs font-semibold text-emerald-800">用上 {activeTool.name} 之后</div>
              <p className="text-sm text-slate-700 leading-relaxed">{activeTool.outcomeAfter}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">组合搭配建议：</span>
              <GlossaryText text={activeTool.pairingTip} />
            </p>
            {activeTool.quickCommand && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 shrink-0">
                <code className="text-xs font-mono text-slate-800 max-w-[260px] sm:max-w-sm truncate">
                  {activeTool.quickCommand}
                </code>
                <CopyButton
                  text={activeTool.quickCommand}
                  label="复制命令"
                  ariaLabel={`复制 ${activeTool.name} 快速体验命令`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Selection Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            9 款核心工具选型对照表：部署上线与自动化分别该选谁？
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">工具名称</th>
                <th className="py-3 px-4 whitespace-nowrap">核心角色</th>
                <th className="py-3 px-4">典型实战场景</th>
                <th className="py-3 px-4 whitespace-nowrap">零代码门槛</th>
                <th className="py-3 px-4">什么时候首选它？</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {ECOSYSTEM_COMPARE_ROWS.map((row) => (
                <tr key={row.toolName} className="hover:bg-slate-50/70 transition-colors">
                  <td
                    data-glossary-ignore="true"
                    className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap"
                  >
                    {row.toolName}
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{row.coreRole}</td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{row.typicalScenario}</td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                    {row.zeroCodeThreshold}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">{row.whenToPick}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
