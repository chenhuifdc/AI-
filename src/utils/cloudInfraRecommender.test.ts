import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCloudPlatforms } from './cloudInfraRecommender';

test('fullstack-backend profile ranks Render as primary and marks static hosts as limited', () => {
  const ranked = evaluateCloudPlatforms('fullstack-backend');
  assert.equal(ranked.length, 4);
  assert.equal(ranked[0].spec.id, 'render');
  assert.equal(ranked[0].tier, 'primary');
  const gh = ranked.find((r) => r.spec.id === 'github-pages');
  assert.equal(gh?.tier, 'limited');
});

test('modern-frontend profile ranks Vercel as primary and Cloudflare Pages as secondary', () => {
  const ranked = evaluateCloudPlatforms('modern-frontend');
  assert.equal(ranked[0].spec.id, 'vercel');
  assert.equal(ranked[0].tier, 'primary');
  const cf = ranked.find((r) => r.spec.id === 'cloudflare-pages');
  assert.equal(cf?.tier, 'secondary');
});

test('high-traffic-public profile ranks Cloudflare Pages as primary for unlimited bandwidth', () => {
  const ranked = evaluateCloudPlatforms('high-traffic-public');
  assert.equal(ranked[0].spec.id, 'cloudflare-pages');
  assert.equal(ranked[0].tier, 'primary');
  assert.ok(ranked[0].fitReason.includes('无限流量'));
});

test('static-portfolio profile recommends Cloudflare Pages and GitHub Pages as primary', () => {
  const ranked = evaluateCloudPlatforms('static-portfolio');
  const primaries = ranked.filter((r) => r.tier === 'primary').map((r) => r.spec.id);
  assert.ok(primaries.includes('cloudflare-pages'));
  assert.ok(primaries.includes('github-pages'));
});
