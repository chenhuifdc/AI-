import { useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Database,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  Server,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ADMIN_SANDBOX_PRESETS,
  ARCHITECTURE_LAYERS,
} from '../data/ecosystemData';
import type {
  AdminSandboxData,
  AdminSyncTrace,
  ArchitectureLayerId,
} from '../types/learning';
import { applyAdminDataUpdate } from '../utils/toolExplainer';
import { GlossaryText } from './GlossaryText';

const THEME_CLASSES: Record<
  AdminSandboxData['accentTheme'],
  { headerBg: string; bannerBg: string; priceText: string; buttonBg: string; label: string }
> = {
  blue: {
    headerBg: 'bg-blue-700 text-white',
    bannerBg: 'bg-blue-50 text-blue-900 border-blue-200',
    priceText: 'text-blue-700',
    buttonBg: 'bg-blue-700 text-white',
    label: '专业科技蓝',
  },
  emerald: {
    headerBg: 'bg-emerald-700 text-white',
    bannerBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    priceText: 'text-emerald-700',
    buttonBg: 'bg-emerald-700 text-white',
    label: '自然森系绿',
  },
  amber: {
    headerBg: 'bg-amber-700 text-white',
    bannerBg: 'bg-amber-50 text-amber-950 border-amber-200',
    priceText: 'text-amber-800',
    buttonBg: 'bg-amber-700 text-white',
    label: '暖调烘焙琥珀',
  },
};

function formatNowTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export function ArchitectureSandbox() {
  const [selectedLayerId, setSelectedLayerId] = useState<ArchitectureLayerId>('admin-cms');
  const [presetId, setPresetId] = useState<string>(ADMIN_SANDBOX_PRESETS[0].id);
  const [publishedData, setPublishedData] = useState<AdminSandboxData>(
    ADMIN_SANDBOX_PRESETS[0].data
  );
  const [draftData, setDraftData] = useState<AdminSandboxData>(ADMIN_SANDBOX_PRESETS[0].data);
  const [syncCount, setSyncCount] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showJsonInspector, setShowJsonInspector] = useState<boolean>(true);
  const [lastTrace, setLastTrace] = useState<AdminSyncTrace>(() => {
    const initial = applyAdminDataUpdate(
      ADMIN_SANDBOX_PRESETS[0].data,
      ADMIN_SANDBOX_PRESETS[0].data,
      1,
      '已初始化'
    );
    return initial.trace!;
  });

  const activeLayer =
    ARCHITECTURE_LAYERS.find((layer) => layer.id === selectedLayerId) ?? ARCHITECTURE_LAYERS[0];

  const handleSelectPreset = (nextPresetId: string) => {
    const preset =
      ADMIN_SANDBOX_PRESETS.find((p) => p.id === nextPresetId) ?? ADMIN_SANDBOX_PRESETS[0];
    setPresetId(preset.id);
    setPublishedData(preset.data);
    setDraftData(preset.data);
    setErrorMsg(null);
    const nextId = syncCount + 1;
    setSyncCount(nextId);
    const res = applyAdminDataUpdate(preset.data, preset.data, nextId, formatNowTime());
    if (res.trace) setLastTrace(res.trace);
  };

  const handlePublishToFrontend = () => {
    const nextId = syncCount + 1;
    const outcome = applyAdminDataUpdate(publishedData, draftData, nextId, formatNowTime());
    if (!outcome.valid) {
      setErrorMsg(outcome.error ?? '请检查输入项后重试');
      return;
    }
    setErrorMsg(null);
    setPublishedData(outcome.nextState);
    setDraftData(outcome.nextState);
    setSyncCount(nextId);
    if (outcome.trace) {
      setLastTrace(outcome.trace);
    }
  };

  const handleResetCurrentPreset = () => {
    handleSelectPreset(presetId);
  };

  const updateDraftItem = (
    itemId: string,
    patch: Partial<AdminSandboxData['items'][number]>
  ) => {
    setDraftData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  };

  const hasUnsavedChanges = JSON.stringify(draftData) !== JSON.stringify(publishedData);
  const previewTheme = THEME_CLASSES[publishedData.accentTheme];

  return (
    <section
      id="architecture-sandbox"
      aria-label="前端、后端与后台数据网站可视化实验室"
      className="scroll-mt-24 space-y-6"
    >
      {/* Section Header */}
      <div className="space-y-1.5 max-w-3xl">
        <p className="text-xs font-medium text-blue-700">
          04. 一次搞懂三个最常听混的核心概念
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          什么是前端、后端？什么是“后台数据网站”并实时更改前端数据？
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          <GlossaryText text="很多零代码新手疑惑“网站上线后，改个商品价格或公告是不是要重新改代码？”。答案是否定的——下面先看三层分工，再亲手在左侧后台改数据，观察右侧前端如何自动同步。" />
        </p>
      </div>

      {/* Part A: Interactive 3-Layer Concept Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ARCHITECTURE_LAYERS.map((layer, index) => {
            const isSelected = layer.id === activeLayer.id;
            const Icon =
              layer.id === 'frontend'
                ? MonitorSmartphone
                : layer.id === 'backend'
                ? Server
                : Database;

            return (
              <button
                key={layer.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`text-left p-4 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-blue-700">0{index + 1} 层</span>
                  <Icon className="w-4 h-4 text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-base font-bold text-slate-900">{layer.title}</div>
                <div className="text-xs text-slate-600 mt-1">{layer.enName}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Layer Detailed Explanation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t border-slate-100">
          <div className="lg:col-span-7 space-y-3">
            <div className="text-sm font-semibold text-slate-900">
              生活类比：{activeLayer.lifeAnalogy}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <GlossaryText text={activeLayer.plainSummary} />
            </p>
            <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
              <span className="font-semibold text-slate-900">身边的例子：</span>
              {activeLayer.concreteExample}
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
            <div>
              <span className="font-semibold text-slate-800">谁来操作：</span>
              <span className="text-slate-600">{activeLayer.whoUsesIt}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">常见代表工具：</span>
              <span className="text-slate-600">{activeLayer.typicalTools}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">改内容要不要重发代码：</span>
              <span className="text-slate-700 font-medium">{activeLayer.needsRedeploy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Part B: Live Interactive Admin CMS -> Backend API -> Frontend Storefront Sandbox */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              动手实验：在「后台数据网站」改数据，看「前端界面」如何免代码同步
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              试着修改左侧的标题、价格或商品上下架状态，点击「保存并同步到前端」，观察中间接口数据流与右侧手机画面的变化
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {ADMIN_SANDBOX_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    presetId === preset.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleResetCurrentPreset}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>重置数据</span>
            </button>
          </div>
        </div>

        {/* Visual Data Flow Bridge SVG */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-blue-700" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900">1. 后台数据网站（老板改表）</div>
                <div className="text-xs text-slate-500 truncate">
                  写入配置与商品 CRUD 数据
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4 text-indigo-700" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900">2. 后端 API & 数据库（中转存储）</div>
                <div className="text-xs text-indigo-700 font-mono truncate">
                  {lastTrace.endpoint}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <MonitorSmartphone className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900">3. 前端界面（顾客秒见新画面）</div>
                <div className="text-xs text-emerald-700 truncate tabular-nums">
                  已同步版本 #{lastTrace.syncId} · {lastTrace.timestamp}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Zone Interactive Sandbox: Left Admin Panel vs Right Live Frontend Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Admin Data Website (Editable) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                后台数据网站（仅管理员可见 · 例如 Directus / Strapi / 飞书后台）
              </div>
              <span className="text-xs text-slate-500">
                {hasUnsavedChanges ? '有未同步修改' : '与前端完全一致'}
              </span>
            </div>

            <div className="space-y-4 bg-slate-50/70 border border-slate-200 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label
                    htmlFor="admin-site-title"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    网站 / 门店名称
                  </label>
                  <input
                    id="admin-site-title"
                    type="text"
                    value={draftData.siteTitle}
                    onChange={(e) => {
                      setDraftData((prev) => ({ ...prev, siteTitle: e.target.value }));
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-700">
                    前端品牌主色
                  </span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {(['blue', 'emerald', 'amber'] as const).map((themeKey) => (
                      <button
                        key={themeKey}
                        type="button"
                        aria-pressed={draftData.accentTheme === themeKey}
                        onClick={() =>
                          setDraftData((prev) => ({ ...prev, accentTheme: themeKey }))
                        }
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                          draftData.accentTheme === themeKey
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {THEME_CLASSES[themeKey].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-announcement"
                    className="text-xs font-semibold text-slate-700"
                  >
                    顶部活动公告文案
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftData.promoEnabled}
                      onChange={(e) =>
                        setDraftData((prev) => ({ ...prev, promoEnabled: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span>在前端显示公告栏</span>
                  </label>
                </div>
                <input
                  id="admin-announcement"
                  type="text"
                  value={draftData.announcement}
                  onChange={(e) =>
                    setDraftData((prev) => ({ ...prev, announcement: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Editable Item Table (Database Rows) */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  数据库条目表（改价格或上下架状态，立刻影响前端）
                </div>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden">
                  {draftData.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <label htmlFor={`item-name-${item.id}`} className="sr-only">
                          条目名称
                        </label>
                        <input
                          id={`item-name-${item.id}`}
                          type="text"
                          value={item.name}
                          onChange={(e) => updateDraftItem(item.id, { name: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <label
                            htmlFor={`item-price-${item.id}`}
                            className="text-xs text-slate-500"
                          >
                            ¥
                          </label>
                          <input
                            id={`item-price-${item.id}`}
                            type="number"
                            min={0}
                            max={99999}
                            value={item.price}
                            onChange={(e) =>
                              updateDraftItem(item.id, {
                                price: Number(e.target.value) || 0,
                              })
                            }
                            className="w-20 px-2 py-1.5 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => updateDraftItem(item.id, { inStock: !item.inStock })}
                          aria-label={`切换 ${item.name} 上架状态`}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            item.inStock
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {item.inStock ? '在售上架' : '已设售罄'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-rose-700">
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePublishToFrontend}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>保存并同步到前端</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowJsonInspector((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{showJsonInspector ? '收起后端 JSON 数据包' : '查看后端 JSON 数据包'}</span>
                </button>
              </div>
            </div>

            {/* Live Sync Log & Backend JSON Inspector */}
            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-emerald-400 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>最近一次同步轨迹（第 {lastTrace.syncId} 次）</span>
                </span>
                <span className="text-slate-400 font-mono tabular-nums">{lastTrace.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lastTrace.frontendEffect}
              </p>
              {showJsonInspector && (
                <pre className="text-[11px] leading-relaxed font-mono text-sky-200 bg-slate-950/70 border border-slate-800 rounded-md p-3 overflow-x-auto max-h-52">
                  {lastTrace.payloadJson}
                </pre>
              )}
            </div>
          </div>

          {/* RIGHT: Live Customer Frontend Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">
                前端应用界面（顾客手机看到的实时画面）
              </div>
              <span className="text-xs text-emerald-700 font-medium tabular-nums">
                实时版本 #{lastTrace.syncId}
              </span>
            </div>

            <div
              data-testid="frontend-live-preview"
              className="border border-slate-300 rounded-2xl bg-white overflow-hidden shadow-xs"
            >
              {/* Simulated Mobile Browser Header */}
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>https://app.example.com</span>
                <span>GET /api/public/storefront</span>
              </div>

              {/* Dynamic Storefront Header */}
              <div className={`px-5 py-4 transition-colors ${previewTheme.headerBg}`}>
                <div className="text-[11px] opacity-80">顾客端实时渲染视图</div>
                <h4 className="text-lg font-bold mt-0.5">{publishedData.siteTitle}</h4>
              </div>

              {/* Dynamic Announcement Bar */}
              {publishedData.promoEnabled && publishedData.announcement && (
                <div
                  className={`px-5 py-2.5 text-xs font-medium border-b ${previewTheme.bannerBg}`}
                >
                  公告：{publishedData.announcement}
                </div>
              )}

              {/* Dynamic Product/Course Cards */}
              <div className="p-4 space-y-3">
                {publishedData.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      item.inStock
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50 opacity-75'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.tag} · {item.inStock ? '现货可下单' : '暂时售罄'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-base font-bold font-mono tabular-nums ${
                          item.inStock ? previewTheme.priceText : 'text-slate-400 line-through'
                        }`}
                      >
                        ¥{item.price}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                          item.inStock
                            ? previewTheme.buttonBg
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.inStock ? '立即选购' : '已售罄'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                前端代码一行未改——画面内容完全由后端数据库 JSON 动态驱动
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
