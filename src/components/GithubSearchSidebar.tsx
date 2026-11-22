import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  ExternalLink,
  PanelLeftClose,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import type {
  GithubRepoSuggestion,
  GithubSearchResponse,
  ToolNote,
  ToolNoteDraft,
} from '../types/learning';
import {
  formatStarCount,
  isSafeGithubUrl,
  validateScenarioQuery,
} from '../utils/githubSearch';
import { CopyButton } from './CopyButton';
import { GlossaryText } from './GlossaryText';
import { SimilarToolsPanel } from './SimilarToolsPanel';

const PRESET_SCENARIOS = [
  'PDF自动总结',
  '自动化爬虫',
  '视频双语字幕',
  '本地语音转文字',
];

interface GithubSearchSidebarProps {
  savedToolNames: string[];
  latestCompletedTool: ToolNote | null;
  onSaveToToolbox: (draft: ToolNoteDraft) => void;
  onGoToToolbox?: () => void;
  onCollapseDesktop?: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export function GithubSearchSidebar({
  savedToolNames,
  latestCompletedTool,
  onSaveToToolbox,
  onGoToToolbox,
  onCollapseDesktop,
  onCloseMobile,
  isMobileDrawer = false,
}: GithubSearchSidebarProps) {
  const [queryInput, setQueryInput] = useState<string>('');
  const [dockerOnly, setDockerOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [result, setResult] = useState<GithubSearchResponse | null>(null);
  const [lastSearchedScenario, setLastSearchedScenario] = useState<string>('');

  const executeSearch = async (rawScenario: string, preferDocker: boolean) => {
    const check = validateScenarioQuery(rawScenario);
    if (!check.valid) {
      setValidationError(check.error ?? '请输入具体的生活或工作场景。');
      return;
    }

    setValidationError(null);
    setRequestError(null);
    setLoading(true);
    setLastSearchedScenario(check.cleaned);

    try {
      const response = await fetch('/api/github-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: check.cleaned,
          dockerOnly: preferDocker,
        }),
      });

      const data = (await response.json()) as GithubSearchResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || '检索失败，请稍后重试。');
      }

      setResult(data);
    } catch (err) {
      setRequestError(
        err instanceof Error ? err.message : '检索 GitHub 开源项目失败，请稍后重试。'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void executeSearch(queryInput, dockerOnly);
  };

  const handlePresetClick = (preset: string) => {
    setQueryInput(preset);
    setValidationError(null);
    void executeSearch(preset, dockerOnly);
  };

  const isRepoSaved = (repo: GithubRepoSuggestion) => {
    const lowerSet = new Set(savedToolNames.map((n) => n.toLowerCase()));
    return lowerSet.has(repo.fullName.toLowerCase()) || lowerSet.has(repo.name.toLowerCase());
  };

  return (
    <aside
      aria-label="GitHub 开源项目场景检索侧边栏"
      className="h-full flex flex-col bg-white text-slate-900"
    >
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">GitHub 场景检索</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            输入生活痛点，直查热门开源工具
          </p>
        </div>

        {isMobileDrawer && onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="关闭搜索侧边栏"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : onCollapseDesktop ? (
          <button
            type="button"
            onClick={onCollapseDesktop}
            aria-label="收起侧边栏"
            title="收起侧边栏"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Search Form Area */}
      <div className="p-5 border-b border-slate-200 space-y-3.5 shrink-0 bg-[#F7F8FA]/60">
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor={isMobileDrawer ? 'mobile-github-scenario-input' : 'github-scenario-input'}
              className="block text-xs font-semibold text-slate-800"
            >
              你想解决什么生活或工作场景？
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={isMobileDrawer ? 'mobile-github-scenario-input' : 'github-scenario-input'}
                type="text"
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="如：PDF自动总结、自动化爬虫..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dockerOnly}
                onChange={(e) => setDockerOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-700 accent-blue-700 cursor-pointer"
              />
              <span>优先支持 Docker 部署</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? '检索中...' : '检索项目'}
            </button>
          </div>

          {validationError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {validationError}
            </p>
          )}
        </form>

        {/* Quick Life Scenario Buttons */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-slate-500">常见场景一键检索</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={loading}
                onClick={() => handlePresetClick(preset)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 rounded-md transition-colors text-left truncate cursor-pointer disabled:opacity-60"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Scroll Container */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        aria-live="polite"
        aria-busy={loading}
      >
        {loading && (
          <div className="space-y-4" data-testid="github-search-loading">
            <div className="text-xs text-slate-500">
              正在实时检索 GitHub 热门项目并匹配零代码复用建议...
            </div>
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="py-3 border-b border-slate-100 space-y-2 animate-pulse"
              >
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {!loading && requestError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50/70 p-4 space-y-3"
          >
            <div className="flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{requestError}</span>
            </div>
            <button
              type="button"
              onClick={() => void executeSearch(lastSearchedScenario || queryInput, dockerOnly)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-800 bg-white border border-red-300 hover:bg-red-50 rounded-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>重新检索</span>
            </button>
          </div>
        )}

        {!loading && !requestError && !result && (
          <div className="py-1 space-y-1.5 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-900">
              用日常中文，直查可复用的 GitHub 成品
            </p>
            <p className="text-slate-500">
              输入生活痛点即可检索高星活跃仓库，支持一键归档至工具库或复制部署指令给智能体。
            </p>
          </div>
        )}

        {!loading && !requestError && result && (
          <div className="space-y-3" data-testid="github-search-results">
            <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="text-xs font-semibold text-slate-900 truncate">
                「{result.scenario}」推荐项目
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums shrink-0">
                共 {result.items.length} 个
              </span>
            </div>

            {result.items.length === 0 ? (
              <div className="py-8 text-center space-y-1.5 text-xs text-slate-500">
                <p className="font-medium text-slate-700">暂未匹配到高星开源项目</p>
                <p>可以尝试简化场景词，或取消「优先支持 Docker」后再试一次。</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {result.items.map((repo) => {
                  const saved = isRepoSaved(repo);
                  const safeLink = isSafeGithubUrl(repo.htmlUrl);

                  return (
                    <li key={repo.id} className="py-4 first:pt-1 space-y-2.5">
                      {/* Clean unboxed metadata row */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
                        {repo.stars > 0 && (
                          <>
                            <span className="font-semibold text-slate-700">
                              {formatStarCount(repo.stars)} Stars
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{repo.language}</span>
                        {repo.updatedAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{repo.updatedAt}</span>
                          </>
                        )}
                      </div>

                      {/* Safe Repo Link */}
                      <div className="flex items-start justify-between gap-2">
                        {safeLink ? (
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-bold font-mono text-slate-900 hover:text-blue-700 break-all leading-snug"
                          >
                            <span>{repo.fullName}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-sm font-bold font-mono text-slate-900 break-all">
                            {repo.fullName}
                          </span>
                        )}
                      </div>

                      {/* Zero-code Reuse Fit */}
                      <div className="text-xs font-semibold text-blue-700">
                        推荐复用：{repo.recommendedMethod}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        <GlossaryText text={repo.lifeFitSummary} />
                      </p>

                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-md p-2.5">
                        <GlossaryText text={repo.zeroCodeTip} />
                      </p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() =>
                            onSaveToToolbox({
                              name: repo.fullName,
                              platform: 'GitHub',
                              method: repo.recommendedMethod,
                              lifeScenario: `${result.scenario}：${repo.lifeFitSummary}`,
                            })
                          }
                          aria-label={saved ? `${repo.fullName} 已存入工具库` : `将 ${repo.fullName} 存入我的工具库`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                            saved
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                          }`}
                        >
                          {saved ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>已存工具库</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>存工具库</span>
                            </>
                          )}
                        </button>

                        <CopyButton
                          text={repo.agentPrompt}
                          label="复制给智能体"
                          ariaLabel={`复制 ${repo.fullName} 智能体部署提示词`}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Bottom Similar Tools Recommendation Panel */}
        <SimilarToolsPanel
          latestCompletedTool={latestCompletedTool}
          savedToolNames={savedToolNames}
          onSaveToToolbox={onSaveToToolbox}
          onGoToToolbox={onGoToToolbox}
        />
      </div>
    </aside>
  );
}
