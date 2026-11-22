import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LIFE_CASES } from '../data/learningData';
import type { LifeCaseStep } from '../types/learning';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';

interface LifeCaseLabViewProps {
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  masteredCaseIds: string[];
  onToggleCaseMastered: (caseId: string) => void;
}

const STEP_ACCENT_BORDER: Record<LifeCaseStep['accent'], string> = {
  blue: 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/40',
  emerald: 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/40',
  amber: 'border-amber-600 ring-2 ring-amber-100 bg-amber-50/40',
  indigo: 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/40',
};

const STEP_ACCENT_TEXT: Record<LifeCaseStep['accent'], string> = {
  blue: 'text-blue-700',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  indigo: 'text-indigo-700',
};

export function LifeCaseLabView({
  selectedCaseId,
  onSelectCase,
  masteredCaseIds,
  onToggleCaseMastered,
}: LifeCaseLabViewProps) {
  const activeCase =
    LIFE_CASES.find((c) => c.id === selectedCaseId) ?? LIFE_CASES[0];

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Reset step playback when user switches life case
  useEffect(() => {
    setActiveStepIndex(0);
    setIsPlaying(false);
  }, [activeCase.id]);

  // Step auto-playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= activeCase.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2600);
    return () => window.clearInterval(timer);
  }, [isPlaying, activeCase.steps.length]);

  const currentStep = activeCase.steps[activeStepIndex] ?? activeCase.steps[0];
  const isMastered = masteredCaseIds.includes(activeCase.id);

  const handlePrev = () => {
    setIsPlaying(false);
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setActiveStepIndex((prev) => Math.min(activeCase.steps.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStepIndex(0);
  };

  const handleTogglePlay = () => {
    if (!isPlaying && activeStepIndex >= activeCase.steps.length - 1) {
      setActiveStepIndex(0);
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-medium text-blue-700">
            生活案例实战沙盘 · 拒绝过时碎片教程
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            5 个真实生活场景，直接复用 GitHub 与 Hugging Face
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <GlossaryText text="选择你当下最想解决的生活痛点，逐步推演数据如何在开源工具与你的 Dify / Ollama / 智能体之间流转，并直接带走现成命令与指挥提示词。" />
          </p>
        </div>

        <div className="text-sm text-slate-600 tabular-nums shrink-0">
          实战掌握进度：
          <span className="font-bold text-slate-900 ml-1">
            {masteredCaseIds.length} / {LIFE_CASES.length} 个案例
          </span>
        </div>
      </section>

      {/* Case Selector Strip (Clean interactive tabs, zero candy pills) */}
      <nav aria-label="选择生活实战案例" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {LIFE_CASES.map((item) => {
          const isSelected = item.id === activeCase.id;
          const mastered = masteredCaseIds.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCase(item.id)}
              className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`font-mono tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.indexNumber}
                </span>
                {mastered && (
                  <span className={`inline-flex items-center gap-1 font-medium ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    已掌握
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold leading-snug">
                {item.title}
              </div>
              <div className={`text-xs truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {item.category} · {item.timeToBuild}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Two-Zone Interactive Workflow Sandbox */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Interactive Pipeline Visualizer (~65%) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
          {/* Case Context Header */}
          <div className="space-y-3 pb-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {activeCase.indexNumber} · {activeCase.openSourceSource} · {activeCase.privacyNote}
              </div>
              <button
                type="button"
                onClick={() => onToggleCaseMastered(activeCase.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isMastered
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isMastered ? '已标记为实战掌握（点击取消）' : '标记本案例已实战掌握'}</span>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeCase.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">生活痛点：</span>
              <GlossaryText text={activeCase.lifePainPoint} />
            </p>
          </div>

          {/* Interactive 4-Step Animated Signal Flow Stage */}
          <div className="blueprint-grid rounded-xl border border-slate-200 p-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                推演步骤 0{activeStepIndex + 1} / 0{activeCase.steps.length}：{currentStep.toolName}
              </span>

              {/* Step Playback Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeStepIndex === 0}
                  aria-label="上一步"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>上一步</span>
                </button>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  aria-label={isPlaying ? '暂停自动演示' : '自动演示流程'}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-700 text-white hover:bg-blue-800 cursor-pointer whitespace-nowrap"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>自动演示</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeStepIndex === activeCase.steps.length - 1}
                  aria-label="下一步"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <span>下一步</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="重置步骤"
                  className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Visual Flow Nodes Pipeline with Directional Connectors */}
            <div className="flex flex-col lg:flex-row items-stretch gap-2">
              {activeCase.steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;
                const isLast = idx === activeCase.steps.length - 1;

                return (
                  <div key={step.id} className="flex-1 flex flex-col lg:flex-row items-stretch gap-2">
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveStepIndex(idx);
                      }}
                      className={`flex-1 relative text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[128px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                        isActive
                          ? STEP_ACCENT_BORDER[step.accent]
                          : isPassed
                          ? 'bg-white border-emerald-300'
                          : 'bg-white/95 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-mono font-semibold tabular-nums ${isActive ? STEP_ACCENT_TEXT[step.accent] : 'text-slate-500'}`}>
                          步骤 0{step.stepNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isActive ? '当前环节' : isPassed ? '已完成' : '待流转'}
                        </span>
                      </div>

                      <div className="space-y-1 mt-3">
                        <div className="text-sm font-bold text-slate-900 leading-snug">
                          {step.toolName}
                        </div>
                        <div className="text-xs text-slate-500 leading-snug">
                          {step.sourceLabel}
                        </div>
                      </div>
                    </button>

                    {!isLast && (
                      <div
                        aria-hidden="true"
                        className="hidden lg:flex items-center justify-center shrink-0 w-4"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-colors ${
                            idx < activeStepIndex
                              ? 'text-emerald-600'
                              : idx === activeStepIndex
                              ? 'text-blue-700'
                              : 'text-slate-300'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live Input -> Output Transformation Preview for Active Step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">
                  这一步的输入样本
                </div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {currentStep.sampleInput}
                </p>
              </div>
              <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-1.5">
                <div className="text-xs font-semibold text-blue-700">
                  经过开源工具后的产出
                </div>
                <p className="text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                  {currentStep.sampleOutput}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Case Outcome Summary */}
          <div className="pt-2 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              <strong className="text-slate-900">最终生活收益：</strong>
              <GlossaryText text={activeCase.outcomeSummary} />
            </span>
          </div>
        </div>

        {/* Right Execution & Copyable Command Deck (~35%) */}
        <aside
          aria-label="当前步骤零代码实操指引"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            <div className="space-y-1.5 pb-4 border-b border-slate-100">
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                步骤 0{currentStep.stepNumber} · {currentStep.sourceLabel}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {currentStep.roleTitle}
              </h3>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900">
                这一步发生了什么（零代码视角）
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                <GlossaryText text={currentStep.whatHappens} />
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-900">
                  {currentStep.actionTitle}
                </h4>
                <CopyButton
                  text={currentStep.copyCommand}
                  label="复制"
                  ariaLabel={`复制步骤 ${currentStep.stepNumber} 实操命令`}
                />
              </div>
              <pre className="font-mono text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
                {currentStep.copyCommand}
              </pre>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-900">
                本案例用到的工具组合
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <GlossaryText text={activeCase.toolsUsed.join(' · ')} />
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <div className="text-xs font-semibold text-slate-900">
                零代码落地提醒
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <GlossaryText
                  text={`${activeCase.privacyNote}。预计 ${activeCase.timeToBuild}，如遇端口冲突或参数报错，直接把终端报错原文粘贴给 Antigravity / Hermes 即可自动修复。`}
                />
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {activeStepIndex < activeCase.steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>继续看下一步（0{activeStepIndex + 2}）</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleCaseMastered(activeCase.id)}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isMastered
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{isMastered ? '本案例已实战掌握' : '学完收工：标记为已掌握'}</span>
              </button>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
