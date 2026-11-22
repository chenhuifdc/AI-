import { SCENARIO_TOOL_CATALOG } from '../data/scenarioMatcherData';
import type { ScenarioMatchItem, ScenarioMatchResponse } from '../types/learning';

const STOP_WORDS = new Set([
  '我想',
  '想要',
  '怎么',
  '如何',
  '什么',
  '工具',
  '开源',
  '软件',
  '推荐',
  '一个',
  '可以',
  '自动',
  '帮我',
  '用来',
  '场景',
  '生活',
]);

/**
 * Extracts normalized search tokens (English words + Chinese phrases/bigrams)
 * so both concise ("整理文档", "监控股票") and natural-language queries
 * ("每天帮我自动监控股票价格并提醒") match accurately.
 */
export function extractSearchTokens(rawQuery: string): string[] {
  const cleaned = rawQuery
    .trim()
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, ' ');

  if (!cleaned) return [];

  const tokens = new Set<string>();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  for (const part of parts) {
    if (part.length >= 2 && !STOP_WORDS.has(part)) {
      tokens.add(part);
    }

    // Extract Chinese character chunks & bigrams for fuzzy natural-language matching
    const zhChunks = part.match(/[\u4e00-\u9fa5]+/g) ?? [];
    for (const chunk of zhChunks) {
      if (chunk.length >= 2 && !STOP_WORDS.has(chunk)) {
        tokens.add(chunk);
      }
      for (let i = 0; i <= chunk.length - 2; i += 1) {
        const bigram = chunk.slice(i, i + 2);
        if (!STOP_WORDS.has(bigram)) {
          tokens.add(bigram);
        }
      }
    }

    // Extract ASCII words/numbers (e.g., pdf, n8n, mqtt, node-red)
    const asciiChunks = part.match(/[a-z0-9][a-z0-9-]*/g) ?? [];
    for (const word of asciiChunks) {
      if (word.length >= 2) {
        tokens.add(word);
      }
    }
  }

  return Array.from(tokens);
}

/**
 * Deterministically filters and ranks open-source tools + application principle diagrams
 * based on a user-typed life scenario.
 */
export function matchLifeScenarioTools(rawQuery: string): ScenarioMatchResponse {
  const normalizedQuery = rawQuery.trim();

  if (!normalizedQuery) {
    // Default featured showcase covering the two signature examples ("整理文档" & "监控股票")
    // plus IoT and deployment so the user immediately sees rich interactive blueprints.
    const defaultIds = ['doc-n8n', 'stock-node-red', 'stock-n8n', 'doc-windmill', 'iot-node-red', 'deploy-vercel-render-cf'];
    const featured: ScenarioMatchItem[] = defaultIds
      .map((id) => SCENARIO_TOOL_CATALOG.find((item) => item.id === id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((entry, idx) => ({
        entry,
        score: 100 - idx,
        matchedTerms: [entry.scenarioCategory],
      }));

    return {
      normalizedQuery: '',
      isDefaultView: true,
      matches: featured,
    };
  }

  const lowerQuery = normalizedQuery.toLowerCase();
  const tokens = extractSearchTokens(normalizedQuery);
  const scored: ScenarioMatchItem[] = [];

  for (const entry of SCENARIO_TOOL_CATALOG) {
    let score = 0;
    const matchedTerms = new Set<string>();

    const lowerKeywords = entry.keywords.map((k) => k.toLowerCase());
    const lowerTitle = entry.scenarioTitle.toLowerCase();
    const lowerTool = entry.toolName.toLowerCase();
    const lowerCategory = entry.scenarioCategory.toLowerCase();
    const lowerSummary = `${entry.oneLineReason} ${entry.principleSummary}`.toLowerCase();

    // 1. Direct exact phrase hit against curated keywords (strongest signal)
    for (let i = 0; i < entry.keywords.length; i += 1) {
      const kw = lowerKeywords[i];
      if (kw === lowerQuery) {
        score += 45;
        matchedTerms.add(entry.keywords[i]);
      } else if (lowerQuery.includes(kw) && kw.length >= 2) {
        score += 24;
        matchedTerms.add(entry.keywords[i]);
      } else if (kw.includes(lowerQuery) && lowerQuery.length >= 2) {
        score += 18;
        matchedTerms.add(entry.keywords[i]);
      }
    }

    // 2. Direct tool name or scenario title hit
    if (lowerTool.includes(lowerQuery) || lowerQuery.includes(lowerTool)) {
      score += 30;
      matchedTerms.add(entry.toolName);
    }
    if (lowerTitle.includes(lowerQuery) && lowerQuery.length >= 2) {
      score += 20;
    }

    // 3. Token-level semantic scoring
    for (const token of tokens) {
      let tokenHit = false;
      for (let i = 0; i < entry.keywords.length; i += 1) {
        const kw = lowerKeywords[i];
        if (kw === token) {
          score += 14;
          matchedTerms.add(entry.keywords[i]);
          tokenHit = true;
          break;
        }
        if (kw.includes(token) && token.length >= 2) {
          score += 8;
          matchedTerms.add(entry.keywords[i]);
          tokenHit = true;
          break;
        }
      }
      if (!tokenHit) {
        if (lowerTitle.includes(token) || lowerCategory.includes(token)) {
          score += 7;
          matchedTerms.add(token);
        } else if (lowerSummary.includes(token)) {
          score += 3;
          matchedTerms.add(token);
        }
      }
    }

    if (score >= 8) {
      scored.push({
        entry,
        score,
        matchedTerms: Array.from(matchedTerms).slice(0, 4),
      });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.id.localeCompare(b.entry.id);
  });

  return {
    normalizedQuery,
    isDefaultView: false,
    matches: scored,
  };
}
