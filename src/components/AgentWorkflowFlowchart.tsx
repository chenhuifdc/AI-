import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Workflow,
} from 'lucide-react';
import { AGENT_WORKFLOW_STEPS } from '../data/securityDefenseData';
import type { WorkflowSimulationMode } from '../types/learning';
import { getNextWorkflowStepIndex } from '../utils/securityDefense';
import { GlossaryText } from './GlossaryText';

const CARD_WIDTH = 232;
const CARD_HEIGHT = 96;

export function AgentWorkflowFlowchart() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mode, setMode] = useState<WorkflowSimulationMode>('standard');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const activeStep = AGENT_WORKFLOW_STEPS[activeIndex] ?? AGENT_WORKFLOW_STEPS[0];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) =>
        getNextWorkflowStepIndex(prev, AGENT_WORKFLOW_STEPS.length, 'next', mode)
      );
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying, mode]);

  const handleStep = (direction: 'prev' | 'next') => {
    setIsPlaying(false);
    setActiveIndex((prev) =>
      getNextWorkflowStepIndex(prev, AGENT_WORKFLOW_STEPS.length, direction, mode)
    );
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveIndex(0);
  };

  const isReflectorLoopHighlighted =
    mode === 'self-correct' || activeStep.index === 5 || activeStep.index === 2;

  return (
    <div
      data-testid="agent-workflow-flowchart"
      data-active-step={activeStep.code}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
    >
      {/* Header & Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Workflow className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>自动化渗透代理执行流程图 · 6 步闭环可视化</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            AI 代理如何自动化执行漏洞扫描、研判与自纠错？
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            <GlossaryText text="点击流程图中的任意节点，或切换演练模式，观察自主安全框架（PentAGI / ARTEX / Cairn / CyberStrikeAI）的数据流转机制与企业蓝队对应检测信号。" />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="切换自动化演练模式"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              aria-pressed={mode === 'standard'}
              onClick={() => setMode('standard')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'standard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              标准自动化链路
            </button>
            <button
              type="button"
              aria-pressed={mode === 'self-correct'}
              onClick={() => setMode('self-correct')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'self-correct'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              遇拦截自纠错回环
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Flowchart */}
      <div className="overflow-x-auto pb-1">
        <svg
          viewBox="0 0 884 326"
          role="img"
          aria-label="AI 代理自动化漏洞扫描与渗透评估 6 步流程图"
          className="w-full min-w-[740px] h-auto block select-none"
        >
          <defs>
            <marker
              id="wf-arrow-slate"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
            </marker>
            <marker
              id="wf-arrow-blue"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
            </marker>
            <marker
              id="wf-arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
          </defs>

          {/* Subtle Top Legend */}
          <rect
            x="24"
            y="8"
            width="836"
            height="30"
            rx="6"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="1"
          />
          <line
            x1="40"
            y1="23"
            x2="66"
            y2="23"
            stroke="#1D4ED8"
            strokeWidth="1.8"
            markerEnd="url(#wf-arrow-blue)"
          />
          <text x="74" y="27" fill="#334155" fontSize="11" fontWeight="600">
            主执行流（01 目标拆解 → 06 反思收敛）
          </text>

          <line
            x1="336"
            y1="23"
            x2="366"
            y2="23"
            stroke="#D97706"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            markerEnd="url(#wf-arrow-amber)"
          />
          <text x="374" y="27" fill="#92400E" fontSize="11" fontWeight="600">
            Reflector 自纠错回环（遇拦截或停滞时回流至 03 图谱重规划）
          </text>

          {/* Forward Connector 01 -> 02 */}
          <line
            x1="256"
            y1="100"
            x2="321"
            y2="100"
            stroke={activeIndex >= 1 ? '#1D4ED8' : '#64748B'}
            strokeWidth={activeIndex === 0 || activeIndex === 1 ? '2.2' : '1.6'}
            markerEnd={activeIndex >= 1 ? 'url(#wf-arrow-blue)' : 'url(#wf-arrow-slate)'}
          />
          <text
            x="291"
            y="89"
            textAnchor="middle"
            fill={activeIndex === 0 || activeIndex === 1 ? '#1D4ED8' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            任务意图
          </text>

          {/* Forward Connector 02 -> 03 */}
          <line
            x1="558"
            y1="100"
            x2="623"
            y2="100"
            stroke={activeIndex >= 2 ? '#1D4ED8' : '#64748B'}
            strokeWidth={activeIndex === 1 || activeIndex === 2 ? '2.2' : '1.6'}
            markerEnd={activeIndex >= 2 ? 'url(#wf-arrow-blue)' : 'url(#wf-arrow-slate)'}
          />
          <text
            x="593"
            y="89"
            textAnchor="middle"
            fill={activeIndex === 1 || activeIndex === 2 ? '#1D4ED8' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            扫描回显
          </text>

          {/* Forward Connector 03 -> 04 (Right Vertical Drop) */}
          <line
            x1="760"
            y1="148"
            x2="760"
            y2="199"
            stroke={activeIndex >= 3 ? '#1D4ED8' : '#64748B'}
            strokeWidth={activeIndex === 2 || activeIndex === 3 ? '2.2' : '1.6'}
            markerEnd={activeIndex >= 3 ? 'url(#wf-arrow-blue)' : 'url(#wf-arrow-slate)'}
          />
          <text
            x="772"
            y="178"
            textAnchor="start"
            fill={activeIndex === 2 || activeIndex === 3 ? '#1D4ED8' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            图谱事实
          </text>

          {/* Forward Connector 04 -> 05 (Bottom Row Right-to-Left) */}
          <line
            x1="628"
            y1="252"
            x2="563"
            y2="252"
            stroke={activeIndex >= 4 ? '#1D4ED8' : '#64748B'}
            strokeWidth={activeIndex === 3 || activeIndex === 4 ? '2.2' : '1.6'}
            markerEnd={activeIndex >= 4 ? 'url(#wf-arrow-blue)' : 'url(#wf-arrow-slate)'}
          />
          <text
            x="593"
            y="241"
            textAnchor="middle"
            fill={activeIndex === 3 || activeIndex === 4 ? '#1D4ED8' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            验证意图
          </text>

          {/* Forward Connector 05 -> 06 (Bottom Row Right-to-Left) */}
          <line
            x1="326"
            y1="252"
            x2="261"
            y2="252"
            stroke={activeIndex >= 5 ? '#1D4ED8' : '#64748B'}
            strokeWidth={activeIndex === 4 || activeIndex === 5 ? '2.2' : '1.6'}
            markerEnd={activeIndex >= 5 ? 'url(#wf-arrow-blue)' : 'url(#wf-arrow-slate)'}
          />
          <text
            x="291"
            y="241"
            textAnchor="middle"
            fill={activeIndex === 4 || activeIndex === 5 ? '#1D4ED8' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            结果/拦截
          </text>

          {/* Dashed Reflector Feedback Arc (06 -> 03 via Center Channel y=176, clear of 03->04 at x=760) */}
          <path
            d="M 140 204 L 140 176 L 680 176 L 680 153"
            fill="none"
            stroke={isReflectorLoopHighlighted ? '#D97706' : '#94A3B8'}
            strokeWidth={isReflectorLoopHighlighted ? '2.2' : '1.5'}
            strokeDasharray="6 4"
            markerEnd={isReflectorLoopHighlighted ? 'url(#wf-arrow-amber)' : 'url(#wf-arrow-slate)'}
          />
          <rect
            x="278"
            y="165"
            width="264"
            height="22"
            rx="4"
            fill={isReflectorLoopHighlighted ? '#FFFBEB' : '#FFFFFF'}
            stroke={isReflectorLoopHighlighted ? '#FCD34D' : '#E2E8F0'}
            strokeWidth="1"
          />
          <text
            x="410"
            y="180"
            textAnchor="middle"
            fill={isReflectorLoopHighlighted ? '#92400E' : '#64748B'}
            fontSize="10"
            fontWeight="600"
          >
            Reflector 自纠错回流：遇 WAF 拦截写回图谱重规划
          </text>

          {/* 6 Interactive Step Nodes */}
          {AGENT_WORKFLOW_STEPS.map((step) => {
            const isActive = step.index === activeIndex;
            const isReflectTarget =
              mode === 'self-correct' && (step.index === 5 || step.index === 2);

            const strokeColor = isActive
              ? '#1D4ED8'
              : isReflectTarget
                ? '#D97706'
                : '#CBD5E1';
            const fillColor = isActive
              ? '#EFF6FF'
              : isReflectTarget
                ? '#FFFBEB'
                : '#FFFFFF';

            return (
              <g
                key={step.id}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveIndex(step.index);
                }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={step.x}
                  y={step.y}
                  width={CARD_WIDTH}
                  height={CARD_HEIGHT}
                  rx="10"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isActive ? '2.2' : '1.3'}
                />

                {/* Step Number & Actor */}
                <text
                  x={step.x + 14}
                  y={step.y + 24}
                  fill={isActive ? '#1D4ED8' : '#64748B'}
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  STEP {step.code}
                </text>
                <text
                  x={step.x + CARD_WIDTH - 14}
                  y={step.y + 24}
                  textAnchor="end"
                  fill={isActive ? '#1E40AF' : '#64748B'}
                  fontSize="10"
                  fontWeight="600"
                >
                  {step.actor}
                </text>

                {/* Step Title */}
                <text
                  x={step.x + 14}
                  y={step.y + 52}
                  fill="#0F172A"
                  fontSize="13.5"
                  fontWeight="700"
                >
                  {step.title}
                </text>

                {/* Output Data Contract */}
                <text
                  x={step.x + 14}
                  y={step.y + 78}
                  fill={isActive ? '#1D4ED8' : '#475569'}
                  fontSize="10.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  输出：{step.dataFlowLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Step Selector Strip & Playback Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-100">
        <div
          role="group"
          aria-label="选择流程图演练步骤"
          className="flex flex-wrap items-center gap-1.5"
        >
          {AGENT_WORKFLOW_STEPS.map((step) => {
            const active = step.index === activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveIndex(step.index);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <span className="font-mono mr-1">{step.code}</span>
                {step.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleStep('prev')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            上一步
          </button>
          <button
            type="button"
            onClick={() => handleStep('next')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            下一步
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                暂停演练
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                自动演练
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="重置流程图到第一步"
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Synchronized Step Detail Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-blue-200/80 bg-blue-50/40 p-4 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-blue-900">
              当前步骤 {activeStep.code} · {activeStep.title}
            </span>
            <span className="font-mono text-blue-700">
              <GlossaryText text={activeStep.actor} />
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            <GlossaryText text={activeStep.agentAction} />
          </p>
          <div className="text-[11px] text-blue-800 pt-1">
            输出产物：<GlossaryText text={activeStep.dataFlowLabel} />
          </div>
        </div>

        <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
            <span>对应阶段 · 企业蓝队检测与防御落点</span>
          </div>
          <p className="text-xs text-amber-950/90 leading-relaxed">
            <GlossaryText text={activeStep.blueTeamDetection} />
          </p>
        </div>
      </div>
    </div>
  );
}
