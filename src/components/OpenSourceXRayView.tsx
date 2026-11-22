import { useMemo, useState } from 'react';
import { CheckCircle2, Cloud, EyeOff, SlidersHorizontal, Sparkles } from 'lucide-react';
import { GITHUB_XRAY_HOTSPOTS, HF_XRAY_HOTSPOTS } from '../data/learningData';
import type { QuantizationLevel, XRayHotspot, XRayImportance, XRayPlatform } from '../types/learning';
import { calculateModelFit } from '../utils/learningEngine';
import { CloudInfraComparePanel } from './CloudInfraComparePanel';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';

type SpotlightFilter = 'all' | 'essential' | 'skip';

function importanceStyle(importance: XRayImportance): string {
  if (importance === 'essential') return 'text-blue-700';
  if (importance === 'skip') return 'text-slate-500';
  return 'text-amber-700';
}

function hotspotButtonClasses(
  hotspot: XRayHotspot,
  isSelected: boolean,
  spotlight: SpotlightFilter
): string {
  const dimmed =
    (spotlight === 'essential' && hotspot.importance !== 'essential') ||
    (spotlight === 'skip' && hotspot.importance !== 'skip');

  const base =
    'w-full text-left rounded-lg border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  if (isSelected) {
    if (hotspot.importance === 'skip') {
      return `${base} bg-slate-100 border-slate-700 ring-2 ring-slate-200 opacity-100`;
    }
    return `${base} bg-blue-50/70 border-blue-600 ring-2 ring-blue-100 opacity-100`;
  }

  if (dimmed) {
    return `${base} bg-slate-50/60 border-slate-200 opacity-35 hover:opacity-80`;
  }

  if (hotspot.importance === 'skip') {
    return `${base} bg-slate-50 border-dashed border-slate-300 hover:border-slate-500`;
  }

  return `${base} bg-white border-slate-200 hover:border-blue-400`;
}

export function OpenSourceXRayView() {
  const [platform, setPlatform] = useState<XRayPlatform>('github');
  const [spotlight, setSpotlight] = useState<SpotlightFilter>('all');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('gh-docker');

  // Local Ollama Hardware & Quantization Simulator state
  const [memoryGb, setMemoryGb] = useState<number>(16);
  const [quant, setQuant] = useState<QuantizationLevel>('Q4_K_M');

  const hotspots = platform === 'github' ? GITHUB_XRAY_HOTSPOTS : HF_XRAY_HOTSPOTS;
  const activeHotspot =
    hotspots.find((h) => h.id === selectedHotspotId) ?? hotspots[0];

  const handlePlatformChange = (nextPlatform: XRayPlatform) => {
    setPlatform(nextPlatform);
    setSelectedHotspotId(nextPlatform === 'github' ? 'gh-docker' : 'hf-gguf');
  };

  const modelFits = useMemo(
    () => calculateModelFit(memoryGb, quant),
    [memoryGb, quant]
  );

  const byId = (id: string) => hotspots.find((h) => h.id === id)!;

  return (
    <div className="space-y-12">
      {/* Header & Platform Switcher */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2.5 max-w-2xl">
          <p className="text-sm font-medium text-blue-700">
            60 秒零代码开源页面 X 光透视
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            面对满屏英文与代码目录，只看这几个黄金入口
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            点击下方模拟开源页面里的任意标注区块，立刻分辨哪些是「免代码一键启动钥匙」，哪些底层源码你可以安心直接跳过。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start lg:self-auto shrink-0">
          <div
            role="tablist"
            aria-label="选择要解剖的开源平台"
            className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={platform === 'github'}
              onClick={() => handlePlatformChange('github')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                platform === 'github'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GitHub 开源项目页解剖
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platform === 'huggingface'}
              onClick={() => handlePlatformChange('huggingface')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                platform === 'huggingface'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hugging Face 模型与 Space 解剖
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('cloud-infra-compare');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>直达云基础设施对比</span>
          </button>
        </div>
      </section>

      {/* Two-Zone Interactive X-Ray Stage */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Interactive Facsimile Page (~65%) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {platform === 'github'
                ? '模拟示例：github.com / Stirling-Tools / Stirling-PDF'
                : '模拟示例：huggingface.co / bartowski / Qwen2.5-14B-Instruct-GGUF'}
            </div>

            <div
              role="group"
              aria-label="高亮筛选区域"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start"
            >
              {[
                { id: 'all', label: '全部区域' },
                { id: 'essential', label: '只看必看黄金区' },
                { id: 'skip', label: '查看直接跳过区' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={spotlight === item.id}
                  onClick={() => setSpotlight(item.id as SpotlightFilter)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    spotlight === item.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {platform === 'github' ? (
            /* Realistic Interactive GitHub Repository Anatomy */
            <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 sm:p-5 space-y-4">
              {/* Top Repo Header Bar (Hotspot 1) */}
              {(() => {
                const h1 = byId('gh-health');
                return (
                  <button
                    type="button"
                    aria-pressed={activeHotspot.id === h1.id}
                    onClick={() => setSelectedHotspotId(h1.id)}
                    className={`${hotspotButtonClasses(h1, activeHotspot.id === h1.id, spotlight)} p-3.5`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                          01
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900">
                          Stirling-Tools / Stirling-PDF
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums">
                        Stars 52.4k · Updated 2 days ago · 必看健康度
                      </div>
                    </div>
                  </button>
                );
              })()}

              {/* Main 2-Column GitHub Repo Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left 8 cols: File Tree + README */}
                <div className="md:col-span-8 space-y-4">
                  {/* File List Card Split into Skip Zone (src) + Golden Zone (docker-compose) */}
                  <div className="space-y-2.5">
                    {(() => {
                      const h6 = byId('gh-src');
                      return (
                        <button
                          type="button"
                          aria-pressed={activeHotspot.id === h6.id}
                          onClick={() => setSelectedHotspotId(h6.id)}
                          className={`${hotspotButtonClasses(h6, activeHotspot.id === h6.id, spotlight)} p-3`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 font-mono text-xs text-slate-600">
                              <span className="font-semibold text-slate-500 tabular-nums">06</span>
                              <span>src/ · app/ · scripts/ · build.gradle</span>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              零代码直接跳过
                            </span>
                          </div>
                        </button>
                      );
                    })()}

                    {(() => {
                      const h2 = byId('gh-docker');
                      return (
                        <button
                          type="button"
                          aria-pressed={activeHotspot.id === h2.id}
                          onClick={() => setSelectedHotspotId(h2.id)}
                          className={`${hotspotButtonClasses(h2, activeHotspot.id === h2.id, spotlight)} p-3.5`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 font-mono text-sm font-semibold text-slate-900">
                              <span className="text-xs text-blue-700 tabular-nums">02</span>
                              <span>docker-compose.yml</span>
                            </div>
                            <span className="text-xs font-medium text-emerald-700 whitespace-nowrap">
                              一键容器化金钥匙
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 pl-6">
                            有这个文件 = 无需懂任何编程语言，直接复用你的 Docker 部署流程
                          </p>
                        </button>
                      );
                    })()}
                  </div>

                  {/* README Block (Hotspot 3) */}
                  {(() => {
                    const h3 = byId('gh-readme');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h3.id}
                        onClick={() => setSelectedHotspotId(h3.id)}
                        className={`${hotspotButtonClasses(h3, activeHotspot.id === h3.id, spotlight)} p-4 space-y-2`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                              03
                            </span>
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              README.md — Quick Start & Docker Deploy
                            </span>
                          </div>
                          <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
                            唯一必读说明
                          </span>
                        </div>
                        <div className="pl-6 space-y-1.5 text-xs text-slate-600">
                          <p>本地托管的全能 PDF 工具箱：支持合并、拆分、OCR 识别、转图片与批处理。</p>
                          <div className="font-mono text-[11px] bg-slate-900 text-slate-100 rounded px-3 py-2">
                            docker run -d -p 8080:8080 frooodle/s-pdf:latest
                          </div>
                        </div>
                      </button>
                    );
                  })()}
                </div>

                {/* Right 4 cols: Releases (4) + License (5) */}
                <div className="md:col-span-4 space-y-3">
                  {(() => {
                    const h4 = byId('gh-releases');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h4.id}
                        onClick={() => setSelectedHotspotId(h4.id)}
                        className={`${hotspotButtonClasses(h4, activeHotspot.id === h4.id, spotlight)} p-3.5 space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                            04 · Releases
                          </span>
                          <span className="text-[11px] text-emerald-700 font-medium">免配置</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          Latest v0.36 · 桌面安装包
                        </div>
                        <p className="text-xs text-slate-500">
                          展开 Assets 下载 Mac (.dmg) 或 Windows (.exe) 成品程序
                        </p>
                      </button>
                    );
                  })()}

                  {(() => {
                    const h5 = byId('gh-license');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h5.id}
                        onClick={() => setSelectedHotspotId(h5.id)}
                        className={`${hotspotButtonClasses(h5, activeHotspot.id === h5.id, spotlight)} p-3.5 space-y-1`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-amber-700 tabular-nums">
                            05 · License
                          </span>
                          <span className="text-[11px] text-slate-500">顺手确认</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900">
                          MIT / Apache-2.0 协议
                        </div>
                        <p className="text-xs text-slate-500">
                          个人自用、学习及二次套壳改造均完全免费开放
                        </p>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Realistic Interactive Hugging Face Model & Space Anatomy */
            <div className="rounded-xl border border-slate-200 bg-[#F7F8FA] p-4 sm:p-5 space-y-4">
              {/* Top HF Navigation & Use this model row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {(() => {
                  const h1 = byId('hf-spaces');
                  return (
                    <button
                      type="button"
                      aria-pressed={activeHotspot.id === h1.id}
                      onClick={() => setSelectedHotspotId(h1.id)}
                      className={`sm:col-span-7 ${hotspotButtonClasses(h1, activeHotspot.id === h1.id, spotlight)} p-3.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                          01 · Spaces 在线空间频道
                        </span>
                        <span className="text-xs font-medium text-emerald-700">浏览器零安装</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        无需下载模型权重：直接打开现成 OCR、语音识别、文档解析网页体验工具
                      </p>
                    </button>
                  );
                })()}

                {(() => {
                  const h3 = byId('hf-use-model');
                  return (
                    <button
                      type="button"
                      aria-pressed={activeHotspot.id === h3.id}
                      onClick={() => setSelectedHotspotId(h3.id)}
                      className={`sm:col-span-5 ${hotspotButtonClasses(h3, activeHotspot.id === h3.id, spotlight)} p-3.5`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                          03 · Use this model
                        </span>
                        <span className="text-xs font-medium text-blue-700">直连 Ollama</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        点开直接选 Ollama，一键复制本地拉取命令
                      </p>
                    </button>
                  );
                })()}
              </div>

              {/* Middle Row: Model Card + GGUF Files */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 space-y-3">
                  {(() => {
                    const h4 = byId('hf-card');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h4.id}
                        onClick={() => setSelectedHotspotId(h4.id)}
                        className={`${hotspotButtonClasses(h4, activeHotspot.id === h4.id, spotlight)} p-4 space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                            04 · Model Card 参数与能力
                          </span>
                          <span className="text-xs font-mono text-slate-600">14B · Text</span>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          Qwen2.5-14B-Instruct-GGUF
                        </div>
                        <p className="text-xs text-slate-600">
                          看清参数规模（7B/14B/32B）与支持语言，决定本地跑还是切 OpenRouter
                        </p>
                      </button>
                    );
                  })()}

                  {(() => {
                    const h5 = byId('hf-gradio-api');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h5.id}
                        onClick={() => setSelectedHotspotId(h5.id)}
                        className={`${hotspotButtonClasses(h5, activeHotspot.id === h5.id, spotlight)} p-3.5 space-y-1`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-amber-700 tabular-nums">
                            05 · Space 底部 Use via API
                          </span>
                          <span className="text-xs text-amber-700">接入 Dify</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          点开获得标准 Gradio 接口说明，让任意 HF Space 变成你 Dify 工作流的插件
                        </p>
                      </button>
                    );
                  })()}
                </div>

                <div className="md:col-span-6 space-y-3">
                  {(() => {
                    const h2 = byId('hf-gguf');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h2.id}
                        onClick={() => setSelectedHotspotId(h2.id)}
                        className={`${hotspotButtonClasses(h2, activeHotspot.id === h2.id, spotlight)} p-4 space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                            02 · Files — .gguf 量化文件
                          </span>
                          <span className="text-xs font-medium text-emerald-700">核心金矿</span>
                        </div>
                        <div className="font-mono text-xs text-slate-800 space-y-1 bg-slate-50 border border-slate-200 rounded p-2.5 tabular-nums">
                          <div className="flex justify-between">
                            <span>Qwen2.5-14B-Q4_K_M.gguf</span>
                            <span className="text-emerald-700 font-semibold">8.99 GB</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Qwen2.5-14B-Q8_0.gguf</span>
                            <span>15.7 GB</span>
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {(() => {
                    const h6 = byId('hf-safetensors');
                    return (
                      <button
                        type="button"
                        aria-pressed={activeHotspot.id === h6.id}
                        onClick={() => setSelectedHotspotId(h6.id)}
                        className={`${hotspotButtonClasses(h6, activeHotspot.id === h6.id, spotlight)} p-3.5`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-slate-600 tabular-nums">
                            06 · model-00001-of-00008.safetensors
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            零代码直接跳过
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          未压缩原始权重（28GB+），给底层算法训练用，日常复用无需下载
                        </p>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Balanced 6-point quick index grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {hotspots.map((item) => {
              const active = item.id === activeHotspot.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedHotspotId(item.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors text-left truncate cursor-pointer tabular-nums ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  0{item.number}. {item.zoneLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Concept Explanation Deck (~35%) */}
        <aside
          aria-label="当前解剖区块解读"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2 text-xs font-medium">
                <span className="font-mono text-slate-500 tabular-nums">
                  解剖点 0{activeHotspot.number} / 0{hotspots.length}
                </span>
                <span className={`inline-flex items-center gap-1 font-semibold ${importanceStyle(activeHotspot.importance)}`}>
                  {activeHotspot.importance === 'skip' ? (
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {activeHotspot.importanceText}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                <GlossaryText text={activeHotspot.zoneLabel} tooltipOnly />
              </h2>
              <p className="text-sm font-medium text-blue-700">
                <GlossaryText text={activeHotspot.headline} />
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">生活化通俗理解</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <GlossaryText text={activeHotspot.plainMeaning} />
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">零代码复用判断法则</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <GlossaryText text={activeHotspot.zeroCodeRule} />
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">实操动作示例</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <GlossaryText text={activeHotspot.exampleAction} />
              </p>
            </div>

            {activeHotspot.copySnippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">
                    {activeHotspot.copyLabel ?? '可直接复制命令'}
                  </span>
                  <CopyButton
                    text={activeHotspot.copySnippet}
                    label="复制"
                    ariaLabel={`复制 ${activeHotspot.zoneLabel} 命令`}
                  />
                </div>
                <pre className="font-mono text-xs bg-slate-900 text-slate-100 rounded-lg p-3.5 overflow-x-auto whitespace-pre-wrap break-words">
                  {activeHotspot.copySnippet}
                </pre>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>记住原则：先找现成入口，代码交给智能体</span>
          </div>
        </aside>
      </section>

      {/* Interactive Simulator: Local Ollama vs OpenRouter Hardware Fit */}
      <section
        aria-label="本地 Ollama 显存与量化适配模拟器"
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-5 border-b border-slate-100">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hugging Face 选型实测实验室</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              本地 Ollama 显存与 GGUF 量化模拟器
            </h2>
            <p className="text-sm text-slate-600">
              <GlossaryText text="拖动你的电脑可用内存/显存大小并切换量化精度，立刻判断 Hugging Face 上的开源模型该拉进本地 Ollama 离线跑，还是直接走 OpenRouter 云端调用。" />
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 shrink-0">
            {/* Explicitly Labeled Memory Slider */}
            <div className="min-w-[230px] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="memory-slider" className="font-semibold text-slate-800">
                  电脑可用内存 / 显存
                </label>
                <span className="font-mono font-bold text-blue-700 tabular-nums">
                  {memoryGb} GB
                </span>
              </div>
              <input
                id="memory-slider"
                type="range"
                min={8}
                max={64}
                step={8}
                value={memoryGb}
                onChange={(e) => setMemoryGb(Number(e.target.value))}
                className="w-full accent-blue-700 cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[11px] text-slate-400 tabular-nums">
                <span>8 GB</span>
                <span>16 GB</span>
                <span>32 GB</span>
                <span>48 GB</span>
                <span>64 GB</span>
              </div>
            </div>

            {/* Quantization Segmented Control */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-800">
                GGUF 量化档位
              </span>
              <div
                role="group"
                aria-label="选择 GGUF 量化档位"
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                {(['Q4_K_M', 'Q8_0', 'FP16'] as QuantizationLevel[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    aria-pressed={quant === q}
                    onClick={() => setQuant(q)}
                    className={`px-3 py-1.5 font-mono text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      quant === q
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculated Model Compatibility Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {modelFits.map((fit) => {
            const statusColor =
              fit.fitStatus === 'smooth'
                ? 'text-emerald-700'
                : fit.fitStatus === 'tight'
                ? 'text-amber-700'
                : 'text-slate-600';
            const borderColor =
              fit.fitStatus === 'smooth'
                ? 'border-emerald-200 bg-emerald-50/30'
                : fit.fitStatus === 'tight'
                ? 'border-amber-200 bg-amber-50/30'
                : 'border-slate-200 bg-slate-50/50';
            const barWidth = Math.min(100, Math.round((fit.estimatedVramGb / memoryGb) * 100));
            const barColor =
              fit.fitStatus === 'smooth'
                ? 'bg-emerald-600'
                : fit.fitStatus === 'tight'
                ? 'bg-amber-600'
                : 'bg-slate-400';

            return (
              <div
                key={fit.paramLabel}
                className={`rounded-lg border p-4 flex flex-col justify-between space-y-3 ${borderColor}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {fit.paramLabel}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      约 {fit.estimatedVramGb} GB
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {fit.exampleModel}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className={`text-xs font-semibold flex items-center gap-1 ${statusColor}`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fit.statusText}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <GlossaryText text={fit.recommendation} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cloud Infrastructure Comparison Visual Panel */}
      <CloudInfraComparePanel />
    </div>
  );
}
