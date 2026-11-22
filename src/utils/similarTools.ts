import type {
  ReuseMethod,
  SimilarToolRecommendation,
  ToolNote,
  ToolPlatform,
} from '../types/learning';
import { buildAgentPromptForRepo, isSafeGithubUrl } from './githubSearch';

const VALID_METHODS: ReuseMethod[] = [
  'Docker 部署',
  'HF Space 直用',
  'Ollama 本地拉取',
  'Dify 接口接入',
  'Agent 改造封装',
];

const GITHUB_SLUG_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function sanitizeSingleLine(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Selects the user's most recently completed ('已跑通') tool.
 * Priority: explicit completedAt timestamp -> latest createdAt date -> first matching entry.
 */
export function getLatestCompletedTool(notes: ToolNote[]): ToolNote | null {
  const completed = notes
    .map((note, index) => ({ note, index }))
    .filter(({ note }) => note.status === '已跑通');

  if (completed.length === 0) {
    return null;
  }

  completed.sort((a, b) => {
    const compA = typeof a.note.completedAt === 'number' ? a.note.completedAt : -1;
    const compB = typeof b.note.completedAt === 'number' ? b.note.completedAt : -1;
    if (compA !== compB) {
      return compB - compA;
    }

    const createdA = Date.parse(a.note.createdAt || '');
    const createdB = Date.parse(b.note.createdAt || '');
    const safeCreatedA = Number.isFinite(createdA) ? createdA : 0;
    const safeCreatedB = Number.isFinite(createdB) ? createdB : 0;
    if (safeCreatedA !== safeCreatedB) {
      return safeCreatedB - safeCreatedA;
    }

    return a.index - b.index;
  });

  return completed[0].note;
}

export interface ValidatedSimilarToolsInput {
  valid: boolean;
  error?: string;
  toolName: string;
  platform: ToolPlatform;
  method: ReuseMethod;
  lifeScenario: string;
  excludeNames: string[];
  forceRefresh: boolean;
}

/**
 * Validates and bounds incoming payload for POST /api/similar-tools.
 */
export function validateSimilarToolsRequest(body: unknown): ValidatedSimilarToolsInput {
  const obj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const toolName = sanitizeSingleLine(obj.toolName, 100);
  const lifeScenario = sanitizeSingleLine(obj.lifeScenario, 240);
  const rawPlatform = sanitizeSingleLine(obj.platform, 30);
  const rawMethod = sanitizeSingleLine(obj.method, 30);
  const forceRefresh = Boolean(obj.forceRefresh);

  const platform: ToolPlatform = rawPlatform === 'Hugging Face' ? 'Hugging Face' : 'GitHub';
  const method: ReuseMethod = VALID_METHODS.includes(rawMethod as ReuseMethod)
    ? (rawMethod as ReuseMethod)
    : 'Docker 部署';

  const rawExcludes = Array.isArray(obj.excludeNames) ? obj.excludeNames : [];
  const excludeNames = rawExcludes
    .map((item) => sanitizeSingleLine(item, 100))
    .filter((item) => item.length > 0)
    .slice(0, 20);

  if (toolName.length < 2) {
    return {
      valid: false,
      error: '缺少有效的已跑通工具名称，请先在实战清单中标记至少一个已跑通工具。',
      toolName,
      platform,
      method,
      lifeScenario,
      excludeNames,
      forceRefresh,
    };
  }

  return {
    valid: true,
    toolName,
    platform,
    method,
    lifeScenario: lifeScenario || `与 ${toolName} 类似的零代码生活与效率自动化场景`,
    excludeNames,
    forceRefresh,
  };
}

/**
 * Strictly validates a GitHub `owner/repo` slug before making any outbound GitHub API call.
 */
export function isValidGithubRepoSlug(slug: string): boolean {
  const trimmed = slug.trim();
  if (!GITHUB_SLUG_RE.test(trimmed)) return false;
  if (trimmed.includes('..')) return false;
  return true;
}

export interface RawGeminiSimilarCandidate {
  fullName?: unknown;
  htmlUrl?: unknown;
  estimatedStars?: unknown;
  stars?: unknown;
  language?: unknown;
  recommendedMethod?: unknown;
  similarityReason?: unknown;
  zeroCodeTip?: unknown;
}

/**
 * Normalizes, deduplicates, safety-checks, and caps Gemini similar-tool recommendations to 3 items.
 */
export function normalizeSimilarRecommendations(
  candidates: RawGeminiSimilarCandidate[],
  baseToolName: string,
  excludeNames: string[],
  lifeScenario: string
): SimilarToolRecommendation[] {
  const blocked = new Set<string>(
    [baseToolName, ...excludeNames]
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean)
  );
  // Also block short repo name of baseToolName (e.g. "markitdown" for "microsoft/markitdown")
  const baseShort = baseToolName.split('/').pop()?.trim().toLowerCase();
  if (baseShort) blocked.add(baseShort);

  const seenSlugs = new Set<string>();
  const results: SimilarToolRecommendation[] = [];

  for (const raw of candidates) {
    if (results.length >= 3) break;

    const fullName = sanitizeSingleLine(raw.fullName, 100);
    if (!isValidGithubRepoSlug(fullName)) continue;

    const lowerSlug = fullName.toLowerCase();
    const shortName = fullName.split('/')[1] ?? fullName;
    const lowerShort = shortName.toLowerCase();

    if (seenSlugs.has(lowerSlug) || blocked.has(lowerSlug) || blocked.has(lowerShort)) {
      continue;
    }

    const candidateUrl = sanitizeSingleLine(raw.htmlUrl, 200);
    const htmlUrl = isSafeGithubUrl(candidateUrl)
      ? candidateUrl
      : `https://github.com/${fullName}`;

    if (!isSafeGithubUrl(htmlUrl)) continue;

    const rawMethod = sanitizeSingleLine(raw.recommendedMethod, 30);
    const recommendedMethod: ReuseMethod = VALID_METHODS.includes(rawMethod as ReuseMethod)
      ? (rawMethod as ReuseMethod)
      : 'Docker 部署';

    const rawStars = Number(raw.stars ?? raw.estimatedStars ?? 0);
    const stars = Number.isFinite(rawStars) && rawStars > 0 ? Math.round(rawStars) : 0;

    const language = sanitizeSingleLine(raw.language, 32) || 'Open Source';
    const similarityReason =
      sanitizeSingleLine(raw.similarityReason, 120) ||
      `与你已跑通的 ${baseToolName} 场景互补，适合零代码快速复用。`;
    const zeroCodeTip =
      sanitizeSingleLine(raw.zeroCodeTip, 140) ||
      `优先采用「${recommendedMethod}」方式接入，免手写底层代码即可投入使用。`;

    seenSlugs.add(lowerSlug);
    results.push({
      id: `sim-${lowerSlug}`,
      fullName,
      name: shortName,
      htmlUrl,
      stars,
      language,
      recommendedMethod,
      similarityReason,
      zeroCodeTip,
      agentPrompt: buildAgentPromptForRepo(
        fullName,
        htmlUrl,
        lifeScenario || `${baseToolName} 同类场景`,
        recommendedMethod
      ),
    });
  }

  return results;
}

/**
 * Classifies whether a Gemini SDK error is a transient deadline/availability failure safe to retry.
 */
export function isRetryableGeminiError(error: unknown): boolean {
  const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  const lower = raw.toLowerCase();
  return (
    lower.includes('504') ||
    lower.includes('503') ||
    lower.includes('deadline_exceeded') ||
    lower.includes('deadline expired') ||
    lower.includes('unavailable') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('aborterror') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed')
  );
}
