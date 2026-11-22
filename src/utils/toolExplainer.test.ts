import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAdminDataUpdate,
  isSafeHttpUrl,
  normalizeToolExplainerPayload,
  validateToolSearchQuery,
} from './toolExplainer';
import type { AdminSandboxData } from '../types/learning';

test('validateToolSearchQuery rejects blank and too-short input', () => {
  assert.equal(validateToolSearchQuery('   ').valid, false);
  assert.equal(validateToolSearchQuery('a').valid, false);
  const ok = validateToolSearchQuery('  Cloudflare   Workers  ');
  assert.equal(ok.valid, true);
  assert.equal(ok.query, 'Cloudflare Workers');
});

test('isSafeHttpUrl allows http/https and rejects javascript/file URIs', () => {
  assert.equal(isSafeHttpUrl('https://n8n.io/docs'), true);
  assert.equal(isSafeHttpUrl('http://example.com'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
});

test('normalizeToolExplainerPayload parses fenced JSON and filters unsafe sources', () => {
  const raw = `\`\`\`json
  {
    "toolName": "Supabase",
    "chineseSubtitle": "开源后端即服务与可视化数据库后台",
    "categoryLayer": "后端与数据库",
    "difficulty": "低代码可视化",
    "oneLineAnalogy": "开箱即用的云端数据库表格 + 登录系统",
    "plainDefinition": "把数据库、用户登录和 API 接口打包成网页后台。",
    "bestFor": "快速给零代码前端配一个真正能存数据的后端",
    "scenarioTitle": "个人书单网站实时同步收藏记录",
    "painBefore": "关掉网页收藏就丢失",
    "outcomeAfter": "手机和电脑登录同一账号随时同步",
    "steps": [
      { "nodeName": "前端网页", "role": "触发输入", "action": "点击收藏按钮", "sampleData": "bookId: 102" },
      { "nodeName": "Supabase API", "role": "核心处理", "action": "校验登录态并写入 PostgreSQL", "sampleData": "INSERT INTO favorites" },
      { "nodeName": "所有设备前端", "role": "最终输出", "action": "拉取最新书单列表", "sampleData": "200 OK · 12 本书" }
    ],
    "relatedTools": ["Directus", "Firebase", "Supabase"]
  }
  \`\`\``;

  const result = normalizeToolExplainerPayload(raw, 'Supabase', [
    { title: 'Supabase Docs', url: 'https://supabase.com/docs' },
    { title: 'Bad Link', url: 'javascript:void(0)' },
    { title: 'Duplicate', url: 'https://supabase.com/docs' },
  ]);

  assert.ok(result);
  assert.equal(result.toolName, 'Supabase');
  assert.equal(result.steps.length, 3);
  assert.equal(result.steps[0].stepNumber, 1);
  assert.deepEqual(result.relatedTools, ['Directus', 'Firebase']);
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].url, 'https://supabase.com/docs');
  assert.equal(result.grounded, true);
});

test('applyAdminDataUpdate validates required title and records changed fields', () => {
  const prev: AdminSandboxData = {
    presetId: 'cafe',
    siteTitle: '街角手冲咖啡馆',
    announcement: '新品燕麦拿铁第二杯半价',
    promoEnabled: true,
    accentTheme: 'amber',
    items: [
      { id: 'c1', name: '冰美式', price: 18, tag: '招牌', inStock: true },
      { id: 'c2', name: '桂花拿铁', price: 26, tag: '热销', inStock: true },
    ],
  };

  const invalidRes = applyAdminDataUpdate(
    prev,
    { ...prev, siteTitle: '   ' },
    1,
    '14:05:00'
  );
  assert.equal(invalidRes.valid, false);
  assert.equal(invalidRes.nextState.siteTitle, '街角手冲咖啡馆');

  const validRes = applyAdminDataUpdate(
    prev,
    {
      ...prev,
      siteTitle: '街角精品咖啡馆',
      promoEnabled: false,
      items: [
        { id: 'c1', name: '冰美式', price: 15, tag: '招牌', inStock: true },
        { id: 'c2', name: '桂花拿铁', price: 26, tag: '热销', inStock: false },
      ],
    },
    2,
    '14:06:12'
  );

  assert.equal(validRes.valid, true);
  assert.ok(validRes.trace);
  assert.equal(validRes.nextState.items[0].price, 15);
  assert.equal(validRes.nextState.items[1].inStock, false);
  assert.ok(validRes.trace.changedFields.includes('站点标题'));
  assert.ok(validRes.trace.changedFields.includes('关闭活动横幅'));
  assert.ok(validRes.trace.changedFields.some((f) => f.includes('冰美式 价格改为 ¥15')));
  assert.ok(validRes.trace.changedFields.some((f) => f.includes('桂花拿铁 设为售罄下架')));
  assert.ok(validRes.trace.payloadJson.includes('"status": "SOLD_OUT"'));
});
