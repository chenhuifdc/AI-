import { useState } from 'react';
import { ArchitectureSandbox } from './ArchitectureSandbox';
import { EcosystemToolExplorer } from './EcosystemToolExplorer';
import { GlossaryText } from './GlossaryText';
import { OnlineToolExplainer } from './OnlineToolExplainer';
import { ScenarioToolFinder } from './ScenarioToolFinder';

export function ToolEcosystemView() {
  const [externalSearch, setExternalSearch] = useState<{
    term: string;
    nonce: number;
  } | null>(null);
  const [externalToolSelection, setExternalToolSelection] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  const handleLookupOnline = (toolName: string) => {
    setExternalSearch({ term: toolName, nonce: Date.now() });
    const target = document.getElementById('online-tool-explainer');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToEcosystemTool = (ecosystemToolId: string) => {
    setExternalToolSelection({ id: ecosystemToolId, nonce: Date.now() });
    const target = document.getElementById('ecosystem-tools');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12">
      {/* Editorial Intro Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-medium text-blue-700">
            零代码全栈认知与热门工具场景图鉴
          </p>
          <h1 className="text-2xl sm:text-[34px] font-bold tracking-tight text-slate-900 leading-snug">
            按生活场景秒配开源工具原理图，
            <br className="hidden sm:inline" />
            再亲手打通前端、后端与后台数据
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            <GlossaryText text="输入「整理文档」「监控股票」等真实生活场景，立刻推荐对应开源工具并呈现应用原理图；还可联网图解任意陌生工具，或在下方亲手体验 Frontend、Backend 与 Headless CMS 后台联动。" />
          </p>
        </div>

        {/* Section Quick Jump Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollToSection('scenario-tool-finder')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            01. 场景搜工具原理图
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('online-tool-explainer')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            02. 联网搜工具图解
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ecosystem-tools')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            03. 九大工具场景图谱
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('architecture-sandbox')}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            04. 前后端与后台沙盘
          </button>
        </div>
      </section>

      {/* 01. Interactive Life-Scenario Search & Open-Source Principle Schematic */}
      <ScenarioToolFinder
        onJumpToEcosystemTool={handleJumpToEcosystemTool}
        onLookupOnline={handleLookupOnline}
      />

      {/* 02. Live Grounded Online Tool Explainer */}
      <OnlineToolExplainer externalQuery={externalSearch} />

      {/* 03. 9 Popular Tools Visual Scenario Lab */}
      <EcosystemToolExplorer
        onLookupOnline={handleLookupOnline}
        externalToolSelection={externalToolSelection}
      />

      {/* 04. Frontend / Backend / Admin Data Website Live Sandbox */}
      <ArchitectureSandbox />
    </div>
  );
}
