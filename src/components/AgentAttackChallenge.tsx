import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react';
import { ATTACK_CHALLENGE_SCENARIOS } from '../data/attackChallengeData';
import type {
  AttackChallengeId,
  ChallengeEvaluationResult,
  ChallengeNodeVisualStatus,
} from '../types/learning';
import {
  evaluateChallengeDefense,
  getChallengeScenarioById,
  summarizeChallengeProgress,
} from '../utils/attackChallenge';
import { GlossaryText } from './GlossaryText';

const CLEARED_STORAGE_KEY = 'oss_lab_attack_challenge_cleared_v1';
const NODE_WIDTH = 142;
const NODE_HEIGHT = 104;

function loadClearedScenarioIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CLEARED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function truncateSvgText(text: string, maxUnits: number): string {
  let units = 0;
  let cutIdx = text.length;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const charWidth = code <= 0x7f ? 0.56 : 1;
    if (units + charWidth > maxUnits) {
      cutIdx = Math.max(1, i - 1);
      return `${text.slice(0, cutIdx)}…`;
    }
    units += charWidth;
  }
  return text;
}

export function AgentAttackChallenge() {
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<AttackChallengeId>('prompt-injection');
  const [equippedMap, setEquippedMap] = useState<
    Record<AttackChallengeId, Record<string, string | null>>
  >({
    'prompt-injection': {},
    'data-poisoning': {},
    'mcp-tool-hijack': {},
    'memory-exfil': {},
  });
  const [activeSlotId, setActiveSlotId] = useState<string>(
    ATTACK_CHALLENGE_SCENARIOS[0].slots[0].id
  );
  const [evalByScenario, setEvalByScenario] = useState<
    Partial<Record<AttackChallengeId, ChallengeEvaluationResult>>
  >({});
  const [clearedIds, setClearedIds] = useState<string[]>(() => loadClearedScenarioIds());
  const [showSolutionHint, setShowSolutionHint] = useState<boolean>(false);
  const [pulseStep, setPulseStep] = useState<number>(5);

  const scenario = useMemo(
    () => getChallengeScenarioById(ATTACK_CHALLENGE_SCENARIOS, selectedScenarioId),
    [selectedScenarioId]
  );

  const currentEquipped = equippedMap[scenario.id] ?? {};
  const evaluation = evalByScenario[scenario.id] ?? null;

  const progress = useMemo(
    () =>
      summarizeChallengeProgress(
        clearedIds,
        ATTACK_CHALLENGE_SCENARIOS.map((s) => s.id)
      ),
    [clearedIds]
  );

  // Sync active slot when switching attack scenario
  useEffect(() => {
    setActiveSlotId(scenario.slots[0]?.id ?? '');
    setShowSolutionHint(false);
    setPulseStep(5);
  }, [scenario]);

  // Persist cleared scenarios
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify(clearedIds));
    } catch {
      // Ignore quota errors
    }
  }, [clearedIds]);

  // Smooth progressive visual sweep when simulation runs (respects reduced motion)
  useEffect(() => {
    if (pulseStep >= scenario.nodes.length) return;
    const timer = window.setTimeout(() => {
      setPulseStep((prev) => Math.min(scenario.nodes.length, prev + 1));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [pulseStep, scenario.nodes.length]);

  const activeSlot = useMemo(
    () => scenario.slots.find((s) => s.id === activeSlotId) ?? scenario.slots[0],
    [scenario.slots, activeSlotId]
  );

  const handleEquipDefense = (optionId: string) => {
    if (!activeSlot) return;
    setEquippedMap((prev) => {
      const prevScenario = prev[scenario.id] ?? {};
      const nextVal = prevScenario[activeSlot.id] === optionId ? null : optionId;
      return {
        ...prev,
        [scenario.id]: {
          ...prevScenario,
          [activeSlot.id]: nextVal,
        },
      };
    });
    // Clear stale evaluation until re-tested so diagram reflects pending changes
    setEvalByScenario((prev) => {
      if (!prev[scenario.id]) return prev;
      const copy = { ...prev };
      delete copy[scenario.id];
      return copy;
    });
  };

  const handleClearSlot = (slotId: string) => {
    setEquippedMap((prev) => ({
      ...prev,
      [scenario.id]: {
        ...(prev[scenario.id] ?? {}),
        [slotId]: null,
      },
    }));
    setEvalByScenario((prev) => {
      if (!prev[scenario.id]) return prev;
      const copy = { ...prev };
      delete copy[scenario.id];
      return copy;
    });
  };

  const handleRunSimulation = () => {
    const result = evaluateChallengeDefense(scenario, currentEquipped);
    setEvalByScenario((prev) => ({
      ...prev,
      [scenario.id]: result,
    }));

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setPulseStep(prefersReducedMotion ? scenario.nodes.length : 1);

    if (result.outcome === 'intercepted') {
      setClearedIds((prev) => (prev.includes(scenario.id) ? prev : [...prev, scenario.id]));
    }
  };

  const handleResetScenario = () => {
    setEquippedMap((prev) => ({
      ...prev,
      [scenario.id]: {},
    }));
    setEvalByScenario((prev) => {
      const copy = { ...prev };
      delete copy[scenario.id];
      return copy;
    });
    setShowSolutionHint(false);
    setActiveSlotId(scenario.slots[0]?.id ?? '');
    setPulseStep(scenario.nodes.length);
  };

  const equippedCount = scenario.slots.filter((s) => Boolean(currentEquipped[s.id])).length;

  const getNodeVisualStyle = (nodeId: string, kind: string, slotId?: string) => {
    const isSlotFocused = Boolean(slotId && slotId === activeSlot?.id);
    const hasEquipped = Boolean(slotId && currentEquipped[slotId]);
    const evalStatus: ChallengeNodeVisualStatus | undefined = evaluation?.nodeStatuses[nodeId];

    if (evaluation && evalStatus) {
      if (evalStatus === 'blocked-here') {
        return {
          fill: '#ECFDF5',
          stroke: '#059669',
          strokeWidth: 2.2,
          dash: undefined,
          headerColor: '#047857',
          statusText: '防线已拦截',
        };
      }
      if (evalStatus === 'safe-protected') {
        return {
          fill: '#F0FDF4',
          stroke: '#34D399',
          strokeWidth: 1.6,
          dash: undefined,
          headerColor: '#059669',
          statusText: kind === 'target' ? '资产受保护' : '未受波及',
        };
      }
      if (evalStatus === 'mitigated-here') {
        return {
          fill: '#FFFBEB',
          stroke: '#D97706',
          strokeWidth: 2,
          dash: '5 3',
          headerColor: '#B45309',
          statusText: '弱缓解 · 被穿透',
        };
      }
      if (evalStatus === 'compromised') {
        return {
          fill: '#FEF2F2',
          stroke: '#DC2626',
          strokeWidth: 2,
          dash: undefined,
          headerColor: '#B91C1C',
          statusText: kind === 'target' ? '目标失守' : '攻击已穿透',
        };
      }
      if (evalStatus === 'source') {
        return {
          fill: '#FEF2F2',
          stroke: '#DC2626',
          strokeWidth: 1.8,
          dash: undefined,
          headerColor: '#B91C1C',
          statusText: '攻击载荷入口',
        };
      }
    }

    // Pre-simulation configuration states
    if (kind === 'source') {
      return {
        fill: '#FFF7ED',
        stroke: '#EA580C',
        strokeWidth: 1.5,
        dash: undefined,
        headerColor: '#C2410C',
        statusText: '攻击注入点',
      };
    }
    if (kind === 'flaw-slot') {
      if (hasEquipped) {
        return {
          fill: isSlotFocused ? '#EFF6FF' : '#F8FAFC',
          stroke: isSlotFocused ? '#1D4ED8' : '#2563EB',
          strokeWidth: isSlotFocused ? 2.4 : 1.7,
          dash: undefined,
          headerColor: '#1D4ED8',
          statusText: isSlotFocused ? '配置中 · 已设防' : '已装配防线',
        };
      }
      return {
        fill: isSlotFocused ? '#FFFBEB' : '#FFFDF5',
        stroke: isSlotFocused ? '#B45309' : '#D97706',
        strokeWidth: isSlotFocused ? 2.4 : 1.6,
        dash: '5 3',
        headerColor: '#B45309',
        statusText: isSlotFocused ? '配置中 · 存在漏洞' : '逻辑漏洞点',
      };
    }
    if (kind === 'target') {
      return {
        fill: '#F8FAFC',
        stroke: '#64748B',
        strokeWidth: 1.5,
        dash: undefined,
        headerColor: '#334155',
        statusText: '待保护资产',
      };
    }
    return {
      fill: '#FFFFFF',
      stroke: '#CBD5E1',
      strokeWidth: 1.4,
      dash: undefined,
      headerColor: '#475569',
      statusText: '内部处理节点',
    };
  };

  return (
    <section
      aria-label="AI Agent 攻击模拟挑战赛"
      data-testid="agent-attack-challenge"
      data-scenario-id={scenario.id}
      data-eval-outcome={evaluation?.outcome ?? 'pending'}
      className="space-y-6"
    >
      {/* Top Challenge Header & Progress Tally */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>互动架构攻防沙盘 · 纯防御原理演练</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              AI Agent 攻击模拟挑战赛
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <GlossaryText text="选择任意 AI 攻击类型，系统将动态生成包含逻辑漏洞的目标 Agent 架构图。点击漏洞卡槽装配恰当的防御组件，发起模拟攻击验证防线是否成功截断风险链。" />
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0 tabular-nums pt-1">
            <div>
              <div className="text-xs text-slate-500">挑战赛通关进度</div>
              <div
                data-testid="challenge-cleared-count"
                className="text-lg font-bold text-blue-700 mt-0.5"
              >
                {progress.clearedCount} / {progress.totalCount} 关
              </div>
              <div className="text-[11px] text-slate-500">{progress.statusLabel}</div>
            </div>
            <div className="h-10 w-px bg-slate-200" aria-hidden="true" />
            <div>
              <div className="text-xs text-slate-500">当前防线评分</div>
              <div
                data-testid="challenge-current-score"
                className={`text-lg font-bold mt-0.5 ${
                  !evaluation
                    ? 'text-slate-400'
                    : evaluation.outcome === 'intercepted'
                      ? 'text-emerald-700'
                      : evaluation.outcome === 'partial'
                        ? 'text-amber-700'
                        : 'text-red-700'
                }`}
              >
                {evaluation ? `${evaluation.score} 分` : '待检验'}
              </div>
              <div className="text-[11px] text-slate-500">
                已配置 {equippedCount} / {scenario.slots.length} 处卡槽
              </div>
            </div>
          </div>
        </div>

        {/* Attack Type Selector Bar */}
        <div
          role="group"
          aria-label="选择模拟攻击类型"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1"
        >
          {ATTACK_CHALLENGE_SCENARIOS.map((item) => {
            const isSelected = item.id === scenario.id;
            const isCleared = clearedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                data-testid={`challenge-type-${item.id}`}
                onClick={() => setSelectedScenarioId(item.id)}
                className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>难度：{item.difficulty}</span>
                  {isCleared ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      已拦截通关
                    </span>
                  ) : (
                    <span>待挑战</span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                  {item.shortName}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {item.attackTypeLabel.includes('（')
                    ? item.attackTypeLabel.slice(
                        item.attackTypeLabel.indexOf('（') + 1,
                        item.attackTypeLabel.lastIndexOf('）')
                      )
                    : item.attackTypeLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Stage: Dynamic Architecture Diagram */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-700">动态生成架构图</span>
              <span aria-hidden="true">·</span>
              <span>{scenario.attackTypeLabel}</span>
            </div>
            <h3
              data-testid="challenge-target-system"
              className="text-base font-bold text-slate-900"
            >
              <GlossaryText text={scenario.targetSystemTitle} tooltipOnly />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              <GlossaryText text={scenario.scenarioBrief} />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="challenge-run-btn"
              onClick={handleRunSimulation}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              发起攻击模拟检验
            </button>
            <button
              type="button"
              data-testid="challenge-reset-btn"
              onClick={handleResetScenario}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              重置当前防线
            </button>
          </div>
        </div>

        {/* Simulated Payload Callout */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3 text-xs">
          <span className="font-semibold text-slate-800 shrink-0">模拟攻击载荷示意：</span>
          <span className="text-slate-600 font-mono leading-relaxed break-words">
            {scenario.simulatedPayloadPreview}
          </span>
        </div>

        {/* Dynamic SVG Architecture Diagram */}
        <div className="overflow-x-auto pb-1">
          <svg
            viewBox="0 0 986 250"
            role="img"
            aria-label={`${scenario.shortName} 动态逻辑漏洞与防御架构图`}
            data-testid="challenge-architecture-svg"
            className="w-full min-w-[820px] h-auto block select-none"
          >
            <defs>
              <marker
                id="chg-arrow-slate"
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
                id="chg-arrow-red"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#DC2626" />
              </marker>
              <marker
                id="chg-arrow-emerald"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6.5"
                markerHeight="6.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
              </marker>
            </defs>

            {/* Diagram Top Legend Strip */}
            <rect
              x="18"
              y="6"
              width="950"
              height="28"
              rx="6"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="1"
            />
            <text x="32" y="24" fill="#475569" fontSize="11" fontWeight="600">
              图例：虚线琥珀框 = 待设防逻辑漏洞点（点击节点可切换配置卡槽） · 实线绿框 = 成功拦截 / 资产受保护 · 实线红框 = 漏洞被穿透
            </text>

            {/* Directed Edges */}
            {scenario.edges.map((edge, edgeIdx) => {
              const fromNode = scenario.nodes.find((n) => n.id === edge.from);
              const toNode = scenario.nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + NODE_WIDTH + 2;
              const y1 = fromNode.y + NODE_HEIGHT / 2;
              const x2 = toNode.x - 5;
              const y2 = toNode.y + NODE_HEIGHT / 2;
              const midX = (x1 + x2) / 2;

              let stroke = '#64748B';
              let marker = 'url(#chg-arrow-slate)';
              let dash: string | undefined;

              if (evaluation && edgeIdx < pulseStep) {
                const toStatus = evaluation.nodeStatuses[toNode.id];
                const fromStatus = evaluation.nodeStatuses[fromNode.id];
                if (fromStatus === 'blocked-here' || toStatus === 'safe-protected') {
                  stroke = '#059669';
                  marker = 'url(#chg-arrow-emerald)';
                  dash = '4 3';
                } else {
                  stroke = '#DC2626';
                  marker = 'url(#chg-arrow-red)';
                }
              }

              return (
                <g key={edge.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={evaluation && edgeIdx < pulseStep ? 2.2 : 1.5}
                    strokeDasharray={dash}
                    markerEnd={marker}
                  />
                  <text
                    x={midX}
                    y={y1 - 11}
                    textAnchor="middle"
                    fill={stroke}
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Architecture Nodes & Mounted Shield Indicators */}
            {scenario.nodes.map((node, nodeIdx) => {
              const style = getNodeVisualStyle(node.id, node.kind, node.slotId);
              const isFlawSlot = node.kind === 'flaw-slot' && Boolean(node.slotId);
              const equippedId = node.slotId ? currentEquipped[node.slotId] : null;
              const equippedOpt = equippedId
                ? scenario.defenseOptions.find((o) => o.id === equippedId)
                : null;
              const slotEval =
                evaluation && node.slotId
                  ? evaluation.slotResults.find((r) => r.slotId === node.slotId)
                  : null;

              const isReachedInSweep = !evaluation || nodeIdx < pulseStep;
              const isDownstreamProtected =
                evaluation?.nodeStatuses[node.id] === 'safe-protected';

              const shieldState = (() => {
                if (slotEval?.status === 'blocked') {
                  return {
                    fill: '#ECFDF5',
                    stroke: '#059669',
                    textFill: '#047857',
                    label: isDownstreamProtected ? '✓ 纵深兜底就绪' : '✓ 防线生效 · 已拦截',
                  };
                }
                if (isDownstreamProtected && slotEval) {
                  return {
                    fill: '#F8FAFC',
                    stroke: '#94A3B8',
                    textFill: '#475569',
                    label: equippedOpt ? '上游已拦截 · 建议优化' : '上游已截断 · 建议补防',
                  };
                }
                if (slotEval?.status === 'mitigated') {
                  return {
                    fill: '#FFFBEB',
                    stroke: '#D97706',
                    textFill: '#B45309',
                    label: '△ 弱缓解 · 未拦住',
                  };
                }
                if (slotEval?.status === 'bypassed') {
                  return {
                    fill: '#FEF2F2',
                    stroke: '#DC2626',
                    textFill: '#B91C1C',
                    label: '✕ 防线错配 · 已穿透',
                  };
                }
                if (slotEval?.status === 'empty') {
                  return {
                    fill: '#FEF2F2',
                    stroke: '#DC2626',
                    textFill: '#B91C1C',
                    label: '✕ 未设防 · 已穿透',
                  };
                }
                if (equippedOpt) {
                  return {
                    fill: '#EFF6FF',
                    stroke: '#2563EB',
                    textFill: '#1E40AF',
                    label: `防线：${truncateSvgText(equippedOpt.shortTag, 8.5)}`,
                  };
                }
                return {
                  fill: '#FFFBEB',
                  stroke: '#F59E0B',
                  textFill: '#B45309',
                  label: '+ 点击配置防御组件',
                };
              })();

              return (
                <g
                  key={node.id}
                  onClick={() => {
                    if (node.slotId) setActiveSlotId(node.slotId);
                  }}
                  style={{
                    cursor: isFlawSlot ? 'pointer' : 'default',
                    opacity: isReachedInSweep ? 1 : 0.65,
                    transition: 'opacity 180ms ease-out',
                  }}
                >
                  {/* Mounted Defense Shield Box above Vulnerability Nodes */}
                  {isFlawSlot && (
                    <g>
                      <line
                        x1={node.x + NODE_WIDTH / 2}
                        y1={78}
                        x2={node.x + NODE_WIDTH / 2}
                        y2={node.y}
                        stroke={shieldState.stroke}
                        strokeWidth="1.5"
                        strokeDasharray={equippedOpt ? undefined : '3 2'}
                      />
                      <rect
                        x={node.x - 6}
                        y={48}
                        width={NODE_WIDTH + 12}
                        height={30}
                        rx="6"
                        fill={shieldState.fill}
                        stroke={shieldState.stroke}
                        strokeWidth="1.3"
                      />
                      <text
                        x={node.x + NODE_WIDTH / 2}
                        y={67}
                        textAnchor="middle"
                        fill={shieldState.textFill}
                        fontSize="10"
                        fontWeight="700"
                      >
                        {shieldState.label}
                      </text>
                    </g>
                  )}

                  {/* Main Node Card */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="10"
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.dash}
                  />

                  <text
                    x={node.x + 10}
                    y={node.y + 20}
                    fill={style.headerColor}
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    NODE {node.stepCode}
                  </text>

                  <text
                    x={node.x + 10}
                    y={node.y + 46}
                    fill="#0F172A"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {truncateSvgText(node.title, 10.2)}
                  </text>

                  <text
                    x={node.x + 10}
                    y={node.y + 67}
                    fill="#475569"
                    fontSize="10"
                  >
                    {truncateSvgText(node.subtitle, 12.2)}
                  </text>

                  {/* Node Footer Status Line */}
                  <line
                    x1={node.x + 10}
                    y1={node.y + 80}
                    x2={node.x + NODE_WIDTH - 10}
                    y2={node.y + 80}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={node.x + 10}
                    y={node.y + 95}
                    fill={style.headerColor}
                    fontSize="9.5"
                    fontWeight="700"
                  >
                    {style.statusText}
                  </text>
                </g>
              );
            })}

            {/* Bottom Hint Line */}
            <text x="18" y="232" fill="#64748B" fontSize="11">
              目标失守后果：{truncateSvgText(scenario.impactIfUnblocked, 74)}
            </text>
          </svg>
        </div>

        {/* Two Vulnerability Slot Selectors (Accessible Control Mirror for SVG Slots) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {scenario.slots.map((slot) => {
            const isActive = slot.id === activeSlot?.id;
            const equippedId = currentEquipped[slot.id];
            const equippedOpt = equippedId
              ? scenario.defenseOptions.find((o) => o.id === equippedId)
              : null;
            const slotEval = evaluation?.slotResults.find((r) => r.slotId === slot.id);

            return (
              <div
                key={slot.id}
                data-testid={`challenge-slot-${slot.id}`}
                className={`rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'bg-blue-50/40 border-blue-600 ring-1 ring-blue-600/20'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveSlotId(slot.id)}
                    className="text-left flex-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{slot.label}</span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span className={isActive ? 'font-semibold text-blue-700' : 'text-slate-500'}>
                        {isActive ? '当前正在配置' : '点击切换配置'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {slot.vulnerabilityDetail}
                    </p>
                  </button>

                  {equippedOpt && (
                    <button
                      type="button"
                      aria-label={`移除 ${slot.label} 的防御组件`}
                      onClick={() => handleClearSlot(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">已装配组件：</span>
                  {equippedOpt ? (
                    <span
                      className={`font-semibold ${
                        slotEval?.status === 'blocked'
                          ? 'text-emerald-700'
                          : slotEval?.status === 'mitigated'
                            ? 'text-amber-700'
                            : slotEval
                              ? 'text-red-700'
                              : 'text-blue-700'
                      }`}
                    >
                      {equippedOpt.name}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">尚未部署（漏洞暴露）</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control & Concept Deck: Defense Component Arsenal + Evaluation Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Main: Defense Component Arsenal */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                防御组件库（为「{activeSlot?.layerName}」挑选防线）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                注意：候选组件中包含常见“伪防御/错位防御”干扰项，请结合当前漏洞所在层级精准装配
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSolutionHint((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 whitespace-nowrap shrink-0 cursor-pointer py-1"
            >
              {showSolutionHint ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  收起参考解析
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  查看标准防线解析
                </>
              )}
            </button>
          </div>

          {showSolutionHint && (
            <div
              data-testid="challenge-solution-hint"
              className="rounded-lg bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-950 leading-relaxed"
            >
              <strong className="font-semibold text-blue-900">参考防御组合思路：</strong>
              <GlossaryText text={scenario.recommendedComboNote} />
            </div>
          )}

          <div
            role="group"
            aria-label={`为${activeSlot?.layerName ?? '当前卡槽'}选择防御组件`}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {scenario.defenseOptions.map((opt) => {
              const isEquippedInActiveSlot = activeSlot
                ? currentEquipped[activeSlot.id] === opt.id
                : false;
              const equippedInOtherSlot = scenario.slots.find(
                (s) => s.id !== activeSlot?.id && currentEquipped[s.id] === opt.id
              );

              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isEquippedInActiveSlot}
                  data-testid={`defense-opt-${opt.id}`}
                  onClick={() => handleEquipDefense(opt.id)}
                  className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isEquippedInActiveSlot
                      ? 'bg-blue-50/80 border-blue-600 ring-1 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-medium text-slate-500">{opt.shortTag}</span>
                      {isEquippedInActiveSlot ? (
                        <span className="font-semibold text-blue-700">已装配当前槽</span>
                      ) : equippedInOtherSlot ? (
                        <span className="text-slate-500">已用于另一卡槽</span>
                      ) : (
                        <span className="text-slate-400">点击装配</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {opt.name}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Attack Simulation Verdict & Hop-by-Hop Trace */}
        <div
          data-testid="challenge-verdict-panel"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">模拟攻击检验与逐跳复盘</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              装配防线后点击「发起攻击模拟检验」，观察攻击载荷在各节点是被拦截还是穿透
            </p>
          </div>

          {!evaluation ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-5 space-y-3 text-center">
              <Shield className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-800">尚未发起模拟检验</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  当前已配置 {equippedCount} / {scenario.slots.length}{' '}
                  处防线卡槽。你可以直接检验“裸奔/错配防御”的穿透效果，或先在左侧装配双层纵深防线再发起攻击测试。
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunSimulation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                立即发起模拟攻击
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Outcome Summary Banner */}
              <div
                data-testid="challenge-outcome-banner"
                className={`rounded-xl border p-4 space-y-2 ${
                  evaluation.outcome === 'intercepted'
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : evaluation.outcome === 'partial'
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-red-50/70 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {evaluation.outcome === 'intercepted' ? (
                      <ShieldCheck
                        className="w-5 h-5 text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                    ) : evaluation.outcome === 'partial' ? (
                      <AlertTriangle
                        className="w-5 h-5 text-amber-700 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldOff className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        evaluation.outcome === 'intercepted'
                          ? 'text-emerald-900'
                          : evaluation.outcome === 'partial'
                            ? 'text-amber-900'
                            : 'text-red-900'
                      }`}
                    >
                      {evaluation.outcomeLabel}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-mono font-bold tabular-nums ${
                      evaluation.outcome === 'intercepted'
                        ? 'text-emerald-800'
                        : evaluation.outcome === 'partial'
                          ? 'text-amber-800'
                          : 'text-red-800'
                    }`}
                  >
                    {evaluation.score} / 100
                  </span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    evaluation.outcome === 'intercepted'
                      ? 'text-emerald-950/90'
                      : evaluation.outcome === 'partial'
                        ? 'text-amber-950/90'
                        : 'text-red-950/90'
                  }`}
                >
                  {evaluation.summary}
                </p>
              </div>

              {/* Hop-by-hop Attack Trace List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">攻击链逐跳推演记录</div>
                <ol
                  data-testid="challenge-trace-list"
                  className="space-y-2"
                >
                  {evaluation.traceSteps.map((step) => {
                    const isGood = step.status === 'blocked' || step.status === 'protected';
                    const isWarn = step.status === 'weakened' || step.status === 'attack-entry';
                    return (
                      <li
                        key={step.nodeId}
                        className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 min-w-0">
                            {isGood ? (
                              <CheckCircle2
                                className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                                aria-hidden="true"
                              />
                            ) : isWarn ? (
                              <AlertTriangle
                                className="w-3.5 h-3.5 text-amber-700 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <ShieldAlert
                                className="w-3.5 h-3.5 text-red-700 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span className="font-mono text-slate-500">{step.stepCode}</span>
                            <span className="truncate">{step.title}</span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold shrink-0 ${
                              isGood
                                ? 'text-emerald-700'
                                : isWarn
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {step.status === 'blocked'
                              ? '已拦截'
                              : step.status === 'protected'
                                ? '安全'
                                : step.status === 'weakened'
                                  ? '弱缓解'
                                  : step.status === 'attack-entry'
                                    ? '注入起点'
                                    : '已穿透'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <GlossaryText text={step.message} />
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
