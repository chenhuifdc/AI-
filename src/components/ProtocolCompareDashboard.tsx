import { useMemo, useState } from 'react';
import { Gauge, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PROTOCOL_DIMENSIONS, PROTOCOL_SCENARIOS } from '../data/securityDefenseData';
import type { ProtocolDimensionId, ProtocolScenarioId } from '../types/learning';
import { summarizeProtocolLead } from '../utils/securityDefense';
import { GlossaryText } from './GlossaryText';

export function ProtocolCompareDashboard() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<ProtocolScenarioId>(
    PROTOCOL_SCENARIOS[0].id
  );
  const [selectedDimensionId, setSelectedDimensionId] = useState<ProtocolDimensionId>(
    PROTOCOL_SCENARIOS[0].focusDimension
  );

  const activeScenario = useMemo(() => {
    return (
      PROTOCOL_SCENARIOS.find((item) => item.id === selectedScenarioId) ??
      PROTOCOL_SCENARIOS[0]
    );
  }, [selectedScenarioId]);

  const activeDimension = useMemo(() => {
    return (
      PROTOCOL_DIMENSIONS.find((item) => item.id === selectedDimensionId) ??
      PROTOCOL_DIMENSIONS[0]
    );
  }, [selectedDimensionId]);

  const leadSummary = useMemo(
    () => summarizeProtocolLead(activeScenario.metrics),
    [activeScenario]
  );

  const handleSelectScenario = (scenarioId: ProtocolScenarioId) => {
    setSelectedScenarioId(scenarioId);
    const matched = PROTOCOL_SCENARIOS.find((s) => s.id === scenarioId);
    if (matched) {
      setSelectedDimensionId(matched.focusDimension);
    }
  };

  return (
    <div
      data-testid="protocol-compare-dashboard"
      data-scenario={activeScenario.id}
      data-dimension={activeDimension.id}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Gauge className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>协议对比仪表盘 · MCP (HexStrike) vs LLM 安全代理</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            动态工况对比：数据存取、指令注入防范与实时反馈链路
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            <GlossaryText text="切换不同实战工况，动态观察标准化 MCP 工具协议（如 HexStrike）与传统/自主安全代理（如 PentAGI、Cairn、ARTEX）在四大核心指标与三大底层协议机制上的技术差异。" />
          </p>
        </div>

        {/* Live Quantitative Score Summary */}
        <div className="flex items-center gap-5 shrink-0 tabular-nums">
          <div>
            <div className="text-[11px] font-medium text-emerald-700">
              MCP 协议（HexStrike）
            </div>
            <div
              data-testid="protocol-mcp-avg"
              className="text-xl font-bold text-emerald-700 font-mono"
            >
              {leadSummary.mcpAvg}
              <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-[11px] font-medium text-blue-700">
              LLM 安全代理（PentAGI / Cairn）
            </div>
            <div
              data-testid="protocol-agent-avg"
              className="text-xl font-bold text-blue-700 font-mono"
            >
              {leadSummary.agentAvg}
              <span className="text-xs font-normal text-slate-400 ml-0.5">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Scenario Selector */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-900">
          步骤 1 · 选择实战工况（点击动态更新指标与焦点维度）
        </div>
        <div
          role="group"
          aria-label="选择协议对比实战工况"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          {PROTOCOL_SCENARIOS.map((scenario) => {
            const active = scenario.id === activeScenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectScenario(scenario.id)}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600/15'
                    : 'bg-[#F7F8FA]/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{scenario.label}</div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {scenario.shortDesc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Quantitative Comparison Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-900">
              工况指标对比：{activeScenario.label}
            </span>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" aria-hidden="true" />
                MCP 协议框架（HexStrike）
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" aria-hidden="true" />
                LLM 安全代理（PentAGI / Cairn）
              </span>
            </div>
          </div>

          <div className="space-y-3.5">
            {activeScenario.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-slate-200/80 bg-[#F7F8FA]/60 p-3.5 space-y-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    <GlossaryText text={metric.label} tooltipOnly />
                  </span>
                  <span className="text-[11px] text-slate-500">
                    <GlossaryText text={metric.note} />
                  </span>
                </div>

                {/* MCP Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] font-medium text-emerald-800 shrink-0">
                    MCP 协议
                  </span>
                  <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${metric.mcpScore}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-mono font-bold text-emerald-800 tabular-nums shrink-0">
                    {metric.mcpScore}
                  </span>
                </div>

                {/* Agent Bar */}
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] font-medium text-blue-800 shrink-0">
                    安全代理
                  </span>
                  <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${metric.agentScore}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-mono font-bold text-blue-800 tabular-nums shrink-0">
                    {metric.agentScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenario Verdict Card */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="text-xs font-bold text-slate-900">当前工况架构结论</div>
          <p className="text-xs text-slate-700 leading-relaxed">
            <GlossaryText text={activeScenario.verdict} />
          </p>
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">
              当前领先维度：
              {leadSummary.lead === 'mcp'
                ? 'MCP 协议工具（更易管控与审批）'
                : leadSummary.lead === 'agent'
                  ? 'LLM 安全代理（更强自治与长程记忆）'
                  : '两者能力互补，需结合场景选型'}
            </div>
            <div>已自动聚焦下方技术机制：{activeDimension.label}</div>
          </div>
        </div>
      </div>

      {/* 3 Core Technical Dimension Deep-Dive */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              步骤 2 · 三大核心协议机制逐项拆解
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <GlossaryText text={activeDimension.summary} />
            </p>
          </div>

          <div
            role="tablist"
            aria-label="切换协议对比核心维度"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {PROTOCOL_DIMENSIONS.map((dim) => {
              const active = dim.id === activeDimension.id;
              return (
                <button
                  key={dim.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDimensionId(dim.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dim.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MCP Side */}
          <article className="rounded-xl border border-emerald-200/90 bg-emerald-50/30 p-5 space-y-3">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                MCP 协议框架（如 HexStrike） · {activeDimension.label}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                <GlossaryText text={activeDimension.mcpApproach.headline} tooltipOnly />
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <GlossaryText text={activeDimension.mcpApproach.mechanism} />
            </p>
            <div className="space-y-2 pt-2 border-t border-emerald-200/60 text-xs">
              <div className="flex items-start gap-2 text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>核心优势：</strong>
                  <GlossaryText text={activeDimension.mcpApproach.strength} />
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>治理盲区：</strong>
                  <GlossaryText text={activeDimension.mcpApproach.riskPoint} />
                </span>
              </div>
            </div>
          </article>

          {/* Traditional / Autonomous Security Agent Side */}
          <article className="rounded-xl border border-blue-200/90 bg-blue-50/30 p-5 space-y-3">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                LLM 安全代理（PentAGI / Cairn / ARTEX） · {activeDimension.label}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                <GlossaryText text={activeDimension.agentApproach.headline} tooltipOnly />
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <GlossaryText text={activeDimension.agentApproach.mechanism} />
            </p>
            <div className="space-y-2 pt-2 border-t border-blue-200/60 text-xs">
              <div className="flex items-start gap-2 text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>核心优势：</strong>
                  <GlossaryText text={activeDimension.agentApproach.strength} />
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong>治理盲区：</strong>
                  <GlossaryText text={activeDimension.agentApproach.riskPoint} />
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
