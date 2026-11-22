export type NavSection = 'bridge' | 'xray' | 'cases' | 'toolbox' | 'security';

export type NodeLayer = 'mastered' | 'opensource';

export type PathwayModeId = 'full' | 'privacy' | 'rapid' | 'agent-remix';

export interface ToolchainNode {
  id: string;
  title: string;
  subtitle: string;
  layer: NodeLayer;
  category: string;
  accent: 'blue' | 'emerald' | 'amber' | 'indigo';
  x: number;
  y: number;
  width: number;
  height: number;
  roleSummary: string;
  bridgeExplanation: string;
  zeroCodeAction: string;
  commandLabel: string;
  commandSnippet: string;
  connectedCaseId: string;
}

export interface ToolchainEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  modes: PathwayModeId[];
  accent: 'blue' | 'emerald' | 'amber' | 'indigo';
}

export interface PathwayMode {
  id: PathwayModeId;
  label: string;
  shortDesc: string;
  privacyLevel: string;
  setupEffort: string;
  bestFor: string;
}

export interface ReuseParadigm {
  id: string;
  indexLabel: string;
  title: string;
  meta: string;
  summary: string;
  whenToUse: string;
  imageSrc: string;
  imageAlt: string;
  targetSection: NavSection;
  targetCaseId?: string;
}

export type XRayPlatform = 'github' | 'huggingface';
export type XRayImportance = 'essential' | 'optional' | 'skip';

export interface XRayHotspot {
  id: string;
  number: number;
  platform: XRayPlatform;
  zoneLabel: string;
  importance: XRayImportance;
  importanceText: string;
  headline: string;
  plainMeaning: string;
  zeroCodeRule: string;
  exampleAction: string;
  copySnippet?: string;
  copyLabel?: string;
}

export type QuantizationLevel = 'Q4_K_M' | 'Q8_0' | 'FP16';

export interface ModelFitResult {
  paramLabel: string;
  exampleModel: string;
  estimatedVramGb: number;
  fitStatus: 'smooth' | 'tight' | 'cloud';
  statusText: string;
  recommendation: string;
}

export interface LifeCaseStep {
  id: string;
  stepNumber: number;
  toolName: string;
  sourceLabel: string;
  roleTitle: string;
  accent: 'blue' | 'emerald' | 'amber' | 'indigo';
  whatHappens: string;
  sampleInput: string;
  sampleOutput: string;
  actionType: 'docker' | 'ollama' | 'space' | 'dify' | 'agent';
  actionTitle: string;
  copyCommand: string;
}

export interface LifeCase {
  id: string;
  indexNumber: string;
  title: string;
  lifePainPoint: string;
  category: string;
  openSourceSource: string;
  timeToBuild: string;
  privacyNote: string;
  toolsUsed: string[];
  outcomeSummary: string;
  steps: LifeCaseStep[];
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  practiceTask: string;
  estimatedTime: string;
  linkedSection: NavSection;
  linkedCaseId?: string;
}

export interface RoadmapStage {
  id: string;
  stageNumber: string;
  title: string;
  goal: string;
  milestones: RoadmapMilestone[];
}

export type ToolPlatform = 'GitHub' | 'Hugging Face';
export type ReuseMethod = 'Docker 部署' | 'HF Space 直用' | 'Ollama 本地拉取' | 'Dify 接口接入' | 'Agent 改造封装';
export type ToolStatus = '待尝试' | '已跑通';

export interface ToolNote {
  id: string;
  name: string;
  platform: ToolPlatform;
  method: ReuseMethod;
  lifeScenario: string;
  status: ToolStatus;
  createdAt: string;
  completedAt?: number;
}

export interface ToolNoteDraft {
  name: string;
  platform: ToolPlatform;
  method: ReuseMethod;
  lifeScenario: string;
}

export type TaskDomain = 'docs' | 'media' | 'web' | 'custom-app';
export type PrivacyPreference = 'local-only' | 'cloud-fast';
export type HardwareTier = 'laptop-16' | 'workstation-32';

export interface ReuseDiagnosisInput {
  domain: TaskDomain;
  privacy: PrivacyPreference;
  hardware: HardwareTier;
}

export interface ReuseDiagnosisResult {
  strategyTitle: string;
  platformSource: string;
  computeRoute: string;
  rationale: string;
  firstStep: string;
  agentPrompt: string;
  recommendedCaseId: string;
  recommendedCaseTitle: string;
}

export interface MasteryProgressSummary {
  completedCases: number;
  totalCases: number;
  completedMilestones: number;
  totalMilestones: number;
  overallPercent: number;
  currentStageLabel: string;
}

export interface GithubRepoSuggestion {
  id: string;
  fullName: string;
  name: string;
  htmlUrl: string;
  description: string;
  stars: number;
  language: string;
  updatedAt: string;
  topics: string[];
  recommendedMethod: ReuseMethod;
  lifeFitSummary: string;
  zeroCodeTip: string;
  agentPrompt: string;
}

export interface GithubSearchResponse {
  scenario: string;
  resolvedQuery: string;
  source: 'github-api' | 'github-api+gemini' | 'gemini-search';
  items: GithubRepoSuggestion[];
}

export interface SimilarToolRecommendation {
  id: string;
  fullName: string;
  name: string;
  htmlUrl: string;
  stars: number;
  language: string;
  recommendedMethod: ReuseMethod;
  similarityReason: string;
  zeroCodeTip: string;
  agentPrompt: string;
}

export interface SimilarToolsResponse {
  basedOnTool: string;
  source: 'gemini+github' | 'gemini';
  items: SimilarToolRecommendation[];
}

export type AttackPhase = 'initial-access' | 'execution-persistence' | 'lateral-impact';

export interface AttackVectorItem {
  id: string;
  phase: AttackPhase;
  phaseLabel: string;
  title: string;
  category: string;
  mechanismSummary: string;
  stealthSignals: string[];
  personalDefense: string;
  enterpriseDefense: string[];
}

export interface AgentSecurityFramework {
  id: string;
  name: string;
  tagline: string;
  corePattern: string;
  techStack: string;
  memoryMechanism: string;
  workflowSummary: string;
  zeroCodeAnalogy: string;
  blueTeamSignal: string;
}

export interface ArchitectureComparisonRow {
  dimension: string;
  agenticFrameworks: string;
  mcpToolServers: string;
  defenderFocus: string;
}

export type DefensePillarId = 'telemetry' | 'identity' | 'boundary' | 'deception';

export interface EnterpriseDefenseControl {
  id: string;
  pillar: DefensePillarId;
  pillarLabel: string;
  priority: 'P0' | 'P1';
  title: string;
  targetThreat: string;
  actionGuide: string;
}

export interface DefenseReadinessSummary {
  checkedCount: number;
  totalCount: number;
  percent: number;
  tierLabel: string;
  pillarStats: Array<{
    pillar: DefensePillarId;
    label: string;
    checked: number;
    total: number;
  }>;
  topUncheckedP0: EnterpriseDefenseControl[];
}

export type WorkflowSimulationMode = 'standard' | 'self-correct';

export interface AgentWorkflowStep {
  id: string;
  index: number;
  code: string;
  title: string;
  shortLabel: string;
  actor: string;
  x: number;
  y: number;
  agentAction: string;
  dataFlowLabel: string;
  blueTeamDetection: string;
}

export type ProtocolDimensionId = 'data-access' | 'prompt-injection' | 'realtime-feedback';

export interface ProtocolDimensionDetail {
  id: ProtocolDimensionId;
  label: string;
  summary: string;
  mcpApproach: {
    headline: string;
    mechanism: string;
    strength: string;
    riskPoint: string;
  };
  agentApproach: {
    headline: string;
    mechanism: string;
    strength: string;
    riskPoint: string;
  };
}

export type ProtocolScenarioId =
  | 'single-audit'
  | 'multi-hop'
  | 'prompt-injection-test'
  | 'waf-feedback';

export interface ProtocolMetricBar {
  label: string;
  mcpScore: number;
  agentScore: number;
  note: string;
}

export interface ProtocolScenarioProfile {
  id: ProtocolScenarioId;
  label: string;
  shortDesc: string;
  focusDimension: ProtocolDimensionId;
  verdict: string;
  metrics: ProtocolMetricBar[];
}

export type SecurityLogSeverity = 'BLOCKED' | 'ALERT' | 'DETECT';

export type SecurityLogScenarioId =
  | 'auto-scan-chain'
  | 'prompt-injection-trap'
  | 'mcp-privilege-block';

export interface SecurityLogTemplate {
  id: string;
  offsetSec: number;
  severity: SecurityLogSeverity;
  source: string;
  stageTag: string;
  title: string;
  detail: string;
  detectionWhy: string;
  defenseAction: string;
}

export interface SecurityLogEntry extends SecurityLogTemplate {
  instanceId: string;
  timestamp: string;
}

export interface SecurityLogScenario {
  id: SecurityLogScenarioId;
  label: string;
  shortDesc: string;
  events: SecurityLogTemplate[];
}

export type AgentArchitectureType =
  | 'mcp-toolchain'
  | 'autonomous-loop'
  | 'dify-rag'
  | 'browser-desktop';

export type AgentModelRouting = 'cloud-api' | 'local-ollama' | 'hybrid';

export type AgentCapabilityId =
  | 'external-content'
  | 'shell-docker'
  | 'db-kb-write'
  | 'outbound-webhook'
  | 'secrets-env';

export type AgentGuardrailId =
  | 'human-approval'
  | 'schema-validation'
  | 'scope-whitelist'
  | 'container-sandbox'
  | 'data-instruction-split';

export interface AgentAuditConfig {
  architecture: AgentArchitectureType;
  modelRouting: AgentModelRouting;
  capabilities: AgentCapabilityId[];
  guardrails: AgentGuardrailId[];
  customContext: string;
}

export type AgentAuditCategory = 'prompt-injection' | 'privilege-escalation';

export interface AgentAuditItem {
  id: string;
  category: AgentAuditCategory;
  categoryLabel: string;
  severity: 'HIGH' | 'MEDIUM';
  title: string;
  triggeredBy: string;
  attackMechanism: string;
  safeSimulationIdea: string;
  hardeningFix: string;
}

export interface AgentAuditReport {
  riskScore: number;
  riskLevel: '高危暴露' | '中等风险' | '防护稳健';
  injectionCount: number;
  privilegeCount: number;
  summary: string;
  items: AgentAuditItem[];
}

export type AttackChallengeId =
  | 'prompt-injection'
  | 'data-poisoning'
  | 'mcp-tool-hijack'
  | 'memory-exfil';

export type ChallengeNodeKind = 'source' | 'flaw-slot' | 'processor' | 'target';

export interface ChallengeArchNode {
  id: string;
  stepCode: string;
  title: string;
  subtitle: string;
  kind: ChallengeNodeKind;
  slotId?: string;
  flawSummary?: string;
  x: number;
  y: number;
}

export interface ChallengeArchEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface ChallengeDefenseSlot {
  id: string;
  label: string;
  layerName: string;
  nodeId: string;
  vulnerabilityDetail: string;
}

export type DefenseEffectiveness = 'optimal' | 'partial' | 'ineffective';

export interface ChallengeDefenseOption {
  id: string;
  name: string;
  shortTag: string;
  description: string;
  effectivenessBySlot: Record<string, DefenseEffectiveness>;
  feedbackBySlot: Record<string, string>;
}

export interface AttackChallengeScenario {
  id: AttackChallengeId;
  attackTypeLabel: string;
  shortName: string;
  difficulty: '入门' | '进阶' | '高难';
  targetSystemTitle: string;
  scenarioBrief: string;
  simulatedPayloadPreview: string;
  impactIfUnblocked: string;
  nodes: ChallengeArchNode[];
  edges: ChallengeArchEdge[];
  slots: ChallengeDefenseSlot[];
  defenseOptions: ChallengeDefenseOption[];
  recommendedComboNote: string;
}

export type SlotEvalStatus = 'blocked' | 'mitigated' | 'bypassed' | 'empty';

export interface SlotEvaluationDetail {
  slotId: string;
  slotLabel: string;
  nodeId: string;
  componentId: string | null;
  componentName: string | null;
  status: SlotEvalStatus;
  explanation: string;
}

export type ChallengeNodeVisualStatus =
  | 'source'
  | 'idle'
  | 'compromised'
  | 'blocked-here'
  | 'mitigated-here'
  | 'safe-protected';

export interface ChallengeTraceStep {
  nodeId: string;
  stepCode: string;
  title: string;
  status: 'attack-entry' | 'blocked' | 'weakened' | 'bypassed' | 'compromised' | 'protected';
  message: string;
}

export interface ChallengeEvaluationResult {
  outcome: 'intercepted' | 'partial' | 'breached';
  outcomeLabel: string;
  score: number;
  blockedAtSlotIndex: number | null;
  slotResults: SlotEvaluationDetail[];
  nodeStatuses: Record<string, ChallengeNodeVisualStatus>;
  traceSteps: ChallengeTraceStep[];
  summary: string;
}


