import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildAgentPromptForRepo,
  buildGithubSearchQuery,
  hasMatchedScenarioRule,
  inferReuseMethodFromRepo,
  isSafeGithubUrl,
  validateScenarioQuery,
} from './src/utils/githubSearch.ts';
import {
  isRetryableGeminiError,
  isValidGithubRepoSlug,
  normalizeSimilarRecommendations,
  validateSimilarToolsRequest,
  type RawGeminiSimilarCandidate,
} from './src/utils/similarTools.ts';
import {
  normalizeToolExplainerPayload,
  validateToolSearchQuery,
} from './src/utils/toolExplainer.ts';
import type {
  GithubRepoSuggestion,
  GithubSearchResponse,
  ReuseMethod,
  SimilarToolRecommendation,
  SimilarToolsResponse,
  ToolExplainerResult,
} from './src/types/learning.ts';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const VALID_METHODS: ReuseMethod[] = [
  'Docker 部署',
  'HF Space 直用',
  'Ollama 本地拉取',
  'Dify 接口接入',
  'Agent 改造封装',
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 30000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CacheEntry {
  expiresAt: number;
  data: GithubSearchResponse;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(key: string): GithubSearchResponse | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(key: string, data: GithubSearchResponse): void {
  if (searchCache.size >= 50) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
}

interface SimilarCacheEntry {
  expiresAt: number;
  data: SimilarToolsResponse;
}

const similarToolsCache = new Map<string, SimilarCacheEntry>();
const inFlightSimilarRequests = new Map<string, Promise<SimilarToolsResponse>>();
const SIMILAR_CACHE_TTL_MS = 10 * 60 * 1000;

interface ToolExplainerCacheEntry {
  expiresAt: number;
  data: ToolExplainerResult;
}

const toolExplainerCache = new Map<string, ToolExplainerCacheEntry>();
const TOOL_EXPLAINER_CACHE_TTL_MS = 15 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSimilarCache(key: string): SimilarToolsResponse | null {
  const entry = similarToolsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    similarToolsCache.delete(key);
    return null;
  }
  return entry.data;
}

function writeSimilarCache(key: string, data: SimilarToolsResponse): void {
  if (similarToolsCache.size >= 50) {
    const oldestKey = similarToolsCache.keys().next().value;
    if (oldestKey) similarToolsCache.delete(oldestKey);
  }
  similarToolsCache.set(key, { expiresAt: Date.now() + SIMILAR_CACHE_TTL_MS, data });
}

interface RawGithubRepo {
  id: number;
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  topics?: string[];
}

async function expandScenarioQueryWithGemini(
  ai: GoogleGenAI,
  scenario: string,
  dockerOnly: boolean
): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `将用户的中文生活/工作需求翻译为最适合在 GitHub Search Repositories API 中检索热门开源工具的简短英文关键词（2-5个英文词，不要加 stars: 或引号，不要解释）。需求：${scenario}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishKeywords: {
              type: Type.STRING,
              description: '2 to 5 concise English search keywords for GitHub repositories.',
            },
          },
          required: ['englishKeywords'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim()) as { englishKeywords?: string };
    const cleanKeywords = (parsed.englishKeywords ?? '')
      .replace(/[:"'`\\()<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanKeywords.length < 2) return null;
    return `${cleanKeywords}${dockerOnly ? ' docker' : ''} stars:>300 archived:false`;
  } catch {
    return null;
  }
}

async function fetchGithubRepositories(query: string): Promise<RawGithubRepo[]> {
  const params = new URLSearchParams({
    q: query,
    sort: 'stars',
    order: 'desc',
    per_page: '6',
  });

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'opensource-ai-workbench',
  };
  const ghToken = process.env.GITHUB_TOKEN?.trim();
  if (ghToken) {
    headers.Authorization = `Bearer ${ghToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`GitHub API ${res.status}: ${errorText.slice(0, 120)}`);
    }
    const payload = (await res.json()) as { items?: RawGithubRepo[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } finally {
    clearTimeout(timeout);
  }
}

function defaultZeroCodeTip(method: ReuseMethod, repoName: string): string {
  switch (method) {
    case 'Docker 部署':
      return `在 ${repoName} 仓库根目录找 docker-compose.yml 或 README 的 Docker 命令一键启动，再按需通过 HTTP 接入本地 Dify。`;
    case 'Dify 接口接入':
      return `先本地或云端启动 ${repoName} 服务，随后在 Dify 工作流添加 HTTP 请求节点直接调用接口。`;
    case 'Ollama 本地拉取':
      return `配合本地 Ollama 模型底座运行，敏感生活文档全程离线处理、数据不出电脑。`;
    case 'HF Space 直用':
      return `优先找对应网页 Demo 或 Hugging Face Space 免安装试用，满意后再考虑本地容器化。`;
    default:
      return `跳过源码目录，直接复制 ${repoName} 的 README 安装与示例段落给 Antigravity / Hermes，帮你封装成中文图形界面。`;
  }
}

async function enrichReposWithGemini(
  ai: GoogleGenAI,
  scenario: string,
  repos: GithubRepoSuggestion[]
): Promise<GithubRepoSuggestion[]> {
  if (repos.length === 0) return repos;
  try {
    const compactInput = repos.map((r) => ({
      fullName: r.fullName,
      description: r.description,
      stars: r.stars,
      topics: r.topics.slice(0, 5),
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `用户是一位无编程基础但熟练使用 OpenRouter、Ollama、Docker、Dify 和 Antigravity/Hermes 智能体的零代码 AI 实践者。他正在寻找解决「${scenario}」的 GitHub 开源工具。请针对以下真实 GitHub 仓库列表，为每个项目生成简短、接地气的中文零代码复用建议：\n${JSON.stringify(compactInput)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              lifeFitSummary: {
                type: Type.STRING,
                description: '1句话中文说明它如何解决用户的具体生活场景（不超过45字）。',
              },
              zeroCodeTip: {
                type: Type.STRING,
                description: '1句话中文零代码复用建议，结合 Docker/Dify/Ollama/智能体（不超过55字）。',
              },
              recommendedMethod: {
                type: Type.STRING,
                description: '必须从以下选项中选一个：Docker 部署、HF Space 直用、Ollama 本地拉取、Dify 接口接入、Agent 改造封装',
              },
            },
            required: ['fullName', 'lifeFitSummary', 'zeroCodeTip', 'recommendedMethod'],
          },
        },
      },
    });

    const enrichedList = JSON.parse((response.text ?? '[]').trim()) as Array<{
      fullName: string;
      lifeFitSummary: string;
      zeroCodeTip: string;
      recommendedMethod: string;
    }>;

    const byName = new Map(enrichedList.map((item) => [item.fullName.toLowerCase(), item]));

    return repos.map((repo) => {
      const match = byName.get(repo.fullName.toLowerCase());
      if (!match) return repo;
      const validMethod = VALID_METHODS.includes(match.recommendedMethod as ReuseMethod)
        ? (match.recommendedMethod as ReuseMethod)
        : repo.recommendedMethod;

      return {
        ...repo,
        recommendedMethod: validMethod,
        lifeFitSummary: match.lifeFitSummary?.trim() || repo.lifeFitSummary,
        zeroCodeTip: match.zeroCodeTip?.trim() || repo.zeroCodeTip,
        agentPrompt: buildAgentPromptForRepo(repo.fullName, repo.htmlUrl, scenario, validMethod),
      };
    });
  } catch {
    return repos;
  }
}

async function searchWithGeminiGroundingFallback(
  ai: GoogleGenAI,
  scenario: string,
  dockerOnly: boolean
): Promise<GithubRepoSuggestion[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `请使用 Google Search 检索 GitHub 上最热门、维护活跃、适合零代码用户解决「${scenario}」${dockerOnly ? '（优先支持 Docker 一键部署）' : ''}的 4 个真实开源项目。请严格返回 JSON 数组，每项包含 fullName (如 owner/repo)、htmlUrl (必须是 https://github.com/ 开头)、description、lifeFitSummary、zeroCodeTip、recommendedMethod（只能是 Docker 部署 / Dify 接口接入 / Ollama 本地拉取 / HF Space 直用 / Agent 改造封装 之一）。不要输出 Markdown 代码块包裹之外的多余文字。`,
    config: {
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  const rawText = (response.text ?? '').trim();
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    fullName?: string;
    htmlUrl?: string;
    description?: string;
    lifeFitSummary?: string;
    zeroCodeTip?: string;
    recommendedMethod?: string;
  }>;

  const items: GithubRepoSuggestion[] = [];
  for (const entry of parsed.slice(0, 5)) {
    const htmlUrl = entry.htmlUrl?.trim() ?? '';
    const fullName = entry.fullName?.trim() ?? '';
    if (!fullName || !isSafeGithubUrl(htmlUrl)) continue;
    const method = VALID_METHODS.includes(entry.recommendedMethod as ReuseMethod)
      ? (entry.recommendedMethod as ReuseMethod)
      : 'Agent 改造封装';
    const shortName = fullName.split('/')[1] ?? fullName;

    items.push({
      id: `grounded-${fullName}`,
      fullName,
      name: shortName,
      htmlUrl,
      description: entry.description?.trim() || '来自 GitHub 开源社区的热门工具项目',
      stars: 0,
      language: 'Open Source',
      updatedAt: '',
      topics: [],
      recommendedMethod: method,
      lifeFitSummary: entry.lifeFitSummary?.trim() || `适用于「${scenario}」场景的现成开源工具。`,
      zeroCodeTip: entry.zeroCodeTip?.trim() || defaultZeroCodeTip(method, shortName),
      agentPrompt: buildAgentPromptForRepo(fullName, htmlUrl, scenario, method),
    });
  }
  return items;
}

async function fetchSingleGithubRepoMeta(
  fullName: string
): Promise<{ stars: number; language: string; htmlUrl: string } | null> {
  if (!isValidGithubRepoSlug(fullName)) return null;
  const [owner, repo] = fullName.split('/');

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'opensource-ai-workbench',
  };
  const ghToken = process.env.GITHUB_TOKEN?.trim();
  if (ghToken) {
    headers.Authorization = `Bearer ${ghToken}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      { headers, signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      stargazers_count?: number;
      language?: string | null;
      html_url?: string;
    };
    const htmlUrl = typeof data.html_url === 'string' && isSafeGithubUrl(data.html_url)
      ? data.html_url
      : `https://github.com/${fullName}`;
    return {
      stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
      language: data.language || 'Open Source',
      htmlUrl,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function recommendSimilarToolsWithGemini(
  ai: GoogleGenAI,
  input: {
    toolName: string;
    platform: string;
    method: ReuseMethod;
    lifeScenario: string;
    excludeNames: string[];
  }
): Promise<{ items: SimilarToolRecommendation[]; githubEnriched: boolean }> {
  const excludeClause =
    input.excludeNames.length > 0
      ? `不要推荐用户已有项目：${input.excludeNames.slice(0, 10).join('、')}。`
      : '';

  const prompt = `为零代码 AI 实践者推荐 4 个与「${input.toolName}」（${input.platform} / ${input.method} / 场景：${input.lifeScenario}）高度相似或互补的真实高星 GitHub 开源项目（最终筛选 3 个）。${excludeClause}
要求：fullName 为真实 owner/repo；htmlUrl 为 https://github.com/owner/repo；similarityReason 用 1 句简短中文（≤40字）；zeroCodeTip 用 1 句中文结合 Docker/Dify/Ollama/智能体（≤45字）；recommendedMethod 仅限：Docker 部署、HF Space 直用、Ollama 本地拉取、Dify 接口接入、Agent 改造封装。`;

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        fullName: {
          type: Type.STRING,
          description: 'Exact GitHub repository slug in owner/repo format.',
        },
        htmlUrl: {
          type: Type.STRING,
          description: 'Canonical https://github.com/owner/repo URL.',
        },
        estimatedStars: {
          type: Type.INTEGER,
          description: 'Approximate GitHub star count for this popular repository.',
        },
        language: {
          type: Type.STRING,
          description: 'Primary programming language (e.g. Python, TypeScript, Go).',
        },
        recommendedMethod: {
          type: Type.STRING,
          description: 'One of: Docker 部署, HF Space 直用, Ollama 本地拉取, Dify 接口接入, Agent 改造封装.',
        },
        similarityReason: {
          type: Type.STRING,
          description: 'Concise Chinese sentence explaining why this project is similar or complementary.',
        },
        zeroCodeTip: {
          type: Type.STRING,
          description: 'Concise Chinese zero-code reuse tip.',
        },
      },
      required: [
        'fullName',
        'htmlUrl',
        'estimatedStars',
        'language',
        'recommendedMethod',
        'similarityReason',
        'zeroCodeTip',
      ],
    },
  };

  // Graceful retry with exponential backoff and low-latency Gemini failover on 504 DEADLINE_EXCEEDED
  const attempts: Array<{ model: string; thinkingLevel: ThinkingLevel; backoffMs: number }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, backoffMs: 0 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, backoffMs: 500 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, backoffMs: 1200 },
  ];

  let responseText = '[]';
  let lastError: unknown = null;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    if (attempt.backoffMs > 0) {
      await sleep(attempt.backoffMs);
    }
    try {
      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      responseText = (response.text ?? '[]').trim();
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (!isRetryableGeminiError(err) || i === attempts.length - 1) {
        throw err;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  const parsed = JSON.parse(responseText) as RawGeminiSimilarCandidate[];
  const normalized = normalizeSimilarRecommendations(
    Array.isArray(parsed) ? parsed : [],
    input.toolName,
    input.excludeNames,
    input.lifeScenario
  );

  // Best-effort parallel live GitHub metadata enrichment for verified stars & language
  let githubEnriched = false;
  const enriched = await Promise.all(
    normalized.map(async (item) => {
      const liveMeta = await fetchSingleGithubRepoMeta(item.fullName);
      if (!liveMeta) return item;
      githubEnriched = true;
      return {
        ...item,
        stars: liveMeta.stars > 0 ? liveMeta.stars : item.stars,
        language: liveMeta.language || item.language,
        htmlUrl: liveMeta.htmlUrl,
      };
    })
  );

  return { items: enriched, githubEnriched };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/github-search', async (req, res) => {
    const rawScenario = typeof req.body?.scenario === 'string' ? req.body.scenario : '';
    const dockerOnly = Boolean(req.body?.dockerOnly);

    const validation = validateScenarioQuery(rawScenario);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const scenario = validation.cleaned;
    const cacheKey = `${scenario.toLowerCase()}::${dockerOnly ? 'docker' : 'all'}`;
    const cached = readCache(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const ai = getGeminiClient();
    const fallbackQuery = buildGithubSearchQuery(scenario, dockerOnly);
    const shouldExpandWithGemini = Boolean(ai && !hasMatchedScenarioRule(scenario));
    const geminiExpandedQuery = shouldExpandWithGemini && ai
      ? await withTimeout(expandScenarioQueryWithGemini(ai, scenario, dockerOnly), 3500, null)
      : null;
    const resolvedQuery = geminiExpandedQuery ?? fallbackQuery;

    try {
      let rawRepos = await fetchGithubRepositories(resolvedQuery);
      // If a Gemini-expanded query returned 0 repos, retry once with deterministic mapper
      if (rawRepos.length === 0 && resolvedQuery !== fallbackQuery) {
        rawRepos = await fetchGithubRepositories(fallbackQuery);
      }

      const mapped: GithubRepoSuggestion[] = rawRepos
        .filter((repo) => isSafeGithubUrl(repo.html_url))
        .slice(0, 5)
        .map((repo) => {
          const rawDesc = (repo.description?.trim() || '热门 GitHub 开源工具仓库，详见项目 README。')
            .replace(/\s+/g, ' ');
          const description = rawDesc.length > 200 ? `${rawDesc.slice(0, 197)}...` : rawDesc;
          const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 6) : [];
          const method = inferReuseMethodFromRepo({
            name: repo.name,
            description,
            topics,
            language: repo.language ?? undefined,
          });
          return {
            id: String(repo.id),
            fullName: repo.full_name,
            name: repo.name,
            htmlUrl: repo.html_url,
            description,
            stars: repo.stargazers_count,
            language: repo.language || 'Multi-language',
            updatedAt: repo.pushed_at ? repo.pushed_at.slice(0, 10) : '',
            topics,
            recommendedMethod: method,
            lifeFitSummary: description,
            zeroCodeTip: defaultZeroCodeTip(method, repo.name),
            agentPrompt: buildAgentPromptForRepo(repo.full_name, repo.html_url, scenario, method),
          };
        });

      const finalItems = ai
        ? await withTimeout(enrichReposWithGemini(ai, scenario, mapped), 6500, mapped)
        : mapped;
      const responsePayload: GithubSearchResponse = {
        scenario,
        resolvedQuery,
        source: ai ? 'github-api+gemini' : 'github-api',
        items: finalItems,
      };

      writeCache(cacheKey, responsePayload);
      res.json(responsePayload);
    } catch (githubError) {
      // If GitHub REST API is rate-limited or temporarily unreachable, try live Gemini Search Grounding
      if (ai) {
        try {
          const groundedItems = await withTimeout(
            searchWithGeminiGroundingFallback(ai, scenario, dockerOnly),
            10000,
            []
          );
          if (groundedItems.length > 0) {
            const payload: GithubSearchResponse = {
              scenario,
              resolvedQuery,
              source: 'gemini-search',
              items: groundedItems,
            };
            writeCache(cacheKey, payload);
            res.json(payload);
            return;
          }
        } catch {
          // Fall through to honest error response
        }
      }

      const msg = githubError instanceof Error ? githubError.message : 'GitHub 检索服务暂时不可用';
      const isRateLimit = msg.includes('403') || msg.includes('429');
      res.status(isRateLimit ? 429 : 502).json({
        error: isRateLimit
          ? 'GitHub 公共搜索接口当前请求较频繁，请稍等片刻后重试，或换一个场景词再试。'
          : '连接 GitHub 检索接口失败，请稍后点击重试。',
      });
    }
  });

  app.post('/api/similar-tools', async (req, res) => {
    const validated = validateSimilarToolsRequest(req.body);
    if (!validated.valid) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const cacheKey = `${validated.toolName.toLowerCase()}::${validated.method}::${validated.lifeScenario.slice(0, 48).toLowerCase()}`;
    if (!validated.forceRefresh) {
      const cached = readSimilarCache(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: '当前服务端未配置 Gemini API 密钥，请在 Settings > Secrets 面板检查配置后重试。',
      });
      return;
    }

    try {
      let pending = !validated.forceRefresh ? inFlightSimilarRequests.get(cacheKey) : undefined;
      if (!pending) {
        let requestPromise: Promise<SimilarToolsResponse> | undefined;
        requestPromise = (async () => {
          try {
            const { items, githubEnriched } = await recommendSimilarToolsWithGemini(ai, validated);
            if (items.length === 0) {
              throw new Error('EMPTY_RECOMMENDATIONS');
            }
            const payload: SimilarToolsResponse = {
              basedOnTool: validated.toolName,
              source: githubEnriched ? 'gemini+github' : 'gemini',
              items,
            };
            writeSimilarCache(cacheKey, payload);
            return payload;
          } finally {
            if (requestPromise && inFlightSimilarRequests.get(cacheKey) === requestPromise) {
              inFlightSimilarRequests.delete(cacheKey);
            }
          }
        })();
        pending = requestPromise;
        if (!validated.forceRefresh) {
          inFlightSimilarRequests.set(cacheKey, requestPromise);
        }
      }

      const payload = await pending;
      res.json(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'EMPTY_RECOMMENDATIONS') {
        res.status(502).json({
          error: '未能生成有效的相似 GitHub 开源项目推荐，请点击重新获取再试一次。',
        });
        return;
      }

      const isAuthErr =
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('403') ||
        msg.includes('401');
      const isQuotaErr = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');
      const isTimeoutErr = isRetryableGeminiError(err);

      if (isAuthErr) {
        res.status(502).json({
          error: 'Gemini API 认证失败，请在 Settings > Secrets 面板检查 API 密钥状态后重试。',
        });
        return;
      }
      if (isQuotaErr) {
        res.status(429).json({
          error: 'Gemini API 当前请求达到配额上限，请稍后再试。',
        });
        return;
      }
      if (isTimeoutErr) {
        res.status(504).json({
          error: 'Gemini 推荐服务响应超时，请稍候点击「重新获取」再试一次。',
        });
        return;
      }
      res.status(502).json({
        error: '调用 Gemini 相似工具推荐服务暂时失败，请点击重新获取重试。',
      });
    }
  });

  app.post('/api/tool-explainer', async (req, res) => {
    const rawQuery = typeof req.body?.query === 'string' ? req.body.query : '';
    const validation = validateToolSearchQuery(rawQuery);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const cacheKey = validation.query.toLowerCase();
    const cached = toolExplainerCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: '联网解析服务尚未配置 Gemini API 密钥，请检查服务端配置后再试。',
      });
      return;
    }

    const prompt = `你是一位擅长把复杂技术工具讲成“零代码生活化图解案例”的资深产品架构师。
请先使用 Google Search 联网核实工具或技术概念「${validation.query}」的最新官方定位、真实功能与典型应用场景，然后严格只输出一个 JSON 对象（不要包含 Markdown 代码块之外的任何多余解释文字），格式如下：
{
  "toolName": "工具标准名称（如 n8n / Cloudflare / Supabase）",
  "chineseSubtitle": "15字以内的精准中文定位",
  "categoryLayer": "所属层级（如：边缘网络与部署 / 自动化工作流 / 后端与数据库 / 后台数据网站 / AI 智能体平台 / 前端框架）",
  "difficulty": "零代码上手门槛（如：纯零代码点选 / 低代码可视化 / 需配合AI生成少量脚本）",
  "oneLineAnalogy": "一句生动的生活化类比，让完全不懂代码的人5秒懂它是干嘛的",
  "plainDefinition": "80-130字大白话介绍，说明它解决什么痛点、为什么值得用",
  "bestFor": "一句话总结最适合的使用人群与场景",
  "scenarioTitle": "一个具体、真实、贴近生活或办公的实战案例标题（以「案例：」开头）",
  "painBefore": "没用这个工具之前有多麻烦（40-70字）",
  "outcomeAfter": "用上之后达到的直观效果（40-70字）",
  "steps": [
    {
      "nodeName": "步骤1节点短名称（6-12字）",
      "role": "角色标签（4-8字，如：触发源/用户输入）",
      "action": "这一步具体发生什么（30-55字）",
      "sampleData": "这一步流转的具体数据例子（15-35字）"
    }
  ],
  "relatedTools": ["可搭配或对比的工具1", "工具2", "工具3"]
}
要求：
1. steps 数组必须严格包含 3 或 4 个按先后顺序串联的真实流程步骤，能够画成直观的可视化流程图。
2. 全部内容使用清晰自然、避免晦涩术语的简体中文。`;

    try {
      let lastError: unknown;
      let responseText = '';
      let rawSources: Array<{ title?: string; url?: string }> = [];

      const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
      for (let attempt = 0; attempt < modelsToTry.length; attempt += 1) {
        const modelName = modelsToTry[attempt];
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              ...(modelName === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          });

          responseText = (response.text ?? '').trim();
          const chunks =
            response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
          rawSources = chunks
            .map((chunk) => ({
              title: chunk.web?.title,
              url: chunk.web?.uri,
            }))
            .filter((item) => Boolean(item.url));
          break;
        } catch (err) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          const isRateLimited =
            errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429');
          if (attempt === 0 && (isRetryableGeminiError(err) || isRateLimited)) {
            await sleep(isRateLimited ? 1500 : 700);
            continue;
          }
          throw err;
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      const normalized = normalizeToolExplainerPayload(
        responseText,
        validation.query,
        rawSources
      );

      if (!normalized) {
        res.status(502).json({
          error: '联网解析返回格式异常，请稍候重试或换一个更具体的工具名称。',
        });
        return;
      }

      if (toolExplainerCache.size >= 40) {
        const oldestKey = toolExplainerCache.keys().next().value;
        if (oldestKey) toolExplainerCache.delete(oldestKey);
      }
      toolExplainerCache.set(cacheKey, {
        expiresAt: Date.now() + TOOL_EXPLAINER_CACHE_TTL_MS,
        data: normalized,
      });

      res.json(normalized);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[tool-explainer] Gemini grounded search error:', msg);

      const isAuthErr =
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('403') ||
        msg.includes('401');
      const isQuotaErr = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');
      const isTimeoutErr = isRetryableGeminiError(err);

      if (isAuthErr) {
        res.status(502).json({
          error: 'Gemini 联网检索认证失败，请在 Settings > Secrets 面板检查 API 密钥状态。',
        });
        return;
      }
      if (isQuotaErr) {
        res.status(429).json({
          error: '联网检索当前请求达到配额上限，请稍后再试。',
        });
        return;
      }
      if (isTimeoutErr) {
        res.status(504).json({
          error: '联网搜索响应超时，请点击「重新搜索」再试一次。',
        });
        return;
      }
      res.status(502).json({
        error: '联网解析工具含义暂时失败，请稍候重试。',
      });
    }
  });

  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
