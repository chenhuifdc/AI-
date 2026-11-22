import { useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Cpu,
  GitCompare,
  Layers,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  AGENT_SECURITY_FRAMEWORKS,
  ARCHITECTURE_COMPARISON_ROWS,
  ATTACK_VECTORS,
  ENTERPRISE_DEFENSE_CONTROLS,
  OODA_STAGES,
} from '../data/securityDefenseData';
import type { AttackPhase, DefensePillarId } from '../types/learning';
import { computeDefenseReadiness, filterAttackVectors } from '../utils/securityDefense';
import { AgentWorkflowFlowchart } from './AgentWorkflowFlowchart';
import { ProtocolCompareDashboard } from './ProtocolCompareDashboard';
import { SecurityEventLogStream } from './SecurityEventLogStream';
import { AgentVulnerabilitySelfTest } from './AgentVulnerabilitySelfTest';
import { AgentAttackChallenge } from './AgentAttackChallenge';
import { GlossaryText } from './GlossaryText';

type SecurityTabId = 'vectors' | 'agents' | 'mcp-compare' | 'live-lab' | 'challenge' | 'enterprise';

interface SecurityDefenseViewProps {
  checkedDefenseIds: string[];
  onToggleDefenseControl: (controlId: string) => void;
}

const SECURITY_TABS: Array<{ id: SecurityTabId; label: string }> = [
  { id: 'vectors', label: '网络攻击与木马防御' },
  { id: 'agents', label: 'AI 代理式安全框架' },
  { id: 'mcp-compare', label: 'Agent 框架 vs MCP 架构' },
  { id: 'live-lab', label: '实时日志与漏洞自测' },
  { id: 'challenge', label: 'AI 攻击模拟挑战赛' },
  { id: 'enterprise', label: '企业检测与加固清单' },
];

const PHASE_FILTERS: Array<{ id: AttackPhase | 'ALL'; label: string }> = [
  { id: 'ALL', label: '全链路 6 类' },
  { id: 'initial-access', label: '01 初始突破' },
  { id: 'execution-persistence', label: '02 驻留窃密' },
  { id: 'lateral-impact', label: '03 横向与勒索' },
];

const PILLAR_TABS: Array<{ id: DefensePillarId | 'ALL'; label: string }> = [
  { id: 'ALL', label: '全部控制项' },
  { id: 'telemetry', label: '行为检测与遥测' },
  { id: 'identity', label: '身份与凭证加固' },
  { id: 'boundary', label: '边界收敛与微分段' },
  { id: 'deception', label: '主动诱捕与韧性响应' },
];

export function SecurityDefenseView({
  checkedDefenseIds,
  onToggleDefenseControl,
}: SecurityDefenseViewProps) {
  const [activeTab, setActiveTab] = useState<SecurityTabId>('vectors');
  const [phaseFilter, setPhaseFilter] = useState<AttackPhase | 'ALL'>('ALL');
  const [selectedVectorId, setSelectedVectorId] = useState<string>(ATTACK_VECTORS[0].id);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(
    AGENT_SECURITY_FRAMEWORKS[0].id
  );
  const [showBlueTeamColumn, setShowBlueTeamColumn] = useState<boolean>(true);
  const [pillarFilter, setPillarFilter] = useState<DefensePillarId | 'ALL'>('ALL');

  const visibleVectors = useMemo(
    () => filterAttackVectors(ATTACK_VECTORS, phaseFilter),
    [phaseFilter]
  );

  const selectedVector = useMemo(() => {
    return (
      visibleVectors.find((v) => v.id === selectedVectorId) ??
      visibleVectors[0] ??
      ATTACK_VECTORS[0]
    );
  }, [visibleVectors, selectedVectorId]);

  const selectedFramework = useMemo(() => {
    return (
      AGENT_SECURITY_FRAMEWORKS.find((fw) => fw.id === selectedFrameworkId) ??
      AGENT_SECURITY_FRAMEWORKS[0]
    );
  }, [selectedFrameworkId]);

  const readiness = useMemo(
    () => computeDefenseReadiness(checkedDefenseIds, ENTERPRISE_DEFENSE_CONTROLS),
    [checkedDefenseIds]
  );

  const filteredControls = useMemo(() => {
    if (pillarFilter === 'ALL') return ENTERPRISE_DEFENSE_CONTROLS;
    return ENTERPRISE_DEFENSE_CONTROLS.filter((c) => c.pillar === pillarFilter);
  }, [pillarFilter]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-semibold tracking-wider text-blue-700 uppercase">
            AI 时代网络安全与架构认知工作台 · 纯防御与原理视域
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            从木马防御到 AI 代理式安全架构演进
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            <GlossaryText text="系统理解常见网络攻击与木马病毒的防御逻辑，拆解 PentAGI、ARTEX、Cairn、CyberStrikeAI 如何把大模型引入自主安全闭环，厘清其与 HexStrike 等 MCP 工具协议的本质架构差异，并落地企业级抗 AI 自动化入侵加固清单。" />
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0 tabular-nums">
          <div>
            <div className="text-xs text-slate-500">架构对比框架</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">4 大代理 · MCP</div>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">加固自检完成度</div>
            <div
              data-testid="defense-readiness-percent"
              className="text-lg font-bold text-blue-700 mt-0.5"
            >
              {readiness.percent}%
            </div>
          </div>
        </div>
      </section>

      {/* Primary Module Tabs */}
      <div
        role="tablist"
        aria-label="AI 安全攻防学习模块切换"
        className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200"
      >
        {SECURITY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'border-blue-700 text-blue-700 bg-white font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Network Attacks, Trojans & Defense */}
      {activeTab === 'vectors' && (
        <section
          aria-label="网络攻击与木马防御图谱"
          data-testid="security-tab-vectors"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                网络攻击与木马病毒核心路径及有效防御
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                按攻击链阶段筛选，点击左侧任意条目对比「个人/零代码实践者防线」与「企业级纵深防御」
              </p>
            </div>

            <div
              role="group"
              aria-label="按攻击阶段筛选"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {PHASE_FILTERS.map((phase) => {
                const active = phaseFilter === phase.id;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPhaseFilter(phase.id);
                      const nextList = filterAttackVectors(ATTACK_VECTORS, phase.id);
                      if (nextList.length > 0 && !nextList.some((v) => v.id === selectedVectorId)) {
                        setSelectedVectorId(nextList[0].id);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {phase.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Vector List */}
            <div className="lg:col-span-5 space-y-2.5">
              {visibleVectors.map((vector) => {
                const isSelected = vector.id === selectedVector.id;
                return (
                  <button
                    key={vector.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedVectorId(vector.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-600 ring-1 ring-blue-600/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <span className="text-blue-700 font-semibold">{vector.phaseLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{vector.category}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                      {vector.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Deep-Dive Defense Card */}
            <article className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-amber-700">{selectedVector.phaseLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedVector.category}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  <GlossaryText text={selectedVector.title} tooltipOnly />
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed pt-1">
                  <GlossaryText text={selectedVector.mechanismSummary} />
                </p>
              </div>

              {/* Stealth Signals */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  常见隐蔽迹象与风险信号
                </h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  {selectedVector.stealthSignals.map((sig) => (
                    <li key={sig} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold leading-5" aria-hidden="true">
                        •
                      </span>
                      <span className="leading-relaxed">
                        <GlossaryText text={sig} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Personal / Zero-Code Practitioner Defense */}
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>
                    <GlossaryText text="个人与零代码 AI 实践者防线（贴合 Docker / 开源工具日常）" tooltipOnly />
                  </span>
                </div>
                <p className="text-sm text-emerald-950/90 leading-relaxed">
                  <GlossaryText text={selectedVector.personalDefense} />
                </p>
              </div>

              {/* Enterprise Defense */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                  <span>企业级纵深防御对策</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {selectedVector.enterpriseDefense.map((step, index) => (
                    <li
                      key={step}
                      className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/70 rounded-lg px-3.5 py-2.5"
                    >
                      <span className="text-xs font-mono font-bold text-blue-700 mt-0.5 shrink-0">
                        0{index + 1}
                      </span>
                      <span className="leading-relaxed">
                        <GlossaryText text={step} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* TAB 2: LLM Agentic Security Frameworks */}
      {activeTab === 'agents' && (
        <section
          aria-label="AI 代理式安全框架机制"
          data-testid="security-tab-agents"
          className="space-y-6"
        >
          {/* Interactive 6-Step SVG Workflow Flowchart */}
          <AgentWorkflowFlowchart />

          {/* OODA Autonomous Loop Visual */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  <GlossaryText text="核心范式跃迁：从「单次问答」到「机器速度 OODA 自主闭环」" />
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                <GlossaryText text="LLM 如何被嵌入自动化渗透与安全评估流程？" tooltipOnly />
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                <GlossaryText text="与你在日常中指挥智能体“看报错 → 改方案 → 再运行”类似，ARTEX、PentAGI、Cairn 与 CyberStrikeAI 将大语言模型直接放入持续循环：读取工具输出、更新记忆图谱、动态规划下一步意图并自动纠错，把传统需要数天的人工研判压缩至小时甚至分钟级。" />
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OODA_STAGES.map((stage) => (
                <div
                  key={stage.step}
                  className="rounded-lg border border-slate-200 bg-[#F7F8FA]/80 p-4 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2 font-mono">
                    <span className="text-xs font-bold text-blue-700">STEP {stage.step}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{stage.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{stage.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <GlossaryText text={stage.desc} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4 Frameworks Selector & Deep-Dive */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                四大代表性 AI 代理式安全框架机制拆解
              </h2>
              <span className="text-xs text-slate-500">
                点击下方卡片切换查看架构机制与蓝队检测特征
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {AGENT_SECURITY_FRAMEWORKS.map((fw) => {
                const active = fw.id === selectedFramework.id;
                return (
                  <button
                    key={fw.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedFrameworkId(fw.id)}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-white border-blue-600 ring-1 ring-blue-600/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-base font-bold font-mono text-slate-900">{fw.name}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-snug">{fw.tagline}</div>
                  </button>
                );
              })}
            </div>

            <article className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold font-mono text-slate-900">
                    {selectedFramework.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedFramework.tagline}</p>
                </div>
                <div className="text-xs font-medium text-blue-700 bg-blue-50/70 border border-blue-200/70 rounded-md px-3 py-1.5">
                  核心机制：<GlossaryText text={selectedFramework.corePattern} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      典型技术栈与运行形态
                    </h4>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      <GlossaryText text={selectedFramework.techStack} />
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      自动化执行流程
                    </h4>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      <GlossaryText text={selectedFramework.workflowSummary} />
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      状态与长程记忆设计
                    </h4>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                      <GlossaryText text={selectedFramework.memoryMechanism} />
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                    <div className="text-xs font-bold text-slate-800">
                      零代码工具链类比理解
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <GlossaryText text={selectedFramework.zeroCodeAnalogy} />
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>防守方（蓝队）可捕捉的行为特征</span>
                </div>
                <p className="text-sm text-amber-950/90 leading-relaxed">
                  <GlossaryText text={selectedFramework.blueTeamSignal} />
                </p>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* TAB 3: Agent Frameworks vs MCP Tool Servers (HexStrike) */}
      {activeTab === 'mcp-compare' && (
        <section
          aria-label="自主代理式框架与 MCP 架构差异"
          data-testid="security-tab-mcp"
          className="space-y-6"
        >
          {/* Interactive Protocol Comparison Dashboard */}
          <ProtocolCompareDashboard />

          {/* Side-by-Side Architecture SVG Diagram */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  架构本质差异：全自主代理框架 vs MCP 工具协议桥接（如 HexStrike）
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  左侧自带“大脑循环 + 记忆库 + 沙箱”；右侧只做“标准化工具总机”，由外部任意 LLM 客户端遥控
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <GitCompare className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>双轨架构对比图</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <svg
                viewBox="0 0 880 340"
                role="img"
                aria-label="自主多智能体安全框架与 MCP 工具服务器架构对比图"
                className="w-full min-w-[760px] h-auto block"
              >
                <defs>
                  <marker
                    id="sec-arrow-blue"
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
                    id="sec-arrow-emerald"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
                  </marker>
                </defs>

                {/* Left Container: Autonomous Agentic Framework */}
                <rect
                  x="12"
                  y="14"
                  width="414"
                  height="312"
                  rx="12"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
                <text x="30" y="42" fill="#0F172A" fontSize="14" fontWeight="700">
                  A. 自主多智能体框架（PentAGI / ARTEX / Cairn）
                </text>
                <text x="30" y="61" fill="#64748B" fontSize="11">
                  框架内置规划循环、长期记忆与反思机制，端到端自治推进
                </text>

                {/* Operator Goal */}
                <rect x="30" y="78" width="160" height="44" rx="8" fill="#FFFFFF" stroke="#94A3B8" />
                <text x="110" y="97" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                  高层自然语言目标
                </text>
                <text x="110" y="113" textAnchor="middle" fill="#64748B" fontSize="10">
                  操作者设定范围与目的
                </text>

                {/* Planner / Reflector */}
                <rect x="234" y="78" width="174" height="58" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
                <text x="321" y="100" textAnchor="middle" fill="#1E3A8A" fontSize="12" fontWeight="700">
                  内置 Planner / Reflector
                </text>
                <text x="321" y="118" textAnchor="middle" fill="#1D4ED8" fontSize="10">
                  自动拆解意图 · 卡死自纠错
                </text>

                <line x1="190" y1="100" x2="230" y2="100" stroke="#1D4ED8" strokeWidth="1.6" markerEnd="url(#sec-arrow-blue)" />

                {/* Persistent Memory Graph */}
                <rect x="30" y="162" width="160" height="62" rx="8" fill="#FFFFFF" stroke="#3B82F6" />
                <text x="110" y="185" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                  持久记忆与图谱库
                </text>
                <text x="110" y="203" textAnchor="middle" fill="#475569" fontSize="10">
                  pgvector · Neo4j · Facts 池
                </text>
                <text x="110" y="217" textAnchor="middle" fill="#64748B" fontSize="9.5">
                  跨阶段保留拓扑与线索
                </text>

                {/* Worker Agents + Sandbox */}
                <rect x="234" y="162" width="174" height="62" rx="8" fill="#FFFFFF" stroke="#2563EB" />
                <text x="321" y="185" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                  并行 Worker + Docker 沙箱
                </text>
                <text x="321" y="203" textAnchor="middle" fill="#475569" fontSize="10">
                  内置 20+ 工具自动执行
                </text>
                <text x="321" y="217" textAnchor="middle" fill="#64748B" fontSize="9.5">
                  回传标准输出形成闭环
                </text>

                <line x1="321" y1="136" x2="321" y2="158" stroke="#1D4ED8" strokeWidth="1.6" markerEnd="url(#sec-arrow-blue)" />
                <line x1="234" y1="193" x2="194" y2="193" stroke="#1D4ED8" strokeWidth="1.5" markerEnd="url(#sec-arrow-blue)" />
                <path d="M 110 162 L 110 146 L 260 146 L 260 140" fill="none" stroke="#1D4ED8" strokeWidth="1.4" strokeDasharray="4 3" markerEnd="url(#sec-arrow-blue)" />

                {/* Left Footer Summary */}
                <rect x="30" y="248" width="378" height="58" rx="8" fill="#EFF6FF" stroke="#BFDBFE" />
                <text x="44" y="270" fill="#1E3A8A" fontSize="11.5" fontWeight="700">
                  核心特征：一体化自治闭环（Heavy Orchestration）
                </text>
                <text x="44" y="289" fill="#1E40AF" fontSize="10.5">
                  编排逻辑与记忆全内置；自动化程度高，但容易以机器速度产生连续探测流
                </text>

                {/* Right Container: MCP Tool Server */}
                <rect
                  x="454"
                  y="14"
                  width="414"
                  height="312"
                  rx="12"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="1.2"
                />
                <text x="472" y="42" fill="#0F172A" fontSize="14" fontWeight="700">
                  B. MCP 工具协议桥接架构（如 HexStrike MCP）
                </text>
                <text x="472" y="61" fill="#64748B" fontSize="11">
                  本身不内置大模型，仅作为标准协议总机对接外部任意 AI 客户端
                </text>

                {/* External LLM Client */}
                <rect x="472" y="78" width="166" height="58" rx="8" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
                <text x="555" y="100" textAnchor="middle" fill="#064E3B" fontSize="12" fontWeight="700">
                  外部任意 LLM 客户端
                </text>
                <text x="555" y="118" textAnchor="middle" fill="#047857" fontSize="10">
                  桌面客户端 / IDE / 自定义代理
                </text>

                {/* MCP Protocol Bridge */}
                <rect x="684" y="78" width="166" height="58" rx="8" fill="#FFFFFF" stroke="#10B981" />
                <text x="767" y="100" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700">
                  HexStrike MCP Server
                </text>
                <text x="767" y="118" textAnchor="middle" fill="#475569" fontSize="10">
                  Stdio / SSE / HTTP 标准接口
                </text>

                <line x1="638" y1="107" x2="680" y2="107" stroke="#047857" strokeWidth="1.6" markerEnd="url(#sec-arrow-emerald)" />
                <text x="659" y="99" textAnchor="middle" fill="#047857" fontSize="9.5" fontWeight="700">
                  MCP
                </text>

                {/* Human-in-the-loop */}
                <rect x="472" y="162" width="166" height="62" rx="8" fill="#FFFFFF" stroke="#94A3B8" />
                <text x="555" y="185" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                  人工确认与上下文管理
                </text>
                <text x="555" y="203" textAnchor="middle" fill="#475569" fontSize="10">
                  由外部宿主客户端掌管
                </text>
                <text x="555" y="217" textAnchor="middle" fill="#64748B" fontSize="9.5">
                  天然支持逐条审批调用
                </text>

                {/* 150+ CLI Security Tools */}
                <rect x="684" y="162" width="166" height="62" rx="8" fill="#FFFFFF" stroke="#059669" />
                <text x="767" y="185" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="600">
                  150+ 封装工具总机
                </text>
                <text x="767" y="203" textAnchor="middle" fill="#475569" fontSize="10">
                  侦察 · Web · 二进制模块
                </text>
                <text x="767" y="217" textAnchor="middle" fill="#64748B" fontSize="9.5">
                  按需执行并返回结构化结果
                </text>

                <line x1="555" y1="162" x2="555" y2="140" stroke="#047857" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#sec-arrow-emerald)" />
                <line x1="767" y1="136" x2="767" y2="158" stroke="#047857" strokeWidth="1.6" markerEnd="url(#sec-arrow-emerald)" />

                {/* Right Footer Summary */}
                <rect x="472" y="248" width="378" height="58" rx="8" fill="#ECFDF5" stroke="#A7F3D0" />
                <text x="486" y="270" fill="#064E3B" fontSize="11.5" fontWeight="700">
                  核心特征：解耦式能力插座（Tool Protocol Switchboard）
                </text>
                <text x="486" y="289" fill="#065F46" fontSize="10.5">
                  换大模型无需改后端；极低门槛赋能任意客户端，但需严控未授权 MCP 暴露
                </text>
              </svg>
            </div>
          </div>

          {/* 6-Dimension Detailed Architecture Comparison Table */}
          <div
            data-testid="architecture-comparison-table"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                  <h3 className="text-base font-bold text-slate-900">
                    MCP 工具 vs LLM 安全代理架构深度对比表
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  涵盖交互协议、数据存取与记忆底座、指令注入防范及攻击响应模式 6 大核心维度
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBlueTeamColumn}
                  onChange={(e) => setShowBlueTeamColumn(e.target.checked)}
                  className="rounded border-slate-300 accent-blue-700 cursor-pointer"
                />
                <span>同时显示蓝队防守关注点</span>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="py-3 px-4 font-semibold w-[16%] whitespace-nowrap">对比维度</th>
                    <th className="py-3 px-4 font-semibold text-blue-800">
                      自主代理式框架（PentAGI / ARTEX / Cairn / CyberStrikeAI）
                    </th>
                    <th className="py-3 px-4 font-semibold text-emerald-800">
                      MCP 工具协议架构（如 HexStrike MCP）
                    </th>
                    {showBlueTeamColumn && (
                      <th className="py-3 px-4 font-semibold text-amber-800">
                        企业蓝队防守视角
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 align-top">
                  {ARCHITECTURE_COMPARISON_ROWS.map((row) => (
                    <tr key={row.dimension} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-semibold text-slate-900 text-xs">
                        <GlossaryText text={row.dimension} tooltipOnly />
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-700 leading-relaxed">
                        <GlossaryText text={row.agenticFrameworks} />
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-700 leading-relaxed">
                        <GlossaryText text={row.mcpToolServers} />
                      </td>
                      {showBlueTeamColumn && (
                        <td className="py-4 px-4 text-xs text-amber-950/90 bg-amber-50/30 leading-relaxed">
                          <GlossaryText text={row.defenderFocus} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: Simulated Real-Time Security Log Stream & AI Agent Vulnerability Self-Test */}
      {activeTab === 'live-lab' && (
        <div
          data-testid="security-tab-live-lab"
          className="space-y-8"
        >
          <SecurityEventLogStream />
          <AgentVulnerabilitySelfTest />
        </div>
      )}

      {/* TAB 5: AI Agent Attack Simulation Challenge */}
      {activeTab === 'challenge' && <AgentAttackChallenge />}

      {/* TAB 6: Enterprise Detection & Hardening Readiness */}
      {activeTab === 'enterprise' && (
        <section
          aria-label="企业抗 AI 自动化入侵检测与加固清单"
          data-testid="security-tab-enterprise"
          className="space-y-6"
        >
          {/* Readiness Dashboard */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <Cpu className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>现代防御模型 · 针对 AI 自动化扫描与入侵</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  企业检测与加固成熟度自检台
                </h2>
                <p className="text-xs text-slate-600">{readiness.tierLabel}</p>
              </div>

              <div className="text-left md:text-right tabular-nums">
                <div className="text-3xl font-bold text-blue-700">{readiness.percent}%</div>
                <div className="text-xs text-slate-500">
                  已落实 {readiness.checkedCount} / {readiness.totalCount} 项核心加固控制
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all duration-300"
                style={{ width: `${readiness.percent}%` }}
              />
            </div>

            {/* 4 Pillar Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {readiness.pillarStats.map((stat) => (
                <div
                  key={stat.pillar}
                  className="rounded-lg border border-slate-200 bg-[#F7F8FA]/80 px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {stat.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums shrink-0">
                    {stat.checked}/{stat.total}
                  </span>
                </div>
              ))}
            </div>

            {/* Priority P0 Gaps */}
            {readiness.topUncheckedP0.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-1.5">
                <div className="text-xs font-bold text-amber-900">
                  优先补齐建议（尚未勾选的 P0 高危防线）：
                </div>
                <ul className="text-xs text-amber-950/90 space-y-1">
                  {readiness.topUncheckedP0.map((gap) => (
                    <li key={gap.id} className="flex items-start gap-1.5">
                      <span aria-hidden="true">·</span>
                      <span>
                        <strong>{gap.title}</strong> — 针对：{gap.targetThreat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pillar Filter */}
          <div
            role="group"
            aria-label="按防御支柱筛选加固项"
            className="flex flex-wrap items-center gap-1.5"
          >
            {PILLAR_TABS.map((pillar) => {
              const active = pillarFilter === pillar.id;
              return (
                <button
                  key={pillar.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPillarFilter(pillar.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {pillar.label}
                </button>
              );
            })}
          </div>

          {/* Interactive Hardening Checklist */}
          <ul
            data-testid="enterprise-defense-list"
            className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
          >
            {filteredControls.map((control) => {
              const checked = checkedDefenseIds.includes(control.id);
              return (
                <li key={control.id} className="p-5 flex items-start gap-3.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`标记已落实：${control.title}`}
                    onClick={() => onToggleDefenseControl(control.id)}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      checked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 hover:border-blue-600'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`font-mono font-bold ${
                          control.priority === 'P0' ? 'text-red-700' : 'text-blue-700'
                        }`}
                      >
                        {control.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700">{control.pillarLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        应对：<GlossaryText text={control.targetThreat} />
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-bold ${
                        checked ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      <GlossaryText text={control.title} tooltipOnly />
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <GlossaryText text={control.actionGuide} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
