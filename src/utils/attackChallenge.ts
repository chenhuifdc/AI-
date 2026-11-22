import type {
  AttackChallengeId,
  AttackChallengeScenario,
  ChallengeEvaluationResult,
  ChallengeNodeVisualStatus,
  ChallengeTraceStep,
  SlotEvalStatus,
  SlotEvaluationDetail,
} from '../types/learning';

/**
 * Finds a challenge scenario by its ID with safe fallback to the first scenario.
 */
export function getChallengeScenarioById(
  scenarios: AttackChallengeScenario[],
  id: AttackChallengeId
): AttackChallengeScenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0];
}

/**
 * Evaluates the user's equipped defense components across a scenario's vulnerability slots
 * and produces a deterministic, educational attack-trace simulation result.
 */
export function evaluateChallengeDefense(
  scenario: AttackChallengeScenario,
  equippedBySlot: Record<string, string | null | undefined>
): ChallengeEvaluationResult {
  const optionMap = new Map(scenario.defenseOptions.map((opt) => [opt.id, opt]));

  const slotResults: SlotEvaluationDetail[] = scenario.slots.map((slot) => {
    const equippedId = equippedBySlot[slot.id] ?? null;
    const option = equippedId ? optionMap.get(equippedId) ?? null : null;

    if (!option) {
      return {
        slotId: slot.id,
        slotLabel: slot.label,
        nodeId: slot.nodeId,
        componentId: null,
        componentName: null,
        status: 'empty',
        explanation: `未在「${slot.layerName}」部署防御组件，逻辑漏洞直接暴露：${slot.vulnerabilityDetail}`,
      };
    }

    const eff = option.effectivenessBySlot[slot.id] ?? 'ineffective';
    const status: SlotEvalStatus =
      eff === 'optimal' ? 'blocked' : eff === 'partial' ? 'mitigated' : 'bypassed';

    return {
      slotId: slot.id,
      slotLabel: slot.label,
      nodeId: slot.nodeId,
      componentId: option.id,
      componentName: option.name,
      status,
      explanation:
        option.feedbackBySlot[slot.id] ??
        '该组件与当前漏洞层不匹配，未能阻断攻击链路。',
    };
  });

  const firstBlockedIdx = slotResults.findIndex((r) => r.status === 'blocked');
  const blockedCount = slotResults.filter((r) => r.status === 'blocked').length;
  const mitigatedCount = slotResults.filter((r) => r.status === 'mitigated').length;

  // Determine overall outcome & score (0..100)
  let outcome: ChallengeEvaluationResult['outcome'];
  let outcomeLabel: string;
  let score: number;
  let summary: string;

  if (blockedCount === scenario.slots.length && scenario.slots.length > 0) {
    outcome = 'intercepted';
    outcomeLabel = '完全拦截 · 纵深防御满分';
    score = 100;
    summary =
      '两道关键逻辑防线全部精准匹配！攻击载荷在源头即被识别拦截，且后端执行层仍有纵深护栏兜底，核心资产零风险。';
  } else if (blockedCount >= 1) {
    outcome = 'intercepted';
    outcomeLabel = '成功拦截 · 建议补全纵深防线';
    score = mitigatedCount >= 1 ? 85 : 75;
    summary =
      '攻击链路已在关键防线被成功阻断，目标资产未失守！为防止单点防线失效，建议同时补齐另一处卡槽形成双层纵深防御。';
  } else if (mitigatedCount >= 1) {
    outcome = 'partial';
    outcomeLabel = '部分缓解 · 仍有穿透风险';
    score = mitigatedCount >= 2 ? 50 : 35;
    summary =
      '所选措施仅起到弱缓解或事后记录作用，面对变体攻击或持续探测仍会被穿透并波及核心资产，请更换更具针对性的工程级防线。';
  } else {
    outcome = 'breached';
    outcomeLabel = '防线失守 · 漏洞已被利用';
    const hasAnyEquipped = slotResults.some((r) => r.componentId !== null);
    score = hasAnyEquipped ? 10 : 0;
    summary = hasAnyEquipped
      ? '当前所选防御组件与该架构的逻辑漏洞层不匹配，模拟攻击顺利穿透全部节点并触达核心目标，请参考下方逐跳复盘调整防线。'
      : '尚未为漏洞节点部署有效防御组件，模拟攻击畅通无阻地穿过整条链路并触发目标风险。';
  }

  // Compute node visual states and ordered trace steps
  const slotByNodeId = new Map(slotResults.map((res) => [res.nodeId, res]));
  const nodeStatuses: Record<string, ChallengeNodeVisualStatus> = {};
  const traceSteps: ChallengeTraceStep[] = [];

  let attackHalted = false;

  for (const node of scenario.nodes) {
    if (node.kind === 'source') {
      nodeStatuses[node.id] = 'source';
      traceSteps.push({
        nodeId: node.id,
        stepCode: node.stepCode,
        title: node.title,
        status: 'attack-entry',
        message: `攻击载荷注入起点：${scenario.simulatedPayloadPreview}`,
      });
      continue;
    }

    if (attackHalted) {
      nodeStatuses[node.id] = 'safe-protected';
      const slotRes = slotByNodeId.get(node.id);
      traceSteps.push({
        nodeId: node.id,
        stepCode: node.stepCode,
        title: node.title,
        status: 'protected',
        message:
          node.kind === 'target'
            ? '上游防线已成功截断攻击链，核心资产全程安全未受波及。'
            : slotRes && slotRes.status === 'blocked'
              ? `纵深防线就绪（${slotRes.componentName}）：即便上游被绕过，此层仍可独立兜底拦截。`
              : '攻击已在上游节点终止，未抵达此环节。',
      });
      continue;
    }

    if (node.kind === 'flaw-slot') {
      const slotRes = slotByNodeId.get(node.id);
      if (slotRes?.status === 'blocked') {
        nodeStatuses[node.id] = 'blocked-here';
        attackHalted = true;
        traceSteps.push({
          nodeId: node.id,
          stepCode: node.stepCode,
          title: `${node.title}（已部署：${slotRes.componentName}）`,
          status: 'blocked',
          message: slotRes.explanation,
        });
      } else if (slotRes?.status === 'mitigated') {
        nodeStatuses[node.id] = 'mitigated-here';
        traceSteps.push({
          nodeId: node.id,
          stepCode: node.stepCode,
          title: `${node.title}（弱缓解：${slotRes.componentName}）`,
          status: 'weakened',
          message: slotRes.explanation,
        });
      } else {
        nodeStatuses[node.id] = 'compromised';
        traceSteps.push({
          nodeId: node.id,
          stepCode: node.stepCode,
          title: slotRes?.componentName
            ? `${node.title}（防线失效：${slotRes.componentName}）`
            : `${node.title}（未设防）`,
          status: 'bypassed',
          message: slotRes?.explanation ?? '该漏洞节点未拦截攻击载荷，攻击继续向下游扩散。',
        });
      }
      continue;
    }

    if (node.kind === 'processor') {
      nodeStatuses[node.id] = 'compromised';
      traceSteps.push({
        nodeId: node.id,
        stepCode: node.stepCode,
        title: node.title,
        status: 'compromised',
        message: `受上游漏洞影响，${node.title}被诱导进入异常状态（${node.subtitle}），并向下游传递风险动作。`,
      });
      continue;
    }

    // Target node reached while attack not halted
    nodeStatuses[node.id] = 'compromised';
    traceSteps.push({
      nodeId: node.id,
      stepCode: node.stepCode,
      title: node.title,
      status: 'compromised',
      message: `防线失守：${scenario.impactIfUnblocked}`,
    });
  }

  return {
    outcome,
    outcomeLabel,
    score,
    blockedAtSlotIndex: firstBlockedIdx >= 0 ? firstBlockedIdx : null,
    slotResults,
    nodeStatuses,
    traceSteps,
    summary,
  };
}

/**
 * Summarizes user's cleared scenarios across the AI Agent Attack Simulation Challenge.
 */
export function summarizeChallengeProgress(
  clearedIds: string[],
  validScenarioIds: string[]
): {
  clearedCount: number;
  totalCount: number;
  percent: number;
  statusLabel: string;
} {
  const validSet = new Set(validScenarioIds);
  const uniqueCleared = new Set(clearedIds.filter((id) => validSet.has(id)));
  const totalCount = validScenarioIds.length;
  const clearedCount = uniqueCleared.size;
  const percent = totalCount > 0 ? Math.round((clearedCount / totalCount) * 100) : 0;

  let statusLabel = '待启程 · 选择攻击场景部署防线';
  if (clearedCount === totalCount && totalCount > 0) {
    statusLabel = '全关通关 · 已掌握核心 Agent 纵深防御';
  } else if (clearedCount >= 2) {
    statusLabel = '进阶防守中 · 继续攻克其余攻击面';
  } else if (clearedCount >= 1) {
    statusLabel = '首战告捷 · 尝试挑战更多攻击类型';
  }

  return {
    clearedCount,
    totalCount,
    percent,
    statusLabel,
  };
}
