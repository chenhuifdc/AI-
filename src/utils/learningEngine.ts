import type {
  MasteryProgressSummary,
  ModelFitResult,
  QuantizationLevel,
  ReuseDiagnosisInput,
  ReuseDiagnosisResult,
  ToolNote,
  ToolNoteDraft,
  ToolPlatform,
} from '../types/learning';

const QUANT_MULTIPLIER: Record<QuantizationLevel, number> = {
  Q4_K_M: 0.65,
  Q8_0: 1.15,
  FP16: 2.15,
};

const MODEL_CATALOG: Array<{
  paramsB: number;
  paramLabel: string;
  exampleModel: string;
}> = [
  { paramsB: 3, paramLabel: '3B 轻量级', exampleModel: 'Qwen2.5-3B / Llama-3.2-3B' },
  { paramsB: 8, paramLabel: '7B–8B 日常主力', exampleModel: 'DeepSeek-R1-Distill-8B / Qwen2.5-7B' },
  { paramsB: 14, paramLabel: '14B 进阶推理', exampleModel: 'Qwen2.5-14B / DeepSeek-R1-14B' },
  { paramsB: 32, paramLabel: '32B 专业级', exampleModel: 'Qwen2.5-32B / DeepSeek-R1-32B' },
  { paramsB: 70, paramLabel: '70B 旗舰开源', exampleModel: 'Llama-3.3-70B / DeepSeek-R1-70B' },
];

/**
 * Estimates local VRAM/Unified Memory requirements for running Hugging Face GGUF models
 * via Ollama and advises when to route to OpenRouter cloud instead.
 */
export function calculateModelFit(
  availableMemoryGb: number,
  quant: QuantizationLevel
): ModelFitResult[] {
  const safeMem = Math.max(4, Math.min(128, availableMemoryGb));
  const multiplier = QUANT_MULTIPLIER[quant];
  const systemOverheadGb = 2.2;

  return MODEL_CATALOG.map((model) => {
    const estimatedVramGb = Number((model.paramsB * multiplier + 1.2).toFixed(1));
    const usableMemory = safeMem - systemOverheadGb;

    if (estimatedVramGb <= usableMemory * 0.85) {
      return {
        paramLabel: model.paramLabel,
        exampleModel: model.exampleModel,
        estimatedVramGb,
        fitStatus: 'smooth',
        statusText: '本地 Ollama 流畅运行',
        recommendation: '可直接从 Hugging Face 拉取 GGUF 到本地 Ollama，离线零费用。',
      };
    }

    if (estimatedVramGb <= usableMemory * 1.05) {
      return {
        paramLabel: model.paramLabel,
        exampleModel: model.exampleModel,
        estimatedVramGb,
        fitStatus: 'tight',
        statusText: '勉强可跑（建议降量化）',
        recommendation:
          quant === 'Q4_K_M'
            ? '关闭多余软件后可运行，长上下文可能变慢。'
            : '切换为 Q4_K_M 量化版本可显著降低内存占用。',
      };
    }

    return {
      paramLabel: model.paramLabel,
      exampleModel: model.exampleModel,
      estimatedVramGb,
      fitStatus: 'cloud',
      statusText: '建议走 OpenRouter 云端',
      recommendation: '超出本地内存上限，无需升级硬件，直接用 OpenRouter 调云端接口更划算。',
    };
  });
}

/**
 * Zero-code 30-second open-source reuse path decision engine tailored to the user's
 * existing toolchain (OpenRouter, Ollama, Docker, Dify, Antigravity / Hermes).
 */
export function diagnoseReusePath(input: ReuseDiagnosisInput): ReuseDiagnosisResult {
  const { domain, privacy, hardware } = input;

  if (domain === 'docs' && privacy === 'local-only') {
    const localModel = hardware === 'workstation-32' ? 'qwen2.5:14b' : 'qwen2.5:7b';
    return {
      strategyTitle: '本地 Docker 知识库 + Hugging Face 量化模型离线复用',
      platformSource: 'Hugging Face GGUF 模型 + 本地 Dify',
      computeRoute: `本地 Ollama (${localModel}) · 数据零出境`,
      rationale:
        '你已经跑通了 Docker 部署 Dify 和本地 Ollama，不需要碰底层向量数据库代码。只需从 Hugging Face 挑选中文能力强的 GGUF 模型拉进 Ollama，即可全离线分析体检单、合同或个人笔记。',
      firstStep: `在终端执行 ollama run ${localModel}，随后在本地 Dify 模型供应商中选择 Ollama 接入。`,
      agentPrompt: `请帮我检查当前本地 Ollama 是否已拉取 ${localModel}，并整理一份把本地 PDF 文件夹批量导入本地 Dify 知识库的最简操作清单，不需要写复杂后端代码。`,
      recommendedCaseId: 'private-health-rag',
      recommendedCaseTitle: '个人健康体检报告与文献私密解读',
    };
  }

  if (domain === 'docs' && privacy === 'cloud-fast') {
    return {
      strategyTitle: 'GitHub Docker 现成工具 + Dify 云端多模型编排',
      platformSource: 'GitHub (Stirling-PDF / MinerU) + OpenRouter',
      computeRoute: 'OpenRouter 调度 Gemini Pro / DeepSeek',
      rationale:
        '处理复杂票据与扫描 PDF 时，直接复用 GitHub 上高星的 Docker 开源工具完成格式拆分与识别，再把结构化文本交给 OpenRouter 上的大模型归纳，比手写脚本省下 95% 时间。',
      firstStep: '在 GitHub 找到项目的 docker-compose.yml，直接复制运行本地容器，打开浏览器即可使用。',
      agentPrompt:
        '这是 GitHub 项目 Stirling-PDF 的 README 链接。请为我生成一份适配本机端口的 docker-compose.yml，并告诉我如何在 Dify 工作流里通过 HTTP 节点调用它的 PDF 转文本接口。',
      recommendedCaseId: 'family-finance-pdf',
      recommendedCaseTitle: '家庭财务与 PDF 票据自动整理',
    };
  }

  if (domain === 'media') {
    const computeRoute =
      privacy === 'local-only'
        ? hardware === 'workstation-32'
          ? '本地 GitHub 容器 + Ollama 14B 润色'
          : '本地 Whisper 轻量容器 + Ollama 7B 润色'
        : 'Hugging Face Space 免安装直跑 + OpenRouter 翻译润色';
    return {
      strategyTitle:
        privacy === 'local-only'
          ? 'GitHub 音视频开源引擎本地部署 + 智能体封装操作面板'
          : 'Hugging Face Space 零安装体验 + OpenRouter 字幕精修',
      platformSource: 'GitHub (WhisperX / VideoLingo) · Hugging Face Spaces',
      computeRoute,
      rationale:
        '音视频转写和字幕翻译在 GitHub 与 Hugging Face 上已有极其成熟的开源成品。轻度使用直接打开 HF Space 网页拖拽；高频处理则用 Docker 起服务并让 Antigravity 帮你套一个极简拖拽界面。',
      firstStep:
        privacy === 'local-only'
          ? '在 GitHub Releases 或 Docker 页面确认支持 CPU/Apple Silicon 的镜像，用一条命令启动本地转写服务。'
          : '先在 Hugging Face Spaces 搜索 Whisper 相关空间直接上传测试，确认效果后再通过底部 Use via API 接入 Dify。',
      agentPrompt:
        '我想直接复用 GitHub 上的 Whisper 开源工具来给播客和视频做双语字幕。请基于现成 Docker 镜像或本地命令行工具，帮我搭建一个支持拖入视频文件并自动调用本地 Ollama 润色字幕的轻量网页界面。',
      recommendedCaseId: 'bilingual-video-subtitles',
      recommendedCaseTitle: '外语播客与家庭视频一键双语字幕',
    };
  }

  if (domain === 'web') {
    return {
      strategyTitle: 'GitHub 开源网页提取容器 → Dify 定时工作流',
      platformSource: 'GitHub (Crawl4AI / RSSHub) + Dify HTTP 节点',
      computeRoute:
        privacy === 'local-only'
          ? '本地 Ollama 提炼摘要'
          : 'OpenRouter 调度 Gemini Pro 长上下文汇总',
      rationale:
        '不要自己研究爬虫代码。GitHub 上专门为 AI 准备的网页抓取开源工具（如 Crawl4AI）已经自带 Docker 镜像和标准 API，启动后直接填进 Dify 工作流即可每天自动汇总行业与生活情报。',
      firstStep: '使用 Docker 启动 Crawl4AI 容器，在 Dify 工作流添加 HTTP 请求节点指向本地容器地址。',
      agentPrompt:
        '请帮我把 GitHub 开源项目 Crawl4AI 用 Docker Compose 部署到本地 11235 端口，并输出一份可直接导入 Dify 工作流的 HTTP 请求节点配置参数（含请求头与 JSON Body 示例）。',
      recommendedCaseId: 'web-research-digest',
      recommendedCaseTitle: '全网深度调研与周报自动生成',
    };
  }

  return {
    strategyTitle: '精选 GitHub 开源内核 + 指挥智能体零代码“套壳”定制',
    platformSource: 'GitHub 高星命令行工具 (MarkItDown / yt-dlp) + Antigravity / Hermes',
    computeRoute:
      privacy === 'local-only'
        ? '纯本地运行，必要时接入本地 Ollama'
        : '本地开源内核 + OpenRouter 按需增强',
    rationale:
      '你已经具备指挥 Antigravity 和 Hermes 零代码交付完整应用的经验。最强大的开源复用方式是：挑选一个只有命令行但口碑极佳的 GitHub 开源工具，跳过源码，直接把 README 交给智能体为你做出专属图形界面。',
    firstStep: '找到目标 GitHub 项目，只复制 README 中的安装方式与核心使用示例，粘贴给智能体并描述你想要的界面按钮。',
    agentPrompt:
      '我不想手写代码，想直接复用这个 GitHub 开源工具的核心能力（附上 README 片段）。请你帮我把它封装成一个极简的本地网页小工具：左侧上传或粘贴输入，右侧一键预览并导出结果，同时把启动命令写成一键脚本。',
    recommendedCaseId: 'agent-gui-wrapper',
    recommendedCaseTitle: '给开源命令行工具“套壳”做专属生活小应用',
  };
}

/**
 * Calculates overall mastery percentage and current learning stage label.
 */
export function computeMasteryProgress(
  completedCaseIds: string[],
  completedMilestoneIds: string[],
  totalCases: number,
  totalMilestones: number
): MasteryProgressSummary {
  const safeCompletedCases = Math.min(completedCaseIds.length, totalCases);
  const safeCompletedMilestones = Math.min(completedMilestoneIds.length, totalMilestones);
  const denominator = Math.max(1, totalCases + totalMilestones);
  const overallPercent = Math.round(
    ((safeCompletedCases + safeCompletedMilestones) / denominator) * 100
  );

  let currentStageLabel = '起步探索 · 认识开源入口';
  if (overallPercent >= 85) {
    currentStageLabel = '融会贯通 · 零代码开源架构师';
  } else if (overallPercent >= 55) {
    currentStageLabel = '实战进阶 · 工作流与智能体封装';
  } else if (overallPercent >= 25) {
    currentStageLabel = '动手验证 · 容器与 Space 复用';
  }

  return {
    completedCases: safeCompletedCases,
    totalCases,
    completedMilestones: safeCompletedMilestones,
    totalMilestones,
    overallPercent,
    currentStageLabel,
  };
}

export interface ToolNoteValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates new open-source tool log entries without silently filling defaults.
 */
export function validateToolNoteInput(draft: ToolNoteDraft): ToolNoteValidationResult {
  const trimmedName = draft.name.trim();
  const trimmedScenario = draft.lifeScenario.trim();

  if (trimmedName.length < 2) {
    return {
      valid: false,
      error: '请填写开源工具或模型名称（至少 2 个字符，例如 Stirling-PDF）。',
    };
  }

  if (trimmedScenario.length < 4) {
    return {
      valid: false,
      error: '请简要描述你打算用它解决的生活或工作场景（至少 4 个字符）。',
    };
  }

  return { valid: true };
}

/**
 * Filters personal open-source tool notes by platform and keyword.
 */
export function filterToolNotes(
  notes: ToolNote[],
  platformFilter: 'ALL' | ToolPlatform,
  searchQuery: string
): ToolNote[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return notes.filter((note) => {
    if (platformFilter !== 'ALL' && note.platform !== platformFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      note.name.toLowerCase().includes(normalizedQuery) ||
      note.lifeScenario.toLowerCase().includes(normalizedQuery) ||
      note.method.toLowerCase().includes(normalizedQuery)
    );
  });
}
