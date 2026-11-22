import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Layers,
} from 'lucide-react';
import { CLOUD_PROJECT_PROFILES } from '../data/cloudInfraData';
import type {
  CloudDimensionFocus,
  CloudPlatformId,
  CloudProjectProfileId,
} from '../types/learning';
import { evaluateCloudPlatforms } from '../utils/cloudInfraRecommender';
import { GlossaryText } from './GlossaryText';

const DIMENSION_TABS: Array<{ id: CloudDimensionFocus; label: string }> = [
  { id: 'all', label: '全部维度对比' },
  { id: 'deploy', label: '看部署方式' },
  { id: 'quota', label: '看免费额度' },
  { id: 'scenarios', label: '看适用与避坑' },
];

export function CloudInfraComparePanel() {
  const [profileId, setProfileId] =
    useState<CloudProjectProfileId>('fullstack-backend');
  const [selectedPlatformId, setSelectedPlatformId] =
    useState<CloudPlatformId>('render');
  const [dimensionFocus, setDimensionFocus] =
    useState<CloudDimensionFocus>('all');

  const activeProfile =
    CLOUD_PROJECT_PROFILES.find((p) => p.id === profileId) ??
    CLOUD_PROJECT_PROFILES[0];

  const recommendations = useMemo(
    () => evaluateCloudPlatforms(profileId),
    [profileId]
  );

  // Sync highlighted inspector card to top recommendation when project profile changes
  useEffect(() => {
    if (recommendations.length > 0) {
      setSelectedPlatformId(recommendations[0].spec.id);
    }
  }, [profileId, recommendations]);

  const activeRecommendation =
    recommendations.find((r) => r.spec.id === selectedPlatformId) ??
    recommendations[0];

  return (
    <section
      id="cloud-infra-compare"
      aria-label="云基础设施对比可视化面板"
      className="scroll-mt-24 bg-white border border-slate-200 rounded-xl p-5 sm:p-7 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
            <span>项目公网部署选型实验室</span>
          </div>
          <h2
            data-glossary-ignore="true"
            className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
          >
            云基础设施对比：Vercel、Render、Cloudflare Pages 怎么选？
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            <GlossaryText text="把代码推送到 GitHub 只是第一步，选对托管环境才能避免 404 或 API Key 泄露。点选下方你的项目类型，直观对比各平台的部署方式、免费额度与适用场景。" />
          </p>
        </div>

        {/* Comparison Dimension Focus Filter */}
        <div
          role="group"
          aria-label="筛选云平台对比维度"
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto shrink-0"
        >
          {DIMENSION_TABS.map((tab) => {
            const isSelected = dimensionFocus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setDimensionFocus(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 1: Project Archetype Selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-sm font-semibold text-slate-900">
            第 1 步：选一下你的项目属于哪一类？
          </h3>
          <span className="text-xs text-slate-500">
            关键诉求：{activeProfile.keyRequirement}
          </span>
        </div>

        <div
          role="group"
          aria-label="选择你的项目类型"
          data-glossary-ignore="true"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {CLOUD_PROJECT_PROFILES.map((profile) => {
            const isSelected = profile.id === profileId;
            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setProfileId(profile.id)}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/65 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50/40 hover:border-blue-300'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">
                  {profile.label}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {profile.shortDesc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: 4-Platform Interactive Visual Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            第 2 步：已根据「{activeProfile.label}」自动排序，点击任意平台查看部署流程图与免费额度细节
          </span>
        </div>

        <div
          data-testid="cloud-platform-cards"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {recommendations.map((rec) => {
            const isSelected = rec.spec.id === activeRecommendation.spec.id;
            const statusClasses =
              rec.tier === 'primary'
                ? 'text-emerald-700'
                : rec.tier === 'secondary'
                ? 'text-blue-700'
                : 'text-amber-700';
            const cardBorder = isSelected
              ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
              : rec.tier === 'primary'
              ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500'
              : 'border-slate-200 bg-white hover:border-slate-300';

            return (
              <button
                key={rec.spec.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedPlatformId(rec.spec.id)}
                className={`text-left rounded-xl border p-4 flex flex-col justify-between space-y-4 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${cardBorder}`}
              >
                <div className="space-y-2.5">
                  {/* Dual-Coded Recommendation Tier Status */}
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className={`inline-flex items-center gap-1 ${statusClasses}`}>
                      {rec.tier === 'primary' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : rec.tier === 'secondary' ? (
                        <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>{rec.tierLabel}</span>
                    </span>
                    {isSelected && (
                      <span className="text-[11px] text-blue-700 font-medium">
                        当前查看
                      </span>
                    )}
                  </div>

                  <div>
                    <div
                      data-glossary-ignore="true"
                      className="text-lg font-bold text-slate-900"
                    >
                      {rec.spec.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {rec.spec.cnRole}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {rec.fitReason}
                  </p>
                </div>

                {/* Visual Capability Comparison Bars */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  {rec.spec.capabilityBars.map((bar) => (
                    <div key={bar.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-600 truncate">{bar.label}</span>
                        <span className="font-mono font-medium text-slate-800 whitespace-nowrap tabular-nums">
                          {bar.levelLabel}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            bar.percent >= 85
                              ? 'bg-emerald-600'
                              : bar.percent >= 55
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${bar.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Focused Platform Visual Deployment Pipeline & Quota Inspector */}
      <div
        data-testid="cloud-platform-inspector"
        className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              当前聚焦平台 · {activeRecommendation.spec.cnRole}
            </div>
            <h3
              data-glossary-ignore="true"
              className="text-lg font-bold text-slate-900"
            >
              {activeRecommendation.spec.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeRecommendation.spec.tagline}
            </p>
          </div>
          <span className="text-xs font-medium text-blue-700 sm:whitespace-nowrap shrink-0">
            {activeRecommendation.spec.freeQuotaHeadline}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: 3-Step Visual Deployment Flow */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            <div className="text-xs font-semibold text-slate-900">
              部署方式与上线流水线（3 步到公网）
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {activeRecommendation.spec.deployPipelineSteps.map((step, idx) => (
                <div
                  key={step}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-1"
                >
                  <div className="font-mono text-[11px] font-semibold text-blue-700 tabular-nums">
                    STEP 0{idx + 1}
                  </div>
                  <div className="text-xs font-medium text-slate-800 leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              {activeRecommendation.spec.deployMethods.map((method) => (
                <li key={method} className="flex items-start gap-2">
                  <span className="text-blue-700 font-semibold mt-0.5" aria-hidden="true">
                    ·
                  </span>
                  <span>{method}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Free Quota + Best Scenarios + Caveat */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-4 space-y-3.5">
            <div className="text-xs font-semibold text-slate-900">
              免费额度核对与避坑提醒
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <dt className="text-slate-500">月流量 / 带宽</dt>
                <dd className="font-medium text-slate-900">
                  {activeRecommendation.spec.bandwidthQuota}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-slate-500">计算与构建额度</dt>
                <dd className="font-medium text-slate-900">
                  {activeRecommendation.spec.computeQuota}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-slate-500">后端与环境变量</dt>
                <dd className="font-medium text-slate-900">
                  {activeRecommendation.spec.backendSupport}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-slate-500">休眠 / 冷启动机制</dt>
                <dd className="font-medium text-slate-900">
                  {activeRecommendation.spec.sleepBehavior}
                </dd>
              </div>
            </dl>

            <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="text-emerald-800">
                <span className="font-semibold">最适合：</span>
                {activeRecommendation.spec.bestScenarios.join('；')}
              </div>
              <div className="text-amber-800">
                <span className="font-semibold">避坑提示：</span>
                {activeRecommendation.spec.avoidWhen}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Full Side-by-Side Structured Comparison Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            主流云托管平台参数横向对照表
          </h3>
          <span className="text-xs text-slate-500">
            免费额度以各平台官方公开标准档为参考，零代码个人学习均可免绑卡或零成本起步
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">平台</th>
                {(dimensionFocus === 'all' || dimensionFocus === 'deploy') && (
                  <th className="py-3 px-4">部署方式</th>
                )}
                {(dimensionFocus === 'all' || dimensionFocus === 'quota') && (
                  <>
                    <th className="py-3 px-4">免费带宽与计算额度</th>
                    <th className="py-3 px-4">后端 / 休眠机制</th>
                  </>
                )}
                {(dimensionFocus === 'all' || dimensionFocus === 'scenarios') && (
                  <>
                    <th className="py-3 px-4">最适用场景</th>
                    <th className="py-3 px-4">什么时候不选它</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recommendations.map((rec) => {
                const isPrimary = rec.tier === 'primary';
                return (
                  <tr
                    key={rec.spec.id}
                    className={
                      isPrimary
                        ? 'bg-emerald-50/35 hover:bg-emerald-50/60 transition-colors'
                        : 'hover:bg-slate-50/70 transition-colors'
                    }
                  >
                    <td
                      data-glossary-ignore="true"
                      className="py-3.5 px-4 align-top whitespace-nowrap"
                    >
                      <div className="font-semibold text-slate-900">
                        {rec.spec.name}
                      </div>
                      <div
                        className={`text-[11px] font-medium mt-0.5 ${
                          rec.tier === 'primary'
                            ? 'text-emerald-700'
                            : rec.tier === 'secondary'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {rec.tierLabel}
                      </div>
                    </td>

                    {(dimensionFocus === 'all' || dimensionFocus === 'deploy') && (
                      <td className="py-3.5 px-4 align-top text-slate-700 leading-relaxed min-w-[200px]">
                        {rec.spec.deployMethods[0]}
                        <div className="text-[11px] text-slate-500 mt-1">
                          {rec.spec.customDomainHttps}
                        </div>
                      </td>
                    )}

                    {(dimensionFocus === 'all' || dimensionFocus === 'quota') && (
                      <>
                        <td className="py-3.5 px-4 align-top text-slate-700 leading-relaxed min-w-[210px] tabular-nums">
                          <div className="font-medium text-slate-900">
                            {rec.spec.bandwidthQuota}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {rec.spec.computeQuota}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top text-slate-600 leading-relaxed min-w-[210px]">
                          <div>{rec.spec.backendSupport}</div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {rec.spec.sleepBehavior}
                          </div>
                        </td>
                      </>
                    )}

                    {(dimensionFocus === 'all' || dimensionFocus === 'scenarios') && (
                      <>
                        <td className="py-3.5 px-4 align-top text-slate-700 leading-relaxed min-w-[210px]">
                          {rec.spec.bestScenarios.slice(0, 2).join('；')}
                        </td>
                        <td className="py-3.5 px-4 align-top text-slate-600 leading-relaxed min-w-[200px]">
                          {rec.spec.avoidWhen}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
