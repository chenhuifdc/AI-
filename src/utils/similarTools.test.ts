import test from 'node:test';
import assert from 'node:assert/strict';
import type { ToolNote } from '../types/learning';
import {
  getLatestCompletedTool,
  isRetryableGeminiError,
  isValidGithubRepoSlug,
  normalizeSimilarRecommendations,
  validateSimilarToolsRequest,
} from './similarTools';

test('getLatestCompletedTool returns null when no tools are completed', () => {
  const notes: ToolNote[] = [
    {
      id: '1',
      name: 'markitdown',
      platform: 'GitHub',
      method: 'Agent 改造封装',
      lifeScenario: '文档转 Markdown',
      status: '待尝试',
      createdAt: '2026-11-17',
    },
  ];
  assert.equal(getLatestCompletedTool(notes), null);
});

test('getLatestCompletedTool prefers completedAt timestamp over older createdAt', () => {
  const notes: ToolNote[] = [
    {
      id: 'seed-1',
      name: 'Stirling-PDF',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: 'PDF 合并与 OCR',
      status: '已跑通',
      createdAt: '2026-11-12',
    },
    {
      id: 'seed-2',
      name: 'microsoft/markitdown',
      platform: 'GitHub',
      method: 'Agent 改造封装',
      lifeScenario: '文档转换',
      status: '已跑通',
      createdAt: '2026-11-10',
      completedAt: 1795044500000,
    },
  ];
  const latest = getLatestCompletedTool(notes);
  assert.equal(latest?.name, 'microsoft/markitdown');
});

test('getLatestCompletedTool falls back to latest createdAt date when completedAt is absent', () => {
  const notes: ToolNote[] = [
    {
      id: 'a',
      name: 'Stirling-PDF',
      platform: 'GitHub',
      method: 'Docker 部署',
      lifeScenario: 'PDF 处理',
      status: '已跑通',
      createdAt: '2026-11-12',
    },
    {
      id: 'b',
      name: 'unclecode/crawl4ai',
      platform: 'GitHub',
      method: 'Dify 接口接入',
      lifeScenario: '网页抓取',
      status: '已跑通',
      createdAt: '2026-11-20',
    },
  ];
  const latest = getLatestCompletedTool(notes);
  assert.equal(latest?.name, 'unclecode/crawl4ai');
});

test('validateSimilarToolsRequest rejects missing toolName and sanitizes valid input', () => {
  const invalid = validateSimilarToolsRequest({ toolName: ' ' });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.error);

  const valid = validateSimilarToolsRequest({
    toolName: '  Stirling-PDF \n',
    platform: 'GitHub',
    method: 'Docker 部署',
    lifeScenario: '发票 PDF 识别与归档',
    excludeNames: ['Stirling-PDF', 'microsoft/markitdown'],
    forceRefresh: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.toolName, 'Stirling-PDF');
  assert.equal(valid.forceRefresh, true);
  assert.deepEqual(valid.excludeNames, ['Stirling-PDF', 'microsoft/markitdown']);
});

test('isValidGithubRepoSlug blocks traversal and non-slug strings', () => {
  assert.equal(isValidGithubRepoSlug('paperless-ngx/paperless-ngx'), true);
  assert.equal(isValidGithubRepoSlug('VikParuchuri/marker'), true);
  assert.equal(isValidGithubRepoSlug('../etc/passwd'), false);
  assert.equal(isValidGithubRepoSlug('https://github.com/a/b'), false);
  assert.equal(isValidGithubRepoSlug('onlyname'), false);
  assert.equal(isValidGithubRepoSlug('owner/repo?foo=bar'), false);
});

test('normalizeSimilarRecommendations deduplicates, filters unsafe URLs/base tool, and caps at 3', () => {
  const normalized = normalizeSimilarRecommendations(
    [
      {
        fullName: 'Stirling-Tools/Stirling-PDF',
        htmlUrl: 'https://github.com/Stirling-Tools/Stirling-PDF',
        estimatedStars: 50000,
        language: 'Java',
        recommendedMethod: 'Docker 部署',
        similarityReason: '就是它自己',
      },
      {
        fullName: 'paperless-ngx/paperless-ngx',
        htmlUrl: 'javascript:alert(1)',
        estimatedStars: 25000,
        language: 'Python',
        recommendedMethod: 'Docker 部署',
        similarityReason: '支持家庭账单与 PDF 自动化 OCR 归档管理',
      },
      {
        fullName: 'VikParuchuri/marker',
        htmlUrl: 'https://github.com/VikParuchuri/marker',
        estimatedStars: 22000,
        language: 'Python',
        recommendedMethod: 'Dify 接口接入',
        similarityReason: '高精度把 PDF 转换成 Markdown 喂给 Dify 知识库',
      },
      {
        fullName: 'paperless-ngx/paperless-ngx',
        htmlUrl: 'https://github.com/paperless-ngx/paperless-ngx',
        estimatedStars: 25000,
        language: 'Python',
        recommendedMethod: 'Docker 部署',
        similarityReason: '重复项应被去重',
      },
      {
        fullName: 'opendatalab/MinerU',
        htmlUrl: 'https://github.com/opendatalab/MinerU',
        estimatedStars: 30000,
        language: 'Python',
        recommendedMethod: 'Docker 部署',
        similarityReason: '专为复杂中文文档与发票表格设计的开源 PDF 解析器',
      },
      {
        fullName: 'extra/fourth-repo',
        htmlUrl: 'https://github.com/extra/fourth-repo',
        estimatedStars: 10000,
        language: 'TypeScript',
        recommendedMethod: 'Agent 改造封装',
        similarityReason: '第四个项目不应被返回',
      },
    ],
    'Stirling-PDF',
    ['microsoft/markitdown'],
    '家庭发票与 PDF 自动整理'
  );

  assert.equal(normalized.length, 3);
  assert.deepEqual(
    normalized.map((item) => item.fullName),
    ['paperless-ngx/paperless-ngx', 'VikParuchuri/marker', 'opendatalab/MinerU']
  );
  // Unsafe javascript: URL was replaced with canonical safe https://github.com/ URL
  assert.equal(normalized[0].htmlUrl, 'https://github.com/paperless-ngx/paperless-ngx');
  assert.ok(normalized[1].agentPrompt.includes('VikParuchuri/marker'));
});

test('isRetryableGeminiError classifies 504 DEADLINE_EXCEEDED as retryable and auth errors as non-retryable', () => {
  const deadlineErr = new Error(
    '{"error":{"code":504,"message":"Deadline expired before operation could complete.","status":"DEADLINE_EXCEEDED"}}'
  );
  assert.equal(isRetryableGeminiError(deadlineErr), true);
  assert.equal(isRetryableGeminiError(new Error('503 Service Unavailable')), true);
  assert.equal(isRetryableGeminiError(new Error('403 PERMISSION_DENIED')), false);
  assert.equal(isRetryableGeminiError(new Error('400 API_KEY_INVALID')), false);
});
