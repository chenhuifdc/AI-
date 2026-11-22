import { useEffect, useState } from 'react';
import { ArrowRight, Compass, X } from 'lucide-react';
import type {
  HardwareTier,
  PrivacyPreference,
  ReuseDiagnosisResult,
  TaskDomain,
} from '../types/learning';
import { diagnoseReusePath } from '../utils/learningEngine';
import { CopyButton } from './CopyButton';

interface DecisionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToCase: (caseId: string) => void;
}

const DOMAIN_OPTIONS: Array<{ id: TaskDomain; label: string; desc: string }> = [
  { id: 'docs', label: '文档与知识整理', desc: 'PDF 发票、体检单、合同与个人资料库' },
  { id: 'media', label: '音视频与图像处理', desc: '播客双语字幕、语音转文字、抠图识字' },
  { id: 'web', label: '网页信息抓取与调研', desc: '批量读网页、去广告对比、自动周报' },
  { id: 'custom-app', label: '专属小工具界面定制', desc: '把命令行开源神器包装成顺手网页应用' },
];

const PRIVACY_OPTIONS: Array<{ id: PrivacyPreference; label: string; desc: string }> = [
  { id: 'local-only', label: '完全本地离线', desc: '敏感隐私数据不出电脑，优先 Docker + Ollama' },
  { id: 'cloud-fast', label: '允许云端处理', desc: '追求最快验证与最强理解，优先 HF Space + OpenRouter' },
];

const HARDWARE_OPTIONS: Array<{ id: HardwareTier; label: string; desc: string }> = [
  { id: 'laptop-16', label: '轻薄本 / 8–16GB 内存', desc: '适合轻量容器与 7B–8B 本地模型' },
  { id: 'workstation-32', label: '高配机 / 24–64GB 内存或独显', desc: '可流畅跑 14B–32B 开源量化模型' },
];

export function DecisionWizardModal({
  isOpen,
  onClose,
  onJumpToCase,
}: DecisionWizardModalProps) {
  const [domain, setDomain] = useState<TaskDomain>('docs');
  const [privacy, setPrivacy] = useState<PrivacyPreference>('local-only');
  const [hardware, setHardware] = useState<HardwareTier>('laptop-16');
  const [result, setResult] = useState<ReuseDiagnosisResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDiagnose = () => {
    setResult(diagnoseReusePath({ domain, privacy, hardware }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-blue-700 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="wizard-modal-title" className="text-lg font-bold text-slate-900">
                30 秒开源复用路径诊断
              </h2>
              <p className="text-xs text-slate-500">
                结合你的现有工具链，直接给出最省事的 GitHub / Hugging Face 零代码落地方案
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭诊断窗口"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Question 1 */}
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-slate-900">
              1. 你这次想解决哪类生活或工作问题？
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DOMAIN_OPTIONS.map((opt) => {
                const selected = domain === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setDomain(opt.id);
                      setResult(null);
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/70 border-blue-600 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Question 2 */}
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-slate-900">
              2. 这份数据的隐私敏感度如何？
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRIVACY_OPTIONS.map((opt) => {
                const selected = privacy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setPrivacy(opt.id);
                      setResult(null);
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/70 border-blue-600 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Question 3 */}
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-semibold text-slate-900">
              3. 你手头常用电脑的内存 / 显存档位？
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HARDWARE_OPTIONS.map((opt) => {
                const selected = hardware === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setHardware(opt.id);
                      setResult(null);
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-blue-50/70 border-blue-600 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-semibold">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDiagnose}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              生成复用方案
            </button>
          </div>

          {/* Diagnostic Result Panel */}
          {result && (
            <div
              aria-live="polite"
              className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-5 space-y-4"
            >
              <div className="space-y-1">
                <div className="text-xs font-medium text-blue-700">
                  推荐方案 · {result.platformSource} · {result.computeRoute}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {result.strategyTitle}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {result.rationale}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">第一步立刻做：</span>
                {result.firstStep}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    可直接发给 Antigravity / Hermes 的起手指挥词
                  </span>
                  <CopyButton
                    text={result.agentPrompt}
                    label="复制提示词"
                    ariaLabel="复制诊断生成的智能体指挥提示词"
                  />
                </div>
                <pre className="font-mono text-xs bg-slate-900 text-slate-100 rounded-lg p-3.5 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                  {result.agentPrompt}
                </pre>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  已为你匹配实战沙盘：{result.recommendedCaseTitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToCase(result.recommendedCaseId);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>查看匹配的生活实战案例</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
