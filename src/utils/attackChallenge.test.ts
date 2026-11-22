import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTACK_CHALLENGE_SCENARIOS } from '../data/attackChallengeData';
import {
  evaluateChallengeDefense,
  getChallengeScenarioById,
  summarizeChallengeProgress,
} from './attackChallenge';

test('all 4 attack challenge scenarios are structurally valid with 5 nodes and 2 slots', () => {
  assert.equal(ATTACK_CHALLENGE_SCENARIOS.length, 4);
  for (const scenario of ATTACK_CHALLENGE_SCENARIOS) {
    assert.equal(scenario.nodes.length, 5, `${scenario.id} should have 5 nodes`);
    assert.equal(scenario.edges.length, 4, `${scenario.id} should have 4 edges`);
    assert.equal(scenario.slots.length, 2, `${scenario.id} should have 2 vulnerability slots`);
    assert.ok(scenario.defenseOptions.length >= 5, `${scenario.id} should have rich defense options`);
    for (const slot of scenario.slots) {
      assert.ok(
        scenario.nodes.some((n) => n.id === slot.nodeId && n.slotId === slot.id),
        `slot ${slot.id} must link to an architecture node`
      );
    }
  }
});

test('Prompt Injection challenge evaluates empty, distractor, single-layer, and dual-layer defenses accurately', () => {
  const scenario = getChallengeScenarioById(ATTACK_CHALLENGE_SCENARIOS, 'prompt-injection');

  // 1. Empty defense -> breached
  const emptyRes = evaluateChallengeDefense(scenario, {});
  assert.equal(emptyRes.outcome, 'breached');
  assert.equal(emptyRes.score, 0);
  assert.equal(emptyRes.blockedAtSlotIndex, null);
  assert.equal(emptyRes.nodeStatuses['pi-n5'], 'compromised');

  // 2. Distractor defense -> breached with score 10
  const wrongRes = evaluateChallengeDefense(scenario, {
    'pi-slot-input': 'pi-def-keyword',
    'pi-slot-tool': 'pi-def-ratelimit',
  });
  assert.equal(wrongRes.outcome, 'breached');
  assert.equal(wrongRes.score, 10);
  assert.equal(wrongRes.slotResults[0].status, 'bypassed');
  assert.equal(wrongRes.slotResults[1].status, 'bypassed');

  // 3. Partial weak mitigation only -> partial
  const partialRes = evaluateChallengeDefense(scenario, {
    'pi-slot-input': 'pi-def-prompt-warn',
    'pi-slot-tool': 'pi-def-dlp',
  });
  assert.equal(partialRes.outcome, 'partial');
  assert.equal(partialRes.score, 50);
  assert.equal(partialRes.nodeStatuses['pi-n5'], 'compromised');

  // 4. Single optimal defense at slot 2 -> intercepted with score 75
  const singleOptimal = evaluateChallengeDefense(scenario, {
    'pi-slot-input': null,
    'pi-slot-tool': 'pi-def-tool-fw',
  });
  assert.equal(singleOptimal.outcome, 'intercepted');
  assert.equal(singleOptimal.score, 75);
  assert.equal(singleOptimal.blockedAtSlotIndex, 1);
  assert.equal(singleOptimal.nodeStatuses['pi-n4'], 'blocked-here');
  assert.equal(singleOptimal.nodeStatuses['pi-n5'], 'safe-protected');

  // 5. Dual optimal defense-in-depth -> 100 score, intercepted at slot 1
  const fullDefense = evaluateChallengeDefense(scenario, {
    'pi-slot-input': 'pi-def-split',
    'pi-slot-tool': 'pi-def-tool-fw',
  });
  assert.equal(fullDefense.outcome, 'intercepted');
  assert.equal(fullDefense.score, 100);
  assert.equal(fullDefense.blockedAtSlotIndex, 0);
  assert.equal(fullDefense.nodeStatuses['pi-n2'], 'blocked-here');
  assert.equal(fullDefense.nodeStatuses['pi-n3'], 'safe-protected');
  assert.equal(fullDefense.nodeStatuses['pi-n5'], 'safe-protected');
  assert.equal(fullDefense.traceSteps.length, 5);
});

test('LLM Data Poisoning challenge detects misplaced defenses and rewards provenance + trust rerank', () => {
  const scenario = getChallengeScenarioById(ATTACK_CHALLENGE_SCENARIOS, 'data-poisoning');

  // Swapped/misplaced optimal defenses should both fail (wrong layer!)
  const swapped = evaluateChallengeDefense(scenario, {
    'dp-slot-ingest': 'dp-def-trust-rerank',
    'dp-slot-rag': 'dp-def-provenance',
  });
  assert.equal(swapped.outcome, 'breached');
  assert.equal(swapped.slotResults[0].status, 'bypassed');
  assert.equal(swapped.slotResults[1].status, 'bypassed');

  // Correctly aligned defense-in-depth
  const aligned = evaluateChallengeDefense(scenario, {
    'dp-slot-ingest': 'dp-def-provenance',
    'dp-slot-rag': 'dp-def-trust-rerank',
  });
  assert.equal(aligned.outcome, 'intercepted');
  assert.equal(aligned.score, 100);
  assert.equal(aligned.nodeStatuses['dp-n5'], 'safe-protected');
});

test('MCP Tool Escalation and Memory Hijack scenarios reach 100 score with optimal defense pairs', () => {
  const mcpScenario = getChallengeScenarioById(ATTACK_CHALLENGE_SCENARIOS, 'mcp-tool-hijack');
  const mcpWin = evaluateChallengeDefense(mcpScenario, {
    'mcp-slot-schema': 'mcp-def-schema',
    'mcp-slot-sandbox': 'mcp-def-docker',
  });
  assert.equal(mcpWin.outcome, 'intercepted');
  assert.equal(mcpWin.score, 100);

  const memScenario = getChallengeScenarioById(ATTACK_CHALLENGE_SCENARIOS, 'memory-exfil');
  const memWin = evaluateChallengeDefense(memScenario, {
    'mem-slot-memory': 'mem-def-sanitize',
    'mem-slot-scope': 'mem-def-scope',
  });
  assert.equal(memWin.outcome, 'intercepted');
  assert.equal(memWin.score, 100);
});

test('summarizeChallengeProgress tracks unique valid cleared scenarios and computes percentage', () => {
  const validIds = ATTACK_CHALLENGE_SCENARIOS.map((s) => s.id);
  const start = summarizeChallengeProgress(['unknown-id'], validIds);
  assert.equal(start.clearedCount, 0);
  assert.equal(start.totalCount, 4);
  assert.equal(start.percent, 0);

  const mid = summarizeChallengeProgress(['prompt-injection', 'prompt-injection', 'data-poisoning'], validIds);
  assert.equal(mid.clearedCount, 2);
  assert.equal(mid.percent, 50);

  const done = summarizeChallengeProgress(validIds, validIds);
  assert.equal(done.clearedCount, 4);
  assert.equal(done.percent, 100);
  assert.ok(done.statusLabel.includes('全关通关'));
});
