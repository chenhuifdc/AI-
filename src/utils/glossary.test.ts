import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_GLOSSARY_DICTIONARY, GLOSSARY_ENTRIES } from '../data/glossaryData';
import {
  computeTooltipAnchorPosition,
  filterGlossaryTerms,
  findGlossaryMatchesWithOffsets,
  isPointInsideRect,
  isSkippableGlossaryTag,
  lookupGlossaryEntry,
  tokenizeGlossaryText,
} from './glossary';

test('tokenizeGlossaryText matches longest multi-word terms first and skips URLs', () => {
  const segments = tokenizeGlossaryText(
    '使用 Docker Compose 启动本地 Dify，并访问 https://github.com/docker/compose 查看 README。'
  );
  const terms = segments.filter((s) => s.type === 'term');
  assert.deepEqual(
    terms.map((t) => t.content),
    ['Docker Compose', 'Dify', 'README']
  );
  assert.equal(terms[0].entry?.shortCn, '多容器一键编排文件');
  // URL remains untouched plain text
  const fullReconstructed = segments.map((s) => s.content).join('');
  assert.equal(
    fullReconstructed,
    '使用 Docker Compose 启动本地 Dify，并访问 https://github.com/docker/compose 查看 README。'
  );
});

test('tokenizeGlossaryText suppresses redundant inline notes when already wrapped in parentheses or repeated', () => {
  const segments = tokenizeGlossaryText(
    '指令注入（Prompt Injection）会被 WAF 拦截，再次提到 WAF 时不重复展开括号。'
  );
  const terms = segments.filter((s) => s.type === 'term');
  assert.equal(terms.length, 3);
  // Prompt Injection is already inside Chinese parentheses after 中文
  assert.equal(terms[0].content, 'Prompt Injection');
  assert.equal(terms[0].suppressInlineGloss, true);
  // First WAF shows inline gloss
  assert.equal(terms[1].content, 'WAF');
  assert.equal(terms[1].suppressInlineGloss, false);
  // Second WAF in same block suppresses duplicate inline gloss
  assert.equal(terms[2].content, 'WAF');
  assert.equal(terms[2].suppressInlineGloss, true);
});

test('filterGlossaryTerms filters cleanly by category and Chinese/English query', () => {
  const securityOnly = filterGlossaryTerms(GLOSSARY_ENTRIES, '网络安全与攻防', '');
  assert.ok(securityOnly.length > 20);
  assert.ok(securityOnly.every((e) => e.category === '网络安全与攻防'));

  const mcpSearch = filterGlossaryTerms(GLOSSARY_ENTRIES, 'ALL', 'mcp');
  assert.ok(mcpSearch.some((e) => e.term === 'Model Context Protocol'));

  const cnSearch = filterGlossaryTerms(GLOSSARY_ENTRIES, 'ALL', '防火墙');
  assert.ok(cnSearch.some((e) => e.term === 'WAF'));

  assert.equal(lookupGlossaryEntry('MCP')?.shortCn, '模型上下文协议');
  assert.equal(AI_GLOSSARY_DICTIONARY['Model Context Protocol']?.shortCn, '模型上下文协议');
  assert.equal(AI_GLOSSARY_DICTIONARY['Prompt Injection']?.shortCn, '提示词/指令注入');
  assert.equal(AI_GLOSSARY_DICTIONARY['Penetration Testing']?.shortCn, '渗透测试');
  assert.equal(lookupGlossaryEntry('Pentest')?.term, 'Penetration Testing');
});

test('findGlossaryMatchesWithOffsets returns accurate UTF-16 ranges for global DOM decoration', () => {
  const sample =
    '了解 Model Context Protocol、Prompt Injection 与 Penetration Testing 的防御机制。';
  const hits = findGlossaryMatchesWithOffsets(sample);
  assert.deepEqual(
    hits.map((h) => ({
      text: sample.slice(h.start, h.end),
      term: h.entry.term,
    })),
    [
      { text: 'Model Context Protocol', term: 'Model Context Protocol' },
      { text: 'Prompt Injection', term: 'Prompt Injection' },
      { text: 'Penetration Testing', term: 'Penetration Testing' },
    ]
  );
});

test('isSkippableGlossaryTag, isPointInsideRect, and computeTooltipAnchorPosition behave deterministically', () => {
  assert.equal(isSkippableGlossaryTag('pre'), true);
  assert.equal(isSkippableGlossaryTag('code'), true);
  assert.equal(isSkippableGlossaryTag('input'), true);
  assert.equal(isSkippableGlossaryTag('svg'), true);
  assert.equal(isSkippableGlossaryTag('p'), false);
  assert.equal(isSkippableGlossaryTag('span'), false);

  const box = { left: 100, right: 160, top: 200, bottom: 220, width: 60, height: 20 };
  assert.equal(isPointInsideRect(130, 210, box), true);
  assert.equal(isPointInsideRect(99, 210, box, 2), true);
  assert.equal(isPointInsideRect(50, 210, box, 2), false);

  // Near left edge should clamp left >= 12
  const nearLeft = computeTooltipAnchorPosition(
    { left: 4, right: 40, top: 200, bottom: 220, width: 36, height: 20 },
    390,
    844,
    280
  );
  assert.equal(nearLeft.left, 12);
  assert.equal(nearLeft.placement, 'top');

  // Near top edge should flip below anchor
  const nearTop = computeTooltipAnchorPosition(
    { left: 200, right: 260, top: 40, bottom: 60, width: 60, height: 20 },
    1440,
    900,
    280
  );
  assert.equal(nearTop.placement, 'bottom');
  assert.equal(nearTop.top, 68);
});
