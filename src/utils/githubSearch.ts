import type { ReuseMethod } from '../types/learning';

interface ScenarioKeywordRule {
  patterns: RegExp[];
  keywords: string;
}

const SCENARIO_KEYWORD_RULES: ScenarioKeywordRule[] = [
  {
    patterns: [/pdf/i, /发票/, /票据/, /文档总结/, /文档提取/, /合同/],
    keywords: 'pdf llm',
  },
  {
    patterns: [/爬虫/, /抓取/, /采集/, /网页提取/, /监控网页/, /crawl/i, /scrap/i],
    keywords: 'web crawler llm',
  },
  {
    patterns: [/字幕/, /播客/, /视频翻译/, /双语/, /subtitle/i, /video/i],
    keywords: 'video subtitle whisper',
  },
  {
    patterns: [/语音/, /转文字/, /录音/, /听写/, /asr/i, /whisper/i, /tts/i],
    keywords: 'whisper speech to text',
  },
  {
    patterns: [/知识库/, /笔记/, /rag/i, /检索/, /问答/],
    keywords: 'rag knowledge base llm',
  },
  {
    patterns: [/记账/, /财务/, /账单/, /报销/, /预算/],
    keywords: 'personal finance self-hosted',
  },
  {
    patterns: [/抠图/, /修图/, /去背景/, /ocr/i, /识图/, /图片/],
    keywords: 'image ocr background remove',
  },
  {
    patterns: [/周报/, /调研/, /rss/i, /新闻/, /摘要/, /简报/],
    keywords: 'rss summary llm',
  },
  {
    patterns: [/翻译/, /英语/, /外语/, /translate/i],
    keywords: 'llm translator bilingual',
  },
  {
    patterns: [/自动/, /工作流/, /定时/, /workflow/i, /automation/i],
    keywords: 'workflow automation self-hosted',
  },
];

/**
 * Validates raw scenario search text entered by the user.
 */
export function validateScenarioQuery(raw: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (cleaned.length < 2) {
    return {
      valid: false,
      cleaned,
      error: '请输入至少 2 个字的生活或工作场景（例如：PDF自动总结、自动化爬虫）。',
    };
  }
  if (cleaned.length > 120) {
    return {
      valid: false,
      cleaned: cleaned.slice(0, 120),
      error: '搜索描述请控制在 120 字以内，聚焦核心痛点即可。',
    };
  }
  return { valid: true, cleaned };
}

/**
 * Returns true when the scenario directly matches a curated Chinese/English keyword rule.
 */
export function hasMatchedScenarioRule(scenario: string): boolean {
  const cleaned = scenario.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return SCENARIO_KEYWORD_RULES.some((rule) => rule.patterns.some((re) => re.test(cleaned)));
}

/**
 * Maps a Chinese or mixed-language life scenario to a focused GitHub repository search query.
 */
export function buildGithubSearchQuery(scenario: string, dockerOnly = false): string {
  const cleaned = scenario.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  const matchedKeywords: string[] = [];

  for (const rule of SCENARIO_KEYWORD_RULES) {
    if (rule.patterns.some((re) => re.test(cleaned))) {
      matchedKeywords.push(rule.keywords);
      if (matchedKeywords.length >= 2) break;
    }
  }

  let baseQuery = '';
  if (matchedKeywords.length > 0) {
    baseQuery = matchedKeywords[0];
  } else {
    // Keep clean alphanumeric/Chinese terms while stripping GitHub search operator abuse
    const safeTerms = cleaned.replace(/[:"'`\\()<>]/g, ' ').replace(/\s+/g, ' ').trim();
    baseQuery = safeTerms ? `${safeTerms} ai tool` : 'ai automation tool';
  }

  const dockerClause = dockerOnly ? ' docker' : '';
  return `${baseQuery}${dockerClause} stars:>300 archived:false`.trim();
}

/**
 * Infers the most practical zero-code reuse method for a GitHub repository.
 */
export function inferReuseMethodFromRepo(repo: {
  name: string;
  description: string;
  topics: string[];
  language?: string;
}): ReuseMethod {
  const haystack = `${repo.name} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();

  if (
    haystack.includes('docker') ||
    haystack.includes('self-hosted') ||
    haystack.includes('selfhosted') ||
    haystack.includes('compose') ||
    haystack.includes('web-ui') ||
    haystack.includes('webui')
  ) {
    return 'Docker 部署';
  }

  if (
    haystack.includes('api') ||
    haystack.includes('crawler') ||
    haystack.includes('scraper') ||
    haystack.includes('mcp') ||
    haystack.includes('workflow') ||
    haystack.includes('dify')
  ) {
    return 'Dify 接口接入';
  }

  if (
    haystack.includes('ollama') ||
    haystack.includes('gguf') ||
    haystack.includes('local-llm') ||
    haystack.includes('quantized')
  ) {
    return 'Ollama 本地拉取';
  }

  if (haystack.includes('gradio') || haystack.includes('huggingface')) {
    return 'HF Space 直用';
  }

  return 'Agent 改造封装';
}

/**
 * Generates a ready-to-paste Agent delegation prompt for a retrieved GitHub repo.
 */
export function buildAgentPromptForRepo(
  repoFullName: string,
  repoUrl: string,
  scenario: string,
  method: ReuseMethod
): string {
  return `我想零代码解决「${scenario}」这个场景，选中了 GitHub 开源项目 ${repoFullName}（${repoUrl}）。请不要让我手写底层代码，优先采用「${method}」方式帮我：1）解读它最简部署或接入步骤；2）给出适配我本机 Docker / Dify / Ollama 的可直接执行命令或极简操作界面方案。`;
}

/**
 * Strictly validates that an external repository link points to https://github.com/.
 */
export function isSafeGithubUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
  } catch {
    return false;
  }
}

/**
 * Formats repository star counts cleanly for tabular numerals.
 */
export function formatStarCount(stars: number): string {
  if (!Number.isFinite(stars) || stars < 0) return '0';
  if (stars >= 1000) {
    return `${(Math.round(stars / 100) / 10).toFixed(1)}k`;
  }
  return String(Math.round(stars));
}
