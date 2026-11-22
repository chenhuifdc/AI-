import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import type {
  SimilarToolRecommendation,
  SimilarToolsResponse,
  ToolNote,
  ToolNoteDraft,
} from '../types/learning';
import { formatStarCount, isSafeGithubUrl } from '../utils/githubSearch';
import { CopyButton } from './CopyButton';

interface SimilarToolsPanelProps {
  latestCompletedTool: ToolNote | null;
  savedToolNames: string[];
  onSaveToToolbox: (draft: ToolNoteDraft) => void;
  onGoToToolbox?: () => void;
}

export function SimilarToolsPanel({
  latestCompletedTool,
  savedToolNames,
  onSaveToToolbox,
  onGoToToolbox,
}: SimilarToolsPanelProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SimilarToolsResponse | null>(null);
  const savedNamesRef = useRef<string[]>(savedToolNames);
  savedNamesRef.current = savedToolNames;

  const toolKey = latestCompletedTool
    ? `${latestCompletedTool.id}::${latestCompletedTool.name}::${latestCompletedTool.method}::${latestCompletedTool.lifeScenario}`
    : '';

  const fetchRecommendations = useCallback(
    async (tool: ToolNote, forceRefresh: boolean, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/similar-tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            toolName: tool.name,
            platform: tool.platform,
            method: tool.method,
            lifeScenario: tool.lifeScenario,
            excludeNames: savedNamesRef.current,
            forceRefresh,
          }),
        });

        const payload = (await res.json()) as SimilarToolsResponse & { error?: string };
        if (!res.ok) {
          throw new Error(payload.error || '获取相似工具推荐失败，请稍后重试。');
        }
        setData(payload);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(
          err instanceof Error ? err.message : '获取相似工具推荐失败，请稍后重试。'
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!latestCompletedTool) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    void fetchRecommendations(latestCompletedTool, false, controller.signal);

    return () => {
      controller.abort();
    };
  }, [toolKey, latestCompletedTool, fetchRecommendations]);

  const isSaved = (repo: SimilarToolRecommendation) => {
    const lowerSet = new Set(savedToolNames.map((n) => n.toLowerCase()));
    return lowerSet.has(repo.fullName.toLowerCase()) || lowerSet.has(repo.name.toLowerCase());
  };

  return (
    <section
      aria-label="相似工具推荐"
      data-testid="similar-tools-panel"
      className="mt-5 pt-4 border-t border-slate-200 -mx-5 px-5 pb-2 bg-[#F7F8FA]/60"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            相似工具推荐
          </h3>
          {latestCompletedTool ? (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              基于最近已跑通：
              <span className="font-semibold text-slate-800 break-all">
                {latestCompletedTool.name}
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-0.5">
              标记已跑通工具后自动推荐高星替代与互补项目
            </p>
          )}
        </div>

        {latestCompletedTool && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchRecommendations(latestCompletedTool, true)}
            aria-label="刷新相似工具推荐"
            title="换一批相似工具推荐"
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 rounded-md transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>刷新</span>
          </button>
        )}
      </div>

      {!latestCompletedTool && (
        <div
          data-testid="similar-tools-empty"
          className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2.5 text-xs text-slate-600"
        >
          <p className="leading-relaxed">
            你还没有标记「已跑通」的开源工具。在实战清单中把任意工具切换为「已跑通」后，这里会自动为你推荐 3 个 GitHub 高星相似项目。
          </p>
          {onGoToToolbox && (
            <button
              type="button"
              onClick={onGoToToolbox}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer"
            >
              <span>前往实战清单标记</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {latestCompletedTool && loading && (
        <div className="space-y-2.5" data-testid="similar-tools-loading">
          <div className="text-[11px] text-slate-500">
            正在结合「{latestCompletedTool.name}」为你筛选 3 个高星开源项目...
          </div>
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200/80 bg-white p-3 space-y-2 animate-pulse"
            >
              <div className="h-2.5 bg-slate-200 rounded w-1/2" />
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {latestCompletedTool && !loading && error && (
        <div
          role="alert"
          data-testid="similar-tools-error"
          className="rounded-lg border border-red-200 bg-red-50/70 p-3 space-y-2.5"
        >
          <div className="flex items-start gap-2 text-xs text-red-800 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchRecommendations(latestCompletedTool, true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-red-800 bg-white border border-red-300 hover:bg-red-50 rounded-md cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" />
            <span>重新获取</span>
          </button>
        </div>
      )}

      {latestCompletedTool && !loading && !error && data && (
        <ul className="space-y-2.5" data-testid="similar-tools-list">
          {data.items.map((repo) => {
            const saved = isSaved(repo);
            const safeLink = isSafeGithubUrl(repo.htmlUrl);

            return (
              <li
                key={repo.id}
                className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
              >
                {/* Unboxed metadata line */}
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
                  <span aria-hidden="true">·</span>
                  <span className="font-sans font-medium text-blue-700">
                    {repo.recommendedMethod}
                  </span>
                </div>

                {/* Safe GitHub Link */}
                <div>
                  {safeLink ? (
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold font-mono text-slate-900 hover:text-blue-700 break-all leading-snug"
                    >
                      <span>{repo.fullName}</span>
                      <ExternalLink
                        className="w-3 h-3 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                    </a>
                  ) : (
                    <span className="text-xs font-bold font-mono text-slate-900 break-all">
                      {repo.fullName}
                    </span>
                  )}
                </div>

                {/* Similarity Reason */}
                <p className="text-xs text-slate-700 leading-relaxed">
                  {repo.similarityReason}
                </p>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {repo.zeroCodeTip}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    disabled={saved}
                    onClick={() =>
                      onSaveToToolbox({
                        name: repo.fullName,
                        platform: 'GitHub',
                        method: repo.recommendedMethod,
                        lifeScenario: `与 ${latestCompletedTool.name} 相似：${repo.similarityReason}`,
                      })
                    }
                    aria-label={
                      saved
                        ? `${repo.fullName} 已存入工具库`
                        : `将相似工具 ${repo.fullName} 存入我的工具库`
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      saved
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                    }`}
                  >
                    {saved ? (
                      <>
                        <BookmarkCheck className="w-3 h-3" aria-hidden="true" />
                        <span>已存工具库</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3 h-3" aria-hidden="true" />
                        <span>存工具库</span>
                      </>
                    )}
                  </button>

                  <CopyButton
                    text={repo.agentPrompt}
                    label="复制给智能体"
                    ariaLabel={`复制相似工具 ${repo.fullName} 智能体部署提示词`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
