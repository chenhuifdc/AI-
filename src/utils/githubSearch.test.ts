import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAgentPromptForRepo,
  buildGithubSearchQuery,
  formatStarCount,
  inferReuseMethodFromRepo,
  isSafeGithubUrl,
  validateScenarioQuery,
} from './githubSearch';

test('validateScenarioQuery rejects empty/too-short input and strips control chars', () => {
  assert.equal(validateScenarioQuery('   ').valid, false);
  assert.equal(validateScenarioQuery('a').valid, false);

  const ok = validateScenarioQuery('  PDF自动总结\n ');
  assert.equal(ok.valid, true);
  assert.equal(ok.cleaned, 'PDF自动总结');
});

test('buildGithubSearchQuery translates Chinese life scenarios into focused GitHub queries', () => {
  const pdfQuery = buildGithubSearchQuery('PDF自动总结', false);
  assert.ok(pdfQuery.includes('pdf'));
  assert.ok(pdfQuery.includes('stars:>300'));
  assert.ok(!pdfQuery.includes(' docker '));

  const crawlerDockerQuery = buildGithubSearchQuery('自动化爬虫', true);
  assert.ok(crawlerDockerQuery.includes('crawler'));
  assert.ok(crawlerDockerQuery.includes('docker'));
});

test('inferReuseMethodFromRepo identifies Docker, Dify API, Ollama, and Agent wrapper methods', () => {
  assert.equal(
    inferReuseMethodFromRepo({
      name: 'Stirling-PDF',
      description: 'Locally hosted self-hosted web application for PDF operations using Docker',
      topics: ['docker', 'pdf'],
    }),
    'Docker 部署'
  );

  assert.equal(
    inferReuseMethodFromRepo({
      name: 'crawl4ai',
      description: 'LLM friendly web crawler and scraper API',
      topics: ['crawler', 'api'],
    }),
    'Dify 接口接入'
  );

  assert.equal(
    inferReuseMethodFromRepo({
      name: 'markitdown',
      description: 'Utility for converting office files to Markdown',
      topics: ['markdown', 'cli'],
    }),
    'Agent 改造封装'
  );
});

test('isSafeGithubUrl only allows https://github.com links', () => {
  assert.equal(isSafeGithubUrl('https://github.com/Stirling-Tools/Stirling-PDF'), true);
  assert.equal(isSafeGithubUrl('javascript:alert(1)'), false);
  assert.equal(isSafeGithubUrl('http://github.com/test/repo'), false);
  assert.equal(isSafeGithubUrl('https://evil.example.com/github.com/repo'), false);
});

test('formatStarCount formats small and large star counts cleanly', () => {
  assert.equal(formatStarCount(850), '850');
  assert.equal(formatStarCount(1450), '1.5k');
  assert.equal(formatStarCount(52430), '52.4k');
});

test('buildAgentPromptForRepo includes repo name, URL, scenario, and reuse method', () => {
  const prompt = buildAgentPromptForRepo(
    'unclecode/crawl4ai',
    'https://github.com/unclecode/crawl4ai',
    '自动化爬虫',
    'Docker 部署'
  );
  assert.ok(prompt.includes('unclecode/crawl4ai'));
  assert.ok(prompt.includes('自动化爬虫'));
  assert.ok(prompt.includes('Docker 部署'));
});
