import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateModelFit,
  computeMasteryProgress,
  diagnoseReusePath,
  filterToolNotes,
  validateToolNoteInput,
} from './learningEngine';
import type { ToolNote } from '../types/learning';

test('calculateModelFit fits 8B smoothly on 16GB Q4_K_M and routes 70B to OpenRouter cloud', () => {
  const results = calculateModelFit(16, 'Q4_K_M');
  assert.equal(results.length, 5);

  const model8B = results.find((item) => item.paramLabel.includes('8B'));
  const model70B = results.find((item) => item.paramLabel.includes('70B'));
  assert.ok(model8B, '8B model should exist');
  assert.ok(model70B, '70B model should exist');
  assert.equal(model8B.fitStatus, 'smooth');
  assert.equal(model70B.fitStatus, 'cloud');
  assert.ok(model70B.statusText.includes('OpenRouter'));
});

test('calculateModelFit increases VRAM requirement for FP16 compared to Q4_K_M', () => {
  const q4 = calculateModelFit(32, 'Q4_K_M');
  const fp16 = calculateModelFit(32, 'FP16');
  assert.ok(fp16[2].estimatedVramGb > q4[2].estimatedVramGb);
  assert.equal(q4[2].fitStatus, 'smooth');
  assert.equal(fp16[2].fitStatus, 'cloud');
});

test('diagnoseReusePath maps local-only docs to private-health-rag and adapts model size to hardware', () => {
  const laptopResult = diagnoseReusePath({
    domain: 'docs',
    privacy: 'local-only',
    hardware: 'laptop-16',
  });
  assert.equal(laptopResult.recommendedCaseId, 'private-health-rag');
  assert.ok(laptopResult.computeRoute.includes('qwen2.5:7b'));
  assert.ok(laptopResult.agentPrompt.length > 20);

  const workstationResult = diagnoseReusePath({
    domain: 'docs',
    privacy: 'local-only',
    hardware: 'workstation-32',
  });
  assert.ok(workstationResult.computeRoute.includes('qwen2.5:14b'));
});

test('diagnoseReusePath routes custom-app to agent-gui-wrapper case', () => {
  const result = diagnoseReusePath({
    domain: 'custom-app',
    privacy: 'cloud-fast',
    hardware: 'laptop-16',
  });
  assert.equal(result.recommendedCaseId, 'agent-gui-wrapper');
  assert.ok(result.strategyTitle.includes('智能体'));
});

test('computeMasteryProgress computes accurate percentage and stage progression', () => {
  const start = computeMasteryProgress([], [], 5, 12);
  assert.equal(start.overallPercent, 0);
  assert.ok(start.currentStageLabel.includes('起步'));

  const mid = computeMasteryProgress(['c1', 'c2', 'c3'], ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 5, 12);
  assert.equal(mid.overallPercent, 59);
  assert.ok(mid.currentStageLabel.includes('进阶'));

  const done = computeMasteryProgress(['1', '2', '3', '4', '5'], Array.from({ length: 12 }, (_, i) => String(i)), 5, 12);
  assert.equal(done.overallPercent, 100);
  assert.ok(done.currentStageLabel.includes('架构师'));
});

test('validateToolNoteInput rejects blank inputs and accepts valid tool drafts', () => {
  assert.equal(
    validateToolNoteInput({
      name: ' ',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: '整理账单',
    }).valid,
    false
  );

  assert.equal(
    validateToolNoteInput({
      name: 'Crawl4AI',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: '短',
    }).valid,
    false
  );

  assert.equal(
    validateToolNoteInput({
      name: 'Crawl4AI',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: '每周自动抓取开源动态并汇总进 Dify',
    }).valid,
    true
  );
});

test('filterToolNotes filters accurately by platform and search query', () => {
  const notes: ToolNote[] = [
    {
      id: '1',
      name: 'Stirling-PDF',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: '家庭发票合并与文字识别',
      status: '已跑通',
      createdAt: '2026-11-10',
    },
    {
      id: '2',
      name: 'Qwen2.5-14B-GGUF',
      platform: 'Hugging Face',
      method: 'Ollama 本地拉取',
      lifeScenario: '离线体检报告分析',
      status: '待尝试',
      createdAt: '2026-11-12',
    },
  ];

  assert.equal(filterToolNotes(notes, 'GitHub', '').length, 1);
  assert.equal(filterToolNotes(notes, 'Hugging Face', '体检').length, 1);
  assert.equal(filterToolNotes(notes, 'ALL', '不存在的词').length, 0);
});
