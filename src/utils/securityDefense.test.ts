import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  AgentAuditConfig,
  AttackVectorItem,
  EnterpriseDefenseControl,
  SecurityLogEntry,
} from '../types/learning';
import {
  computeDefenseReadiness,
  evaluateAgentAudit,
  filterAttackVectors,
  filterSecurityLogs,
  formatAuditReportMarkdown,
  formatSimulatedLogTime,
  getNextWorkflowStepIndex,
  summarizeLogStats,
  summarizeProtocolLead,
} from './securityDefense';

const SAMPLE_VECTORS: AttackVectorItem[] = [
  {
    id: 'v1',
    phase: 'initial-access',
    phaseLabel: '初始投递与突破',
    title: '钓鱼伪装与木马投递',
    category: '木马投递',
    mechanismSummary: '伪装正常软件或文档诱导执行',
    stealthSignals: ['未签名安装包'],
    personalDefense: '仅从官方仓库下载',
    enterpriseDefense: ['邮件沙箱'],
  },
  {
    id: 'v2',
    phase: 'execution-persistence',
    phaseLabel: '执行驻留与窃密',
    title: '无文件内存驻留',
    category: '隐蔽驻留',
    mechanismSummary: '滥用系统自带脚本引擎',
    stealthSignals: ['异常子进程'],
    personalDefense: '开启系统行为防护',
    enterpriseDefense: ['EDR 行为检测'],
  },
  {
    id: 'v3',
    phase: 'lateral-impact',
    phaseLabel: '横向扩散与破坏',
    title: '内网横向与勒索',
    category: '横向扩散',
    mechanismSummary: '扫描相邻子网并加密备份',
    stealthSignals: ['异常东西向探测'],
    personalDefense: '离线备份重要文件',
    enterpriseDefense: ['微分段隔离'],
  },
];

const SAMPLE_CONTROLS: EnterpriseDefenseControl[] = [
  {
    id: 'c1',
    pillar: 'telemetry',
    pillarLabel: '行为检测与遥测',
    priority: 'P0',
    title: '检测机器速度攻击链',
    targetThreat: 'AI 代理连续枚举与利用',
    actionGuide: '在 SIEM/EDR 中配置秒级多阶段关联规则',
  },
  {
    id: 'c2',
    pillar: 'identity',
    pillarLabel: '身份与凭证加固',
    priority: 'P0',
    title: '启用抗钓鱼 MFA 与短期凭证',
    targetThreat: '凭证窃取与自动化喷洒',
    actionGuide: '切换至 Passkey/FIDO2 与短期 STS Token',
  },
  {
    id: 'c3',
    pillar: 'boundary',
    pillarLabel: '边界收敛与微分段',
    priority: 'P0',
    title: '收敛暴露端口与 MCP 接口',
    targetThreat: '自动化边界扫描与未授权调用',
    actionGuide: '关闭公网管理端口与未鉴权 MCP 监听',
  },
  {
    id: 'c4',
    pillar: 'deception',
    pillarLabel: '主动诱捕与韧性响应',
    priority: 'P1',
    title: '部署诱饵凭证与蜜罐端点',
    targetThreat: 'AI 自主探索路径',
    actionGuide: '放置高置信度诱捕凭证触发即时阻断',
  },
];

test('filterAttackVectors returns all or phase-specific items cleanly', () => {
  assert.equal(filterAttackVectors(SAMPLE_VECTORS, 'ALL').length, 3);
  const initial = filterAttackVectors(SAMPLE_VECTORS, 'initial-access');
  assert.equal(initial.length, 1);
  assert.equal(initial[0].id, 'v1');
});

test('computeDefenseReadiness computes 0%, partial, and 100% readiness and ignores unknown IDs', () => {
  const zero = computeDefenseReadiness(['non-existent'], SAMPLE_CONTROLS);
  assert.equal(zero.checkedCount, 0);
  assert.equal(zero.percent, 0);
  assert.equal(zero.topUncheckedP0.length, 3);

  const partial = computeDefenseReadiness(['c1', 'c2'], SAMPLE_CONTROLS);
  assert.equal(partial.checkedCount, 2);
  assert.equal(partial.percent, 50);
  assert.equal(partial.topUncheckedP0.length, 1);
  assert.equal(partial.topUncheckedP0[0].id, 'c3');

  const full = computeDefenseReadiness(['c1', 'c2', 'c3', 'c4'], SAMPLE_CONTROLS);
  assert.equal(full.checkedCount, 4);
  assert.equal(full.percent, 100);
  assert.equal(full.topUncheckedP0.length, 0);
  assert.ok(full.tierLabel.includes('高韧性'));
});

test('getNextWorkflowStepIndex handles standard progression, rewind, and self-correct loop', () => {
  assert.equal(getNextWorkflowStepIndex(0, 6, 'next', 'standard'), 1);
  assert.equal(getNextWorkflowStepIndex(5, 6, 'next', 'standard'), 0);
  assert.equal(getNextWorkflowStepIndex(0, 6, 'prev', 'standard'), 5);
  assert.equal(getNextWorkflowStepIndex(3, 6, 'prev', 'self-correct'), 2);
  // In self-correct mode, Reflector (step 06 / index 5) loops back to Graph Memory (step 03 / index 2)
  assert.equal(getNextWorkflowStepIndex(5, 6, 'next', 'self-correct'), 2);
  assert.equal(getNextWorkflowStepIndex(0, 0, 'next', 'standard'), 0);
});

test('summarizeProtocolLead identifies MCP lead, Agent lead, balanced, and empty input', () => {
  const mcpWin = summarizeProtocolLead([
    { mcpScore: 92, agentScore: 50 },
    { mcpScore: 88, agentScore: 54 },
  ]);
  assert.equal(mcpWin.mcpAvg, 90);
  assert.equal(mcpWin.agentAvg, 52);
  assert.equal(mcpWin.lead, 'mcp');

  const agentWin = summarizeProtocolLead([
    { mcpScore: 44, agentScore: 94 },
    { mcpScore: 48, agentScore: 92 },
  ]);
  assert.equal(agentWin.lead, 'agent');

  const tie = summarizeProtocolLead([
    { mcpScore: 80, agentScore: 78 },
    { mcpScore: 76, agentScore: 78 },
  ]);
  assert.equal(tie.lead, 'balanced');

  const empty = summarizeProtocolLead([]);
  assert.deepEqual(empty, { mcpAvg: 0, agentAvg: 0, lead: 'balanced' });
});

test('filterSecurityLogs, summarizeLogStats, and formatSimulatedLogTime behave deterministically', () => {
  const sampleLogs: SecurityLogEntry[] = [
    {
      id: 'l1',
      instanceId: 'i1',
      offsetSec: 0,
      timestamp: formatSimulatedLogTime(new Date(2026, 0, 1, 9, 5, 8).getTime(), 0),
      severity: 'DETECT',
      source: 'Edge-WAF',
      stageTag: '01 侦察',
      title: '异常扫描',
      detail: 'd1',
      detectionWhy: 'w1',
      defenseAction: 'a1',
    },
    {
      id: 'l2',
      instanceId: 'i2',
      offsetSec: 5,
      timestamp: formatSimulatedLogTime(new Date(2026, 0, 1, 9, 5, 8).getTime(), 5),
      severity: 'BLOCKED',
      source: 'SOAR',
      stageTag: '02 拦截',
      title: '阻断攻击链',
      detail: 'd2',
      detectionWhy: 'w2',
      defenseAction: 'a2',
    },
    {
      id: 'l3',
      instanceId: 'i3',
      offsetSec: 10,
      timestamp: formatSimulatedLogTime(new Date(2026, 0, 1, 9, 5, 8).getTime(), 10),
      severity: 'ALERT',
      source: 'SIEM',
      stageTag: '03 告警',
      title: '高危告警',
      detail: 'd3',
      detectionWhy: 'w3',
      defenseAction: 'a3',
    },
  ];

  assert.equal(sampleLogs[0].timestamp, '09:05:08');
  assert.equal(sampleLogs[1].timestamp, '09:05:13');
  assert.equal(filterSecurityLogs(sampleLogs, 'ALL').length, 3);
  assert.equal(filterSecurityLogs(sampleLogs, 'BLOCKED').length, 1);
  assert.deepEqual(summarizeLogStats(sampleLogs), {
    total: 3,
    blockedCount: 1,
    alertCount: 1,
    detectCount: 1,
  });
});

test('evaluateAgentAudit scores risky unguarded agent high and guarded agent lower with both categories covered', () => {
  const riskyConfig: AgentAuditConfig = {
    architecture: 'autonomous-loop',
    modelRouting: 'cloud-api',
    capabilities: ['external-content', 'shell-docker', 'outbound-webhook', 'secrets-env'],
    guardrails: [],
    customContext: '自动抓取外部邮件 PDF 并执行本地 Docker 脚本后通过 Webhook 推送',
  };

  const hardenedConfig: AgentAuditConfig = {
    architecture: 'mcp-toolchain',
    modelRouting: 'cloud-api',
    capabilities: ['external-content'],
    guardrails: [
      'human-approval',
      'schema-validation',
      'scope-whitelist',
      'container-sandbox',
      'data-instruction-split',
    ],
    customContext: '仅做只读文档摘要测试',
  };

  const riskyReport = evaluateAgentAudit(riskyConfig);
  const hardenedReport = evaluateAgentAudit(hardenedConfig);

  assert.equal(riskyReport.riskLevel, '高危暴露');
  assert.ok(riskyReport.riskScore > hardenedReport.riskScore);
  assert.equal(hardenedReport.riskLevel, '防护稳健');
  assert.ok(riskyReport.injectionCount >= 2);
  assert.ok(riskyReport.privilegeCount >= 2);
  assert.ok(hardenedReport.injectionCount >= 1);
  assert.ok(hardenedReport.privilegeCount >= 1);

  const md = formatAuditReportMarkdown(riskyConfig, riskyReport);
  assert.ok(md.includes('AI Agent 漏洞自测与安全审计清单'));
  assert.ok(md.includes('高危暴露'));
});


