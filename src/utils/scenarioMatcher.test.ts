import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSearchTokens, matchLifeScenarioTools } from './scenarioMatcher';

test('extractSearchTokens splits Chinese phrases into bigrams and preserves ASCII tool names', () => {
  const tokens = extractSearchTokens('每天自动监控股票 Node-RED');
  assert.ok(tokens.includes('监控'));
  assert.ok(tokens.includes('股票'));
  assert.ok(tokens.includes('node-red'));
});

test('empty query returns featured default view with curated scenario blueprints', () => {
  const res = matchLifeScenarioTools('   ');
  assert.equal(res.isDefaultView, true);
  assert.equal(res.normalizedQuery, '');
  assert.ok(res.matches.length >= 4);
  assert.ok(res.matches.some((m) => m.entry.toolName === 'n8n'));
  assert.ok(res.matches.some((m) => m.entry.toolName === 'Node-RED'));
});

test('querying "整理文档" prioritizes document-organization open-source tools with 4-step diagrams', () => {
  const res = matchLifeScenarioTools('整理文档');
  assert.equal(res.isDefaultView, false);
  assert.ok(res.matches.length >= 2);
  const topTools = res.matches.slice(0, 3).map((m) => m.entry.toolName);
  assert.ok(topTools.includes('n8n'));
  assert.ok(topTools.includes('Windmill') || topTools.includes('Stirling-PDF'));
  assert.equal(res.matches[0].entry.diagramNodes.length, 4);
  assert.equal(res.matches[0].entry.dataFlowLabels.length, 3);
});

test('querying "监控股票" recommends n8n and Node-RED stock monitoring schematics', () => {
  const res = matchLifeScenarioTools('监控股票');
  assert.equal(res.isDefaultView, false);
  assert.ok(res.matches.length >= 2);
  const names = res.matches.map((m) => m.entry.toolName);
  assert.ok(names.includes('n8n'));
  assert.ok(names.includes('Node-RED'));
  assert.ok(res.matches[0].entry.scenarioTitle.includes('监控股票'));
});

test('natural language sentence still matches accurately', () => {
  const res = matchLifeScenarioTools('我想在家里用传感器控制空调除湿');
  assert.equal(res.isDefaultView, false);
  assert.ok(res.matches.length >= 1);
  assert.equal(res.matches[0].entry.toolName, 'Node-RED');
});

test('unmatched gibberish query returns honest empty list without fabricating matches', () => {
  const res = matchLifeScenarioTools('xyz999未知火星量子任务');
  assert.equal(res.isDefaultView, false);
  assert.equal(res.matches.length, 0);
});
