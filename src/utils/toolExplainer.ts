import type {
  AdminSandboxData,
  AdminSyncTrace,
  ToolExplainerFlowStep,
  ToolExplainerResult,
  ToolExplainerSource,
} from '../types/learning';

export function validateToolSearchQuery(rawQuery: string): {
  valid: boolean;
  query: string;
  error?: string;
} {
  const query = rawQuery.trim().replace(/\s+/g, ' ');
  if (!query) {
    return {
      valid: false,
      query: '',
      error: '请输入你想了解的工具名称或技术名词，例如 Cloudflare、Supabase、n8n 或 Strapi。',
    };
  }
  if (query.length < 2) {
    return {
      valid: false,
      query,
      error: '关键词太短了，请输入至少 2 个字符的工具名或概念。',
    };
  }
  if (query.length > 80) {
    return {
      valid: false,
      query: query.slice(0, 80),
      error: '请将查询控制在 80 字以内，聚焦 1 个具体工具或技术概念。',
    };
  }
  return { valid: true, query };
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractJsonObjectFromText(rawText: string): Record<string, unknown> | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function readCleanString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

export function normalizeToolExplainerPayload(
  rawText: string,
  query: string,
  rawSources: Array<{ title?: string; url?: string }> = []
): ToolExplainerResult | null {
  const parsed = extractJsonObjectFromText(rawText);
  if (!parsed) return null;

  const toolName = readCleanString(parsed.toolName, query);
  const chineseSubtitle = readCleanString(parsed.chineseSubtitle, '现代 AI / Web 效率工具');
  const categoryLayer = readCleanString(parsed.categoryLayer, '效率与编排工具');
  const difficulty = readCleanString(parsed.difficulty, '低代码可视化配置');
  const oneLineAnalogy = readCleanString(
    parsed.oneLineAnalogy,
    `${toolName} 就像帮你把繁琐重复操作自动串起来的数字化助手。`
  );
  const plainDefinition = readCleanString(
    parsed.plainDefinition,
    `${toolName} 用于降低开发与自动化门槛，帮助个人或团队快速搭建稳定可用的业务流程。`
  );
  const bestFor = readCleanString(
    parsed.bestFor,
    '适合希望少写重复代码、快速串联多平台数据或服务的个人与团队。'
  );
  const scenarioTitle = readCleanString(parsed.scenarioTitle, `${toolName} 真实落地场景示例`);
  const painBefore = readCleanString(
    parsed.painBefore,
    '需要人工跨多个网页来回复制粘贴，耗时长且容易漏掉关键步骤。'
  );
  const outcomeAfter = readCleanString(
    parsed.outcomeAfter,
    '流程全自动运行，结果实时同步并可直接复用。'
  );

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
  const steps: ToolExplainerFlowStep[] = rawSteps
    .slice(0, 4)
    .map((item, idx) => {
      const rec =
        item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        stepNumber: idx + 1,
        nodeName: readCleanString(rec.nodeName, `步骤 ${idx + 1}`),
        role: readCleanString(rec.role, idx === 0 ? '触发输入' : idx === rawSteps.length - 1 ? '最终输出' : '核心处理'),
        action: readCleanString(rec.action, '接收上一步数据并执行对应处理动作。'),
        sampleData: readCleanString(rec.sampleData, '结构化数据流转中'),
      };
    })
    .filter((s) => s.nodeName.length > 0);

  if (steps.length < 2) {
    return null;
  }

  const relatedTools = Array.isArray(parsed.relatedTools)
    ? Array.from(
        new Set(
          parsed.relatedTools
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0 && item.toLowerCase() !== toolName.toLowerCase())
        )
      ).slice(0, 4)
    : [];

  const seenUrls = new Set<string>();
  const sources: ToolExplainerSource[] = [];
  for (const src of rawSources) {
    const url = typeof src.url === 'string' ? src.url.trim() : '';
    if (!url || !isSafeHttpUrl(url) || seenUrls.has(url)) continue;
    seenUrls.add(url);
    sources.push({
      title: readCleanString(src.title, new URL(url).hostname),
      url,
    });
    if (sources.length >= 5) break;
  }

  return {
    query,
    toolName,
    chineseSubtitle,
    categoryLayer,
    difficulty,
    oneLineAnalogy,
    plainDefinition,
    bestFor,
    scenarioTitle,
    painBefore,
    outcomeAfter,
    steps,
    relatedTools,
    sources,
    grounded: sources.length > 0,
  };
}

export function applyAdminDataUpdate(
  previous: AdminSandboxData,
  draft: AdminSandboxData,
  syncId: number,
  timestampLabel: string
): {
  valid: boolean;
  error?: string;
  nextState: AdminSandboxData;
  trace?: AdminSyncTrace;
} {
  const cleanTitle = draft.siteTitle.trim();
  const cleanAnnouncement = draft.announcement.trim();

  if (!cleanTitle) {
    return {
      valid: false,
      error: '站点名称不能为空，请输入至少 1 个字后再同步到前端。',
      nextState: previous,
    };
  }

  const sanitizedItems = draft.items.map((item) => ({
    ...item,
    name: item.name.trim() || '未命名条目',
    price: Number.isFinite(item.price) ? Math.max(0, Math.round(item.price)) : 0,
    tag: item.tag.trim() || '常规',
  }));

  const nextState: AdminSandboxData = {
    ...draft,
    siteTitle: cleanTitle,
    announcement: cleanAnnouncement,
    items: sanitizedItems,
  };

  const changedFields: string[] = [];
  if (previous.siteTitle !== nextState.siteTitle) changedFields.push('站点标题');
  if (previous.announcement !== nextState.announcement) changedFields.push('顶部公告内容');
  if (previous.promoEnabled !== nextState.promoEnabled) {
    changedFields.push(nextState.promoEnabled ? '开启活动横幅' : '关闭活动横幅');
  }
  if (previous.accentTheme !== nextState.accentTheme) changedFields.push('前端品牌主色');

  for (let i = 0; i < nextState.items.length; i += 1) {
    const prevItem = previous.items[i];
    const currItem = nextState.items[i];
    if (!prevItem || !currItem) continue;
    if (prevItem.price !== currItem.price) {
      changedFields.push(`${currItem.name} 价格改为 ¥${currItem.price}`);
    }
    if (prevItem.inStock !== currItem.inStock) {
      changedFields.push(`${currItem.name} ${currItem.inStock ? '重新上架' : '设为售罄下架'}`);
    }
    if (prevItem.name !== currItem.name) {
      changedFields.push(`商品更名为「${currItem.name}」`);
    }
  }

  const effectiveChanges =
    changedFields.length > 0 ? changedFields : ['重新发布当前完整配置快照'];

  const publicApiPayload = {
    siteTitle: nextState.siteTitle,
    announcement: nextState.promoEnabled ? nextState.announcement : null,
    theme: nextState.accentTheme,
    publishedItems: nextState.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      tag: item.tag,
      status: item.inStock ? 'ON_SALE' : 'SOLD_OUT',
    })),
    updatedAt: timestampLabel,
  };

  const trace: AdminSyncTrace = {
    syncId,
    timestamp: timestampLabel,
    endpoint: 'PUT /api/admin/site-config → GET /api/public/storefront',
    changedFields: effectiveChanges,
    requestSummary: `后台管理站将 ${effectiveChanges.length} 项改动写入数据库，无需重新打包或修改前端代码`,
    frontendEffect: `前端页面拉取最新 JSON 后立即重绘：${effectiveChanges.join('、')}`,
    payloadJson: JSON.stringify(publicApiPayload, null, 2),
  };

  return {
    valid: true,
    nextState,
    trace,
  };
}
