import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  StepForward,
} from 'lucide-react';
import { SECURITY_LOG_SCENARIOS } from '../data/securityDefenseData';
import type {
  SecurityLogEntry,
  SecurityLogScenarioId,
  SecurityLogSeverity,
} from '../types/learning';
import {
  filterSecurityLogs,
  formatSimulatedLogTime,
  summarizeLogStats,
} from '../utils/securityDefense';
import { GlossaryText } from './GlossaryText';

const SEVERITY_FILTERS: Array<{ id: SecurityLogSeverity | 'ALL'; label: string }> = [
  { id: 'ALL', label: '全部事件' },
  { id: 'BLOCKED', label: '已拦截 BLOCKED' },
  { id: 'ALERT', label: '高危告警 ALERT' },
  { id: 'DETECT', label: '行为检测 DETECT' },
];

function createLogEntry(
  scenarioId: SecurityLogScenarioId,
  eventIndex: number,
  baseEpochMs: number,
  runCycle: number
): SecurityLogEntry | null {
  const scenario =
    SECURITY_LOG_SCENARIOS.find((s) => s.id === scenarioId) ?? SECURITY_LOG_SCENARIOS[0];
  const tpl = scenario.events[eventIndex];
  if (!tpl) return null;
  return {
    ...tpl,
    instanceId: `${scenarioId}-${runCycle}-${tpl.id}`,
    timestamp: formatSimulatedLogTime(baseEpochMs, tpl.offsetSec),
  };
}

export function SecurityEventLogStream() {
  const [scenarioId, setScenarioId] = useState<SecurityLogScenarioId>(
    SECURITY_LOG_SCENARIOS[0].id
  );
  const [severityFilter, setSeverityFilter] = useState<SecurityLogSeverity | 'ALL'>('ALL');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(1700);
  const [runCycle, setRunCycle] = useState<number>(1);
  const [baseEpochMs, setBaseEpochMs] = useState<number>(() => Date.now());
  const [logs, setLogs] = useState<SecurityLogEntry[]>(() => {
    const now = Date.now();
    const first = createLogEntry(SECURITY_LOG_SCENARIOS[0].id, 0, now, 1);
    const second = createLogEntry(SECURITY_LOG_SCENARIOS[0].id, 1, now, 1);
    return [first, second].filter((item): item is SecurityLogEntry => item !== null);
  });
  const [nextCursor, setNextCursor] = useState<number>(2);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const activeScenario = useMemo(() => {
    return (
      SECURITY_LOG_SCENARIOS.find((s) => s.id === scenarioId) ?? SECURITY_LOG_SCENARIOS[0]
    );
  }, [scenarioId]);

  const isCompleted = nextCursor >= activeScenario.events.length;

  useEffect(() => {
    if (!isStreaming || isCompleted) return;
    const timer = window.setInterval(() => {
      setNextCursor((prevCursor) => {
        const entry = createLogEntry(scenarioId, prevCursor, baseEpochMs, runCycle);
        if (!entry) {
          setIsStreaming(false);
          return prevCursor;
        }
        setLogs((prevLogs) => [...prevLogs, entry]);
        const upcoming = prevCursor + 1;
        if (upcoming >= activeScenario.events.length) {
          setIsStreaming(false);
        }
        return upcoming;
      });
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [isStreaming, isCompleted, scenarioId, baseEpochMs, runCycle, speedMs, activeScenario.events.length]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs.length, severityFilter]);

  const visibleLogs = useMemo(
    () => filterSecurityLogs(logs, severityFilter),
    [logs, severityFilter]
  );

  const stats = useMemo(() => summarizeLogStats(logs), [logs]);

  const inspectedLog = useMemo(() => {
    if (selectedInstanceId) {
      const found = logs.find((item) => item.instanceId === selectedInstanceId);
      if (found) return found;
    }
    return visibleLogs[visibleLogs.length - 1] ?? logs[logs.length - 1] ?? null;
  }, [logs, visibleLogs, selectedInstanceId]);

  const startScenarioFresh = (targetScenarioId: SecurityLogScenarioId) => {
    const now = Date.now();
    const nextCycle = runCycle + 1;
    const first = createLogEntry(targetScenarioId, 0, now, nextCycle);
    setScenarioId(targetScenarioId);
    setBaseEpochMs(now);
    setRunCycle(nextCycle);
    setLogs(first ? [first] : []);
    setNextCursor(first ? 1 : 0);
    setSelectedInstanceId(null);
    setSeverityFilter('ALL');
    setIsStreaming(true);
  };

  const handleInjectNext = () => {
    setIsStreaming(false);
    if (nextCursor >= activeScenario.events.length) {
      startScenarioFresh(scenarioId);
      return;
    }
    const entry = createLogEntry(scenarioId, nextCursor, baseEpochMs, runCycle);
    if (entry) {
      setLogs((prev) => [...prev, entry]);
      setSelectedInstanceId(entry.instanceId);
      setNextCursor((prev) => prev + 1);
    }
  };

  const handleToggleStream = () => {
    if (isCompleted) {
      startScenarioFresh(scenarioId);
      return;
    }
    setIsStreaming((prev) => !prev);
  };

  return (
    <section
      aria-label="模拟实时安全日志流"
      data-testid="security-event-log-stream"
      data-log-count={logs.length}
      data-scenario={scenarioId}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
    >
      {/* Header & Live Counters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Radio className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>模拟实时安全日志流 · AI 代理对抗与蓝队联防遥测</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            AI 代理渗透对抗检测与攻击链实时拦截演示
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            <GlossaryText text="实时滚动呈现 WAF、API 网关、SIEM、提示词防火墙与 MCP 策略引擎在对抗中的关键日志，点击任意日志条目即可拆解「为何被蓝队识破」与「自动拦截动作」。" />
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0 tabular-nums">
          <div>
            <div className="text-[11px] text-slate-500">已捕获事件</div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {stats.total}/{activeScenario.events.length}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-amber-700">高危告警</div>
            <div className="text-lg font-bold font-mono text-amber-700">{stats.alertCount}</div>
          </div>
          <div className="h-7 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-[11px] text-emerald-700">成功拦截</div>
            <div
              data-testid="log-blocked-count"
              className="text-lg font-bold font-mono text-emerald-700"
            >
              {stats.blockedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Switcher */}
      <div
        role="group"
        aria-label="选择安全日志演练场景"
        className="grid grid-cols-1 md:grid-cols-3 gap-2.5"
      >
        {SECURITY_LOG_SCENARIOS.map((sc) => {
          const active = sc.id === scenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              aria-pressed={active}
              onClick={() => startScenarioFresh(sc.id)}
              className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                active
                  ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600/15'
                  : 'bg-[#F7F8FA]/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">{sc.label}</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{sc.shortDesc}</p>
            </button>
          );
        })}
      </div>

      {/* Stream Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="按日志严重级别筛选"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
        >
          {SEVERITY_FILTERS.map((flt) => {
            const active = severityFilter === flt.id;
            return (
              <button
                key={flt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSeverityFilter(flt.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {flt.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleStream}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              isStreaming
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                暂停滚动
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                {isCompleted ? '重放本轮日志' : '恢复实时流'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleInjectNext}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <StepForward className="w-3.5 h-3.5" aria-hidden="true" />
            单步推进
          </button>

          <button
            type="button"
            onClick={() => setSpeedMs((prev) => (prev === 1700 ? 900 : 1700))}
            className="px-2.5 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            速度：{speedMs === 1700 ? '1x' : '2x'}
          </button>

          <button
            type="button"
            onClick={() => startScenarioFresh(scenarioId)}
            aria-label="重置模拟日志流"
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Scrolling Terminal Log Viewport */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <span className="truncate">
            SOC-STREAM :: {activeScenario.label}（点击任意行查看蓝队研判原理）
          </span>
          <span className="shrink-0 text-slate-300">
            {isStreaming ? '实时滚动中' : isCompleted ? '本轮演练完成' : '已暂停'}
          </span>
        </div>

        <div
          ref={viewportRef}
          role="log"
          aria-live="polite"
          aria-label="AI 代理攻防检测日志列表"
          className="h-[310px] overflow-y-auto divide-y divide-slate-800/80 font-mono text-xs"
        >
          {visibleLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 px-4 text-center">
              当前筛选条件下暂无日志事件，等待实时流推进或切换「全部事件」查看。
            </div>
          ) : (
            visibleLogs.map((entry) => {
              const isSelected = inspectedLog?.instanceId === entry.instanceId;
              const severityTextClass =
                entry.severity === 'BLOCKED'
                  ? 'text-emerald-400'
                  : entry.severity === 'ALERT'
                    ? 'text-amber-400'
                    : 'text-sky-400';

              return (
                <button
                  key={entry.instanceId}
                  type="button"
                  onClick={() => {
                    setSelectedInstanceId(entry.instanceId);
                    setIsStreaming(false);
                  }}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer block ${
                    isSelected ? 'bg-slate-800/90' : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-slate-500 tabular-nums shrink-0">{entry.timestamp}</span>
                    <span className={`font-bold shrink-0 ${severityTextClass}`}>
                      [{entry.severity}]
                    </span>
                    <span className="text-slate-300 shrink-0">{entry.source}</span>
                    <span className="text-slate-500 shrink-0">·</span>
                    <span className="text-slate-400 shrink-0">{entry.stageTag}</span>
                  </div>
                  <div className="text-slate-100 font-sans font-semibold text-xs mt-1">
                    {entry.title}
                  </div>
                  <div className="text-slate-400 font-sans text-[11px] mt-0.5 leading-relaxed">
                    {entry.detail}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Event Blue-Team Explanation Panel */}
      {inspectedLog && (
        <div
          data-testid="log-inspector"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1"
        >
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>蓝队检测依据 · {inspectedLog.stageTag}</span>
            </div>
            <p className="text-xs text-amber-950/90 leading-relaxed">
              <GlossaryText text={inspectedLog.detectionWhy} />
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                <GlossaryText text={`网关 / SOAR 自动防御处置（${inspectedLog.source}）`} tooltipOnly />
              </span>
            </div>
            <p className="text-xs text-emerald-950/90 leading-relaxed">
              <GlossaryText text={inspectedLog.defenseAction} />
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
