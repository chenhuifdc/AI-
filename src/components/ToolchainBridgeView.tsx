import { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import {
  PATHWAY_MODES,
  REUSE_PARADIGMS,
  TOOLCHAIN_EDGES,
  TOOLCHAIN_NODES,
} from '../data/learningData';
import type { NavSection, PathwayModeId, ToolchainNode } from '../types/learning';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';

interface ToolchainBridgeViewProps {
  overallProgressPercent: number;
  completedCasesCount: number;
  totalCasesCount: number;
  onNavigateToCase: (caseId: string) => void;
  onNavigateToSection: (section: NavSection) => void;
}

const ACCENT_STYLES: Record<
  ToolchainNode['accent'],
  { stroke: string; activeBorder: string; text: string; activeBg: string }
> = {
  blue: {
    stroke: '#1D4ED8',
    activeBorder: 'border-blue-600 ring-2 ring-blue-100',
    text: 'text-blue-700',
    activeBg: 'bg-blue-50/50',
  },
  emerald: {
    stroke: '#047857',
    activeBorder: 'border-emerald-600 ring-2 ring-emerald-100',
    text: 'text-emerald-700',
    activeBg: 'bg-emerald-50/50',
  },
  amber: {
    stroke: '#B45309',
    activeBorder: 'border-amber-600 ring-2 ring-amber-100',
    text: 'text-amber-700',
    activeBg: 'bg-amber-50/50',
  },
  indigo: {
    stroke: '#4338CA',
    activeBorder: 'border-indigo-600 ring-2 ring-indigo-100',
    text: 'text-indigo-700',
    activeBg: 'bg-indigo-50/50',
  },
};

function getEdgePath(from: ToolchainNode, to: ToolchainNode): { d: string; midX: number; midY: number } {
  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  const deltaX = Math.max(48, (endX - startX) * 0.5);
  const c1x = startX + deltaX;
  const c2x = endX - deltaX;

  return {
    d: `M ${startX} ${startY} C ${c1x} ${startY}, ${c2x} ${endY}, ${endX} ${endY}`,
    midX: (startX + endX) / 2,
    midY: (startY + endY) / 2 - 10,
  };
}

export function ToolchainBridgeView({
  overallProgressPercent,
  completedCasesCount,
  totalCasesCount,
  onNavigateToCase,
  onNavigateToSection,
}: ToolchainBridgeViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('github');
  const [activeMode, setActiveMode] = useState<PathwayModeId>('full');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const selectedNode =
    TOOLCHAIN_NODES.find((node) => node.id === selectedNodeId) ?? TOOLCHAIN_NODES[4];
  const currentMode = PATHWAY_MODES.find((m) => m.id === activeMode) ?? PATHWAY_MODES[0];

  const isEdgeActive = (edgeModes: PathwayModeId[], fromId: string, toId: string) => {
    const modeMatches = edgeModes.includes(activeMode);
    if (!modeMatches) return false;
    if (activeMode !== 'full') return true;
    return fromId === selectedNode.id || toId === selectedNode.id;
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (nodeId === selectedNode.id) return true;
    if (activeMode === 'full') return true;
    return TOOLCHAIN_EDGES.some(
      (e) => e.modes.includes(activeMode) && (e.from === nodeId || e.to === nodeId)
    );
  };

  return (
    <div className="space-y-12">
      {/* Editorial Intro Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-medium text-blue-700">
            零代码 AI 实践者专属能力桥接图
          </p>
          <h1 className="text-2xl sm:text-[34px] font-bold tracking-tight text-slate-900 leading-snug">
            把你已跑通的工具链，
            <br className="hidden sm:inline" />
            直接打通 GitHub 与 Hugging Face
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            <GlossaryText text="你已经掌握了 OpenRouter、Ollama、Docker + Dify 以及智能体零代码交付。无需回头补编程基础——点击下方任意节点或切换实战链路，直接看清开源宝库该插在你的哪一环。" />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 shrink-0 tabular-nums">
          <div>
            <div className="text-xs text-slate-500">已掌握工具底座</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">4 大核心能力</div>
          </div>
          <div className="h-9 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">生活案例实战</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {completedCasesCount} / {totalCasesCount} 已掌握
            </div>
          </div>
          <div className="h-9 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">总学习进度</div>
            <div className="text-xl font-bold text-blue-700 mt-0.5">{overallProgressPercent}%</div>
          </div>
        </div>
      </section>

      {/* Interactive Architecture Stage + Horizontal Node Inspector Deck */}
      <section aria-label="交互式工具链架构沙盘" className="space-y-5">
        {/* Full-Width Interactive Blueprint Stage */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Pathway Segmented Filter Control */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  交互式能力桥接架构图
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  点击图中任意卡片查看零代码接入方式，或切换链路模式观察数据流向
                </p>
              </div>
              <div
                role="group"
                aria-label="切换链路模式"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start overflow-x-auto max-w-full"
              >
                {PATHWAY_MODES.map((mode) => {
                  const active = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveMode(mode.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Blueprint Canvas */}
            <div className="blueprint-grid relative rounded-lg border border-slate-200 overflow-x-auto">
              <div className="min-w-[820px] relative h-[396px] p-2">
                {/* Column Zone Headers inside blueprint */}
                <div className="grid grid-cols-3 px-4 pt-2 text-xs font-medium text-slate-500">
                  <span>01. 算力路由层（已掌握）</span>
                  <span className="pl-6">02. 编排与智能体层（已掌握）</span>
                  <span className="pl-12 text-blue-700">03. 开源直接复用层（本次突破）</span>
                </div>

                {/* SVG Connections Layer */}
                <svg
                  viewBox="0 0 1040 400"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="arrow-blue"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
                    </marker>
                    <marker
                      id="arrow-emerald"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
                    </marker>
                    <marker
                      id="arrow-amber"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#B45309" />
                    </marker>
                    <marker
                      id="arrow-indigo"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#4338CA" />
                    </marker>
                    <marker
                      id="arrow-muted"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#CBD5E1" />
                    </marker>
                  </defs>

                  {/* Subtle dashed divider separating Mastered vs New Open-Source */}
                  <line
                    x1="704"
                    y1="38"
                    x2="704"
                    y2="380"
                    stroke="#CBD5E1"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {TOOLCHAIN_EDGES.map((edge) => {
                    const fromNode = TOOLCHAIN_NODES.find((n) => n.id === edge.from);
                    const toNode = TOOLCHAIN_NODES.find((n) => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const { d, midX, midY } = getEdgePath(fromNode, toNode);
                    const active = isEdgeActive(edge.modes, edge.from, edge.to);
                    const strokeColor = active ? ACCENT_STYLES[edge.accent].stroke : '#CBD5E1';

                    return (
                      <g key={edge.id}>
                        <path
                          d={d}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={active ? 2.4 : 1.4}
                          strokeOpacity={active ? 0.95 : 0.65}
                          markerEnd={active ? `url(#arrow-${edge.accent})` : 'url(#arrow-muted)'}
                          className={active ? 'animate-signal-flow' : ''}
                        />
                        {active && (
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-52"
                              y="-11"
                              width="104"
                              height="21"
                              rx="4"
                              fill="#FFFFFF"
                              stroke={strokeColor}
                              strokeWidth="1"
                            />
                            <text
                              x="0"
                              y="3"
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                              fill={strokeColor}
                            >
                              {edge.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Accessible Interactive Node Buttons positioned in sync with SVG viewBox */}
                {TOOLCHAIN_NODES.map((node) => {
                  const isSelected = node.id === selectedNode.id;
                  const highlighted = isNodeHighlighted(node.id);
                  const style = ACCENT_STYLES[node.accent];

                  return (
                    <button
                      key={node.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        left: `${(node.x / 1040) * 100}%`,
                        top: `${(node.y / 400) * 100}%`,
                        width: `${(node.width / 1040) * 100}%`,
                        height: `${(node.height / 400) * 100}%`,
                      }}
                      className={`absolute text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        isSelected
                          ? `bg-white ${style.activeBorder} shadow-sm z-10`
                          : highlighted
                          ? 'bg-white border-slate-300 hover:border-slate-400 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200 opacity-55 hover:opacity-90'
                      }`}
                    >
                      <div className="text-[11px] font-medium text-slate-500 truncate">
                        {node.category}
                      </div>
                      <div>
                        <div className={`text-sm font-bold leading-snug ${isSelected ? style.text : 'text-slate-900'}`}>
                          {node.title}
                        </div>
                        <div className="text-xs text-slate-600 truncate mt-0.5">
                          {node.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Pathway Metadata Strip */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-900">
                当前链路：{currentMode.label}
              </div>
              <p className="text-slate-600">
                <GlossaryText text={currentMode.shortDesc} />
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-slate-500">
              <span>隐私属性：{currentMode.privacyLevel}</span>
              <span aria-hidden="true">·</span>
              <span>上手耗时：{currentMode.setupEffort}</span>
            </div>
          </div>
        </div>

        {/* Horizontal 3-Column Node Inspector Deck */}
        <aside
          aria-label="当前节点零代码复用详解"
          className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
        >
          <div className="xl:col-span-4 space-y-2">
            <div className="text-xs font-medium text-slate-500">
              {selectedNode.category}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              <GlossaryText text={selectedNode.title} tooltipOnly />
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <GlossaryText text={selectedNode.bridgeExplanation} />
            </p>
          </div>

          <div className="xl:col-span-3 space-y-2">
            <h4 className="text-xs font-semibold text-slate-900">
              免写代码接入动作
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3.5">
              <GlossaryText text={selectedNode.zeroCodeAction} />
            </p>
          </div>

          <div className="xl:col-span-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-slate-900 truncate">
                {selectedNode.commandLabel}
              </h4>
              <CopyButton
                text={selectedNode.commandSnippet}
                label="复制"
                ariaLabel={`复制 ${selectedNode.title} 指令模板`}
              />
            </div>
            <pre className="font-mono text-xs bg-slate-900 text-slate-100 rounded-lg p-3.5 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
              {selectedNode.commandSnippet}
            </pre>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateToCase(selectedNode.connectedCaseId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>进入关联生活实战案例</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      </section>

      {/* 3 Core Zero-Code Open-Source Reuse Paradigms (Visual Editorial Strip) */}
      <section aria-label="三大零代码开源复用范式" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              跳过底层代码：掌握这 3 种开源复用范式就够了
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              95% 的生活与工作效率需求，都可以通过以下三种免编程路径直接落地
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('xray')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>先去 60 秒看懂 GitHub / HF 页面</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REUSE_PARADIGMS.map((paradigm) => {
            const imgFailed = failedImages[paradigm.id];
            return (
              <article
                key={paradigm.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="aspect-[4/3] bg-[#F7F8FA] border-b border-slate-100 overflow-hidden relative">
                    {!imgFailed ? (
                      <img
                        src={paradigm.imageSrc}
                        alt={paradigm.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [paradigm.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 text-slate-500 p-6 text-center">
                        <Layers className="w-8 h-8 text-blue-700" aria-hidden="true" />
                        <span className="text-sm font-medium text-slate-700">
                          {paradigm.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="text-xs font-medium text-slate-500">
                      {paradigm.indexLabel} · {paradigm.meta}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      <GlossaryText text={paradigm.title} tooltipOnly />
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <GlossaryText text={paradigm.summary} />
                    </p>
                    <p className="text-xs text-slate-500 pt-1">
                      适用场景：<GlossaryText text={paradigm.whenToUse} />
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (paradigm.targetCaseId) {
                        onNavigateToCase(paradigm.targetCaseId);
                      } else {
                        onNavigateToSection(paradigm.targetSection);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                  >
                    <span>
                      {paradigm.targetCaseId ? '演练对应生活案例' : '进入开源解剖台演练'}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
