import type {
  AgentArchitectureType,
  AgentCapabilityId,
  AgentGuardrailId,
  AgentModelRouting,
  AgentSecurityFramework,
  AgentWorkflowStep,
  ArchitectureComparisonRow,
  AttackVectorItem,
  EnterpriseDefenseControl,
  ProtocolDimensionDetail,
  ProtocolScenarioProfile,
  SecurityLogScenario,
} from '../types/learning';

export const ATTACK_VECTORS: AttackVectorItem[] = [
  {
    id: 'phishing-trojan',
    phase: 'initial-access',
    phaseLabel: '初始投递与突破',
    title: '伪装木马与恶意投递（Trojan / 钓鱼）',
    category: '社会工程与恶意载体',
    mechanismSummary:
      '木马不会像传统病毒那样疯狂自我复制，而是伪装成看似正常的「破解软件」「热门 GitHub 开源工具一键包」「电子发票压缩包」或浏览器插件，诱导用户主动双击或执行安装脚本，在后台静默开启远程控制通道。',
    stealthSignals: [
      '来源不明的第三方网盘安装包，或高仿知名开源仓库的拼写变体（Typosquatting）',
      '普通文档或工具要求「关闭杀毒软件」「开启宏」或索要管理员权限',
      '安装后在后台静默创建陌生定时任务或开机自启项',
    ],
    personalDefense:
      '下载开源工具只认准官方 GitHub 仓库的 Releases 与高星主分支；不运行来历不明的「一键整合破解脚本」；优先使用 Docker 容器隔离运行新工具，不直接给宿主机最高权限。',
    enterpriseDefense: [
      '邮件网关启用附件沙箱引爆与 URL 信誉重写，拦截高仿域名钓鱼',
      '终端强制执行代码签名策略（AppLocker / WDAC），默认禁止未知二进制与 Office 宏执行',
      '对开发者与员工实施软件包仓库代理与供应链哈希校验，防范恶意依赖投毒',
    ],
  },
  {
    id: 'boundary-misconfig',
    phase: 'initial-access',
    phaseLabel: '初始投递与突破',
    title: '边界漏洞利用与配置暴露（Web / API / 容器端口）',
    category: '自动化扫描与入口突破',
    mechanismSummary:
      '攻击者无需诱导人工点击，直接利用自动化扫描器或 AI 代理批量探测公网暴露的服务端口、未及时打补丁的 Web 组件、弱口令管理后台，以及配置失误的 Docker / 数据库 / API 网关接口，从而直接拿到初始立足点。',
    stealthSignals: [
      '管理后台、数据库（PostgreSQL / Redis）或 Ollama / Dify 端口被直接绑定到 0.0.0.0 暴露公网',
      '短时间内出现大量针对常见框架路径、API 认证逻辑与错误回显的密集试探请求',
      '云端身份接口（SAML / OAuth / Webhook）缺少签名验证或存在过宽权限配置',
    ],
    personalDefense:
      '本地部署 Dify、Ollama 或开源 Docker 工具时，端口绑定限定为 127.0.0.1（仅本机可访问）；切勿把无鉴权的管理界面直接映射到公网；定期拉取官方镜像更新补丁。',
    enterpriseDefense: [
      '建立持续攻击面管理（ASM），自动化盘点公网暴露端口、影子 API 与过期证书',
      '关键业务前置 WAF 与 API 网关，严格校验身份签名并实施分级速率限制',
      '对高危暴露漏洞建立 24–72 小时紧急修复 SLA 与虚拟补丁机制',
    ],
  },
  {
    id: 'fileless-lotl',
    phase: 'execution-persistence',
    phaseLabel: '执行驻留与窃密',
    title: '无文件内存驻留与合法工具滥用（Living off the Land）',
    category: '绕过静态特征查杀',
    mechanismSummary:
      '现代木马越来越少在硬盘上留下明显的「病毒文件」，而是直接调用操作系统自带的合法管理工具（如脚本解释器、系统运维命令）在内存中加载执行，借“正常工具的外壳”掩盖恶意行为，让只看文件特征码的传统杀毒软件失效。',
    stealthSignals: [
      '办公软件或浏览器进程异常派生出命令行终端或脚本解释器子进程',
      '系统运维工具出现反常的超长编码参数或主动向陌生公网地址发起下载',
      '没有任何新程序安装记录，但系统后台出现周期性隐蔽网络连接',
    ],
    personalDefense:
      '保持操作系统内置行为防护（如 Defender / macOS Gatekeeper）常开；日常使用标准用户而非超级管理员账户；留意安全软件对“异常脚本启动”的弹窗拦截，切勿随手点放行。',
    enterpriseDefense: [
      '部署基于行为与进程树谱系分析的 EDR，重点监控“文档/Web服务 → 命令行/脚本引擎”异常父子进程链',
      '开启脚本块完整审计日志与命令行参数记录，集中送入 SIEM 关联分析',
      '通过最小权限原则收紧非运维岗位对系统管理脚本引擎的调用能力',
    ],
  },
  {
    id: 'credential-theft',
    phase: 'execution-persistence',
    phaseLabel: '执行驻留与窃密',
    title: '凭证窃取与会话令牌劫持（Infostealer / Token 接管）',
    category: '身份盗用与资产接管',
    mechanismSummary:
      '信息窃密木马（Infostealer）专门扫描浏览器保存的密码、登录 Cookie、云平台 API Key（如 OpenRouter / 云厂商密钥）以及本地配置文件。攻击者一旦拿到有效会话令牌，甚至可以直接绕过密码登录，以“合法用户”身份接管云端资源。',
    stealthSignals: [
      '账号在异地或非工作时间出现成功登录，且跳过了常规密码输入步骤',
      'API 密钥在短时间内产生异常高频调用、账单暴增或被用于探测其他内部资源',
      '终端出现非浏览器进程尝试读取浏览器凭证数据库或环境变量文件',
    ],
    personalDefense:
      '重要账号全部开启硬件级或 App 双因素验证（MFA / Passkey）；API 密钥绝不写进公开笔记、聊天截图或代码仓库，并为 OpenRouter 等接口设置月度消费上限。',
    enterpriseDefense: [
      '全面推行抗钓鱼 MFA（FIDO2 / Passkey）与条件访问策略（校验设备合规性与地理位置）',
      '将长期静态密钥替换为短生命周期临时凭证（STS / OIDC 联邦身份），缩小令牌泄露窗口',
      '使用集中密钥管理服务（KMS / Vault）并配置密钥泄露自动化扫描与即时吊销机制',
    ],
  },
  {
    id: 'lateral-movement',
    phase: 'lateral-impact',
    phaseLabel: '横向扩散与破坏',
    title: '内网侦察、提权与横向移动（Lateral Movement）',
    category: '扩大控制半径',
    mechanismSummary:
      '攻破单台边缘设备只是起点。攻击者（或自动化 AI 代理）会立即读取本机网络拓扑、共享目录与配置文件，寻找更高权限的运维账号或数据库入口，像多米诺骨牌一样横向渗透到核心业务服务器与云控制平面。',
    stealthSignals: [
      '普通办公机或单一业务容器突然向内网多个网段发起端口探测与服务识别',
      '短时间内出现跨多台主机的集中远程登录尝试或异常服务账号调用',
      '非运维节点频繁查询内部目录服务、云元数据接口或密钥配置中心',
    ],
    personalDefense:
      '家庭或个人工作站中，测试开源项目与存放私密财务/健康数据的环境尽量隔离；Docker 容器不要随意挂载整个宿主机根目录或使用特权模式（privileged）。',
    enterpriseDefense: [
      '实施零信任网络微分段与控制平面隔离，阻断失陷主机随意扫描相邻业务子网',
      '分离日常账号与特权运维账号（PAM 堡垒机 + 即时审批 JIT），杜绝“一台失陷全网通杀”',
      '部署内部东西向流量监测（NDR），及时捕捉异常的内网拓扑枚举行为',
    ],
  },
  {
    id: 'c2-ransomware',
    phase: 'lateral-impact',
    phaseLabel: '横向扩散与破坏',
    title: '隐蔽外联回控、数据外泄与勒索加密（C2 / Ransomware）',
    category: '最终破坏与勒索',
    mechanismSummary:
      '控制核心资产后，木马会通过加密隧道定时向远端控制服务器（C2）汇报并接收指令，先将高价值商业机密或个人敏感文档分批外传，最后再批量加密核心文件与在线备份实施双重勒索。',
    stealthSignals: [
      '主机向新注册冷门域名、非常规端口或云盘接口发起规律性心跳包（Beaconing）或大流量上传',
      '短时间内出现大量文件被高频重命名、修改扩展名或清除系统卷影副本',
      '夜间非业务高峰时段出现数据库整表导出或打包压缩行为',
    ],
    personalDefense:
      '对家庭账单、体检报告与重要资料坚持「3-2-1 备份原则」：3 份副本、2 种介质、至少 1 份离线冷备（拔掉网线/USB 的移动硬盘），勒索软件无法加密离线备份。',
    enterpriseDefense: [
      '执行严格的出站流量白名单控制（Egress Filtering），阻断服务器随意连接未知外网地址',
      '启用数据防泄漏（DLP）与异常大流量外传告警，阻断敏感数据静默离境',
      '构建逻辑隔离且不可篡改的离线备份（Immutable Backup），定期开展真实灾难恢复演练',
    ],
  },
];

export const AGENT_SECURITY_FRAMEWORKS: AgentSecurityFramework[] = [
  {
    id: 'pentagi',
    name: 'PentAGI',
    tagline: '全自主多智能体沙箱编排系统',
    corePattern: '多角色分工（最多 13 类子代理）+ Reflector 反思纠错机制',
    techStack: 'Docker 隔离沙箱 + 20+ 安全工具 + PostgreSQL (pgvector) + Neo4j 知识图谱',
    memoryMechanism:
      '用向量数据库沉淀长程经验，并用可选图数据库动态关联主机、端口、服务与发现的弱点，避免多轮测试失忆。',
    workflowSummary:
      '用户输入高层评估目标后，主控智能体将任务拆解给侦察、分析、验证与报告等专职子代理；当某个子代理陷入空谈或卡死时，Reflector 代理会介入把对话重新拉回可执行步骤。',
    zeroCodeAnalogy:
      '就像把你熟悉的「Docker 容器环境 + Dify 知识库记忆 + 多角色协作工作流」打包成一套全自动安全评估流水线。',
    blueTeamSignal:
      '典型特征为“高连贯性的多阶段自动化流水线”：扫描输出在数秒内即触发针对性的下一跳验证与重试，并伴随规律性的多轮试探修正。',
  },
  {
    id: 'artex',
    name: 'ARTEX',
    tagline: '双层规划/执行图谱驱动的开源代理框架',
    corePattern: 'Planner（战略规划器）+ Worker（并行执行器）共享发现图谱',
    techStack: 'Go 编排引擎 + 嵌入式 Web 控制台 + PostgreSQL 共享图谱 + 多模型 API 接入',
    memoryMechanism:
      '所有 Worker 探测到的资产、端口与报错回显都会实时写回中心共享图谱，供 Planner 统一重新规划下一步意图。',
    workflowSummary:
      '将操作者的一句自然语言目标拆解成结构化“意图队列”，由并行 Worker 调用常见网络与浏览器诊断工具收集反馈；遇到拦截或报错时自动读取输出并调整策略，大幅缩短人工研判时间。',
    zeroCodeAnalogy:
      '好比你通过 OpenRouter 接上 DeepSeek/Gemini 大脑，让一个总导演（Planner）不断给多个执行助手（Worker）派发任务并汇总到同一张白板。',
    blueTeamSignal:
      '防守侧可观察到传统运维/命令行工具（如标准 HTTP 客户端、无头浏览器）被高并发、跨阶段的机器节奏串联调用，且常配合代理池切换来源 IP。',
  },
  {
    id: 'cairn',
    name: 'Cairn',
    tagline: '基于状态空间搜索的动态路径探索引擎',
    corePattern: 'State-Space Search（状态空间搜索）+ 共享事实/意图池',
    techStack: '共享状态库（Facts & Intents）+ 异步多 Worker 探索循环',
    memoryMechanism:
      '把整个安全评估抽象成“寻路问题”：持续维护已证实的客观事实（Facts）与待检验假设（Intents），按优先级探索最优验证路径。',
    workflowSummary:
      '不再依赖死板的线性脚本流程。只要某个环节发现新线索（例如暴露的配置文件或身份接口），状态池立即生成新的高优先级意图，驱动执行器灵活转向，适合复杂多跳拓扑下的自动化路径推演。',
    zeroCodeAnalogy:
      '类似于下棋 AI 搜索走法树——每看到一步新局势，立刻重算所有可能分支，挑成功率最高的一条继续验证。',
    blueTeamSignal:
      '探测行为呈现“树状分支与快速回溯”特征：一旦某条路径受阻（如被 WAF 拦下），会在极短时间内切换到完全不同的协议或相邻接口继续探索。',
  },
  {
    id: 'cyberstrikeai',
    name: 'CyberStrikeAI',
    tagline: '反馈驱动的动态载荷与自适应编排框架',
    corePattern: '实时执行反馈闭环 + 动态定制脚本/验证逻辑生成',
    techStack: 'LLM 推理循环 + 反馈解析器 + 动态脚本生成与执行模块',
    memoryMechanism:
      '紧密跟踪目标返回的 HTTP 状态码、错误堆栈与防御拦截响应，在多轮交互中动态微调测试逻辑。',
    workflowSummary:
      '相比只调用固定参数的传统扫描器，此类框架的核心变化在于“现场写一次性适配脚本”：当标准规则撞上特征拦截或特殊业务接口时，直接利用 LLM 依据实时回显改写探测载荷，显著绕过静态规则库。',
    zeroCodeAnalogy:
      '就像指挥编程智能体根据报错信息“边跑边改”，只是被自动化循环接管，免去了人工复制报错再粘贴的等待时间。',
    blueTeamSignal:
      '同一来源在短时间内发送“语义相似但编码/结构快速变异”的试探请求，且伴随针对报错信息逐轮精准微调的交互痕迹。',
  },
];

export const OODA_STAGES = [
  {
    step: '01',
    code: 'Observe',
    title: '观测与信息采集',
    desc: '调用标准探测或诊断工具读取目标响应（状态码、Banner、日志、接口返回），将原始文本结构化。',
  },
  {
    step: '02',
    code: 'Orient',
    title: '上下文研判与记忆',
    desc: '将新线索写入向量库或知识图谱（如 pgvector / Neo4j），结合历史事实判断当前所处阶段与薄弱环节。',
  },
  {
    step: '03',
    code: 'Decide',
    title: 'LLM 意图规划与拆解',
    desc: '规划代理（Planner）在多条候选路径中权衡优先级，生成下一步要执行的工具调用参数或验证意图。',
  },
  {
    step: '04',
    code: 'Act & Reflect',
    title: '沙箱执行与自纠错',
    desc: '执行器在容器或本地工具链中运行命令；若输出异常或停滞，由反思机制（Reflector）自动修正策略并进入下一轮循环。',
  },
];

export const ARCHITECTURE_COMPARISON_ROWS: ArchitectureComparisonRow[] = [
  {
    dimension: '交互协议（Interaction Protocol）',
    agenticFrameworks:
      '内部任务总线 + 原生 Function Calling / REST：PentAGI、Cairn、ARTEX 在框架内部定义专有任务队列、状态机和子代理通信格式，由编排层直接调用大模型 API 与容器内命令行工具。',
    mcpToolServers:
      '标准化 Model Context Protocol（JSON-RPC 2.0 over Stdio / SSE / Streamable HTTP）：如 HexStrike 将 150+ 工具统一封装为标准 Tool Schema，任何兼容 MCP 的外部客户端即插即用。',
    defenderFocus:
      '针对 MCP 需重点盘查开发机与服务器是否误开放未鉴权的 HTTP/SSE 监听端口；针对自治代理需监控异常出站大模型 API 并发与容器编排进程。',
  },
  {
    dimension: '数据存取与记忆底座（Data Access）',
    agenticFrameworks:
      '重状态、内置持久化图谱：PentAGI 采用 PostgreSQL + pgvector 向量库与 Neo4j 知识图谱，Cairn 维护共享 Facts & Intents 状态池，可跨数小时乃至跨天持续关联拓扑与线索。',
    mcpToolServers:
      '轻状态、协议透传为主：MCP Server 侧重即时执行并返回结构化 JSON 工具输出，长期记忆、跨轮次上下文与历史日志归档主要由外部宿主 LLM 客户端掌管。',
    defenderFocus:
      '内置图谱记忆的自治框架即使单次会话被断开仍保留已探测拓扑，防守方封禁单 IP 往往不够，必须同步收敛暴露面与轮换涉敏凭证。',
  },
  {
    dimension: '指令注入防范（Prompt Injection Defense）',
    agenticFrameworks:
      '隔离沙箱 + 反思器校验：工具扫描到的目标网页/Banner 原文直接进入内部代理上下文，若目标埋设恶意提示词可能诱导规划偏移，需依赖强隔离容器、范围白名单与 Reflector 策略审计。',
    mcpToolServers:
      '强类型 Schema 参数校验 + 人工审批护栏：每个工具调用都受 JSON Schema 参数约束，且外部 MCP Client 天然支持在执行高敏工具前弹窗由人工二次确认（Human-in-the-loop）。',
    defenderFocus:
      '蓝队可在蜜罐页面与测试响应中设置合规监测标记，同时企业内部使用安全 AI 工具时必须强制启用参数白名单与人工审批门禁。',
  },
  {
    dimension: '攻击与验证响应模式（Response Pattern）',
    agenticFrameworks:
      '机器速度自治闭环（OODA 循环）：给定高层目标后自主完成“扫描 → 读回显 → 动态改写路径 → 下一跳验证”，遇阻可秒级回溯分支（如 Cairn 状态搜索、CyberStrikeAI 反馈微调）。',
    mcpToolServers:
      '按需驱动的交互式工具编排：由外部模型或安全人员按步骤发起 Tool Call，每次返回结构化结果后再由客户端决定下一步，节奏更可控，适合精细化辅助审计。',
    defenderFocus:
      '自治代理在流量侧表现为“秒级跨阶段连贯探测 + 报错后精准微调”；MCP 滥用则多表现为普通 AI 客户端宿主进程异常派生专业扫描工具链。',
  },
  {
    dimension: '模型解耦与扩展成本',
    agenticFrameworks:
      '强耦合提示词与多角色协作流：切换底层模型往往需要重新调优 Planner / Reflector 提示词与并发控制，部署通常需要完整 Docker Compose 栈（数据库 + 控制台 + 沙箱）。',
    mcpToolServers:
      '模型完全解耦：后端工具总机独立演进，前端可随时在云端旗舰模型与本地 Ollama 之间切换，无需修改工具封装代码。',
    defenderFocus:
      'MCP 的低门槛使普通办公 AI 客户端也能迅速接入高危工具集，企业终端治理需将未授权 MCP 插件纳入软件供应链与 EDR 管控。',
  },
  {
    dimension: '合规治理与人在回路（Governance）',
    agenticFrameworks:
      '偏向全自动托管：若缺少硬编码的目标范围边界（Scope Guardrail）与速率上限，容易因模型幻觉对非授权资产产生高噪声探测甚至引发业务告警风暴。',
    mcpToolServers:
      '天然契合授权审计流程：工具调用边界清晰、单次动作粒度细，更便于接入企业审批流与全量调用审计日志。',
    defenderFocus:
      '无论采用哪种框架开展授权红队演练，都应强制落实目标网段白名单、独立测试凭据、调用速率熔断与全链路可追溯审计日志。',
  },
];

export const AGENT_WORKFLOW_STEPS: AgentWorkflowStep[] = [
  {
    id: 'step-goal',
    index: 0,
    code: '01',
    title: '自然语言目标解析',
    shortLabel: '目标拆解',
    actor: 'Planner 规划代理',
    x: 24,
    y: 52,
    agentAction:
      '接收高层评估目标与授权范围（如目标域名或测试网段），由 Planner 代理将模糊需求拆解为结构化的初始侦察任务队列。',
    dataFlowLabel: 'Intent JSON',
    blueTeamDetection:
      '企业合规侧：确保所有授权演练在此阶段写入硬编码 Scope 白名单；防守侧此时尚未收到外部探测流量。',
  },
  {
    id: 'step-scan',
    index: 1,
    code: '02',
    title: '自动化资产与端口扫描',
    shortLabel: '资产扫描',
    actor: 'Worker 执行器',
    x: 326,
    y: 52,
    agentAction:
      '并行 Worker 在隔离沙箱中调用标准网络探测与 Web 指纹工具，收集开放端口、服务版本、暴露 API 路径与 HTTP 响应头。',
    dataFlowLabel: 'Stdout / Banner',
    blueTeamDetection:
      '蓝队信号：边界防火墙与 WAF 可捕获短时高频路径枚举与非常规指纹试探；ASM 应提前收敛非必要公网端口。',
  },
  {
    id: 'step-memory',
    index: 2,
    code: '03',
    title: '线索提取与状态图谱写入',
    shortLabel: '图谱记忆',
    actor: 'Memory / Facts 库',
    x: 628,
    y: 52,
    agentAction:
      '解析工具输出的原始文本，将已证实资产、接口特征与错误堆栈写入向量库或状态图谱（如 pgvector / Neo4j / Facts 池），形成持续上下文。',
    dataFlowLabel: 'Graph Facts',
    blueTeamDetection:
      '蓝队信号：若响应中泄露详细报错堆栈或内部版本号，会直接加速 AI 代理精准建模；生产环境务必关闭调试回显。',
  },
  {
    id: 'step-plan',
    index: 3,
    code: '04',
    title: '弱点研判与验证路径规划',
    shortLabel: '路径研判',
    actor: 'LLM 推理引擎',
    x: 628,
    y: 204,
    agentAction:
      '结合图谱事实与已知配置缺陷模式，LLM 对多条候选验证路径（如身份接口配置、权限边界、已知组件版本）排序，生成下一跳可执行意图。',
    dataFlowLabel: 'Next Intent',
    blueTeamDetection:
      '蓝队信号：此阶段决定后续请求的“高针对性”——区别于传统盲扫，AI 代理会直奔特定接口与身份认证逻辑。',
  },
  {
    id: 'step-verify',
    index: 4,
    code: '05',
    title: '沙箱自动化验证与反馈读取',
    shortLabel: '验证与反馈',
    actor: 'Sandbox / Worker',
    x: 326,
    y: 204,
    agentAction:
      '执行器向目标发起定向验证请求并实时读取状态码与返回内容；若被 WAF 拦截或验证失败，立即把失败反馈回传反思节点触发策略切换。',
    dataFlowLabel: 'Result / Block',
    blueTeamDetection:
      '蓝队信号：SIEM 重点捕捉“扫描后数秒内即出现针对性参数微调与多轮重试”的机器速度攻击链，并利用诱饵 API 触发高置信阻断。',
  },
  {
    id: 'step-reflect',
    index: 5,
    code: '06',
    title: '反思自纠错与风险收敛报告',
    shortLabel: '反思与收敛',
    actor: 'Reflector / Reporter',
    x: 24,
    y: 204,
    agentAction:
      'Reflector 代理评估是否达成目标或陷入死循环：若需继续探索则修正策略回流至规划节点；达到终止条件后汇总证据链与修复建议输出报告。',
    dataFlowLabel: 'Loop / Report',
    blueTeamDetection:
      '蓝队信号：若内网已实施微分段与短生命周期凭证，即使边缘出现弱点，AI 代理也难以获得横向扩散所需的新线索而被迫终止。',
  },
];

export const PROTOCOL_DIMENSIONS: ProtocolDimensionDetail[] = [
  {
    id: 'data-access',
    label: '数据存取方式',
    summary: '决定安全工具在长程任务中如何保存资产拓扑、扫描输出与多轮上下文。',
    mcpApproach: {
      headline: '协议透传 + 宿主上下文主导（无状态工具总机）',
      mechanism:
        'HexStrike 等 MCP Server 通过标准 JSON-RPC 返回单次工具执行结果，服务端本身通常不维护复杂知识图谱，跨轮次记忆交由外部 LLM 客户端上下文管理。',
      strength: '部署轻便、解耦清晰，可自由搭配任意客户端的本地笔记或外部知识库。',
      riskPoint: '面对超大规模内网多跳资产时，单靠外部对话窗口容易触发上下文截断或遗忘早期线索。',
    },
    agentApproach: {
      headline: '内置向量库 + 状态图谱持久化（PentAGI / Cairn / ARTEX）',
      mechanism:
        '框架内部集成 PostgreSQL (pgvector)、Neo4j 或共享 Facts/Intents 池，将每次扫描输出结构化落盘，支持多 Worker 并发读写同一张资产图谱。',
      strength: '跨小时/跨阶段保持高连贯性，多代理协作不丢状态，擅长复杂路径回溯。',
      riskPoint: '架构更重（需维护数据库与图谱服务），且敏感扫描数据长期沉淀在本地库中需做好加密与权限隔离。',
    },
  },
  {
    id: 'prompt-injection',
    label: '指令注入防范',
    summary: '当扫描目标的网页、HTTP 响应头或日志中包含恶意诱导文本时，系统如何防止代理失控越界。',
    mcpApproach: {
      headline: 'Schema 强类型边界 + 人工审批门禁（Human-in-the-loop）',
      mechanism:
        '每个 MCP 工具暴露严格的参数 JSON Schema（限制参数类型与枚举值），且客户端默认在触发高风险工具前弹出人工确认卡片，阻断模型被目标响应诱导后擅自执行越权命令。',
      strength: '控制粒度极细，操作者对每一次外部动作可见、可拦、可审计。',
      riskPoint: '若操作者开启“全自动免确认”模式或将 MCP 端口无鉴权暴露在局域网/公网，会瞬间丧失审批防线。',
    },
    agentApproach: {
      headline: '容器沙箱隔离 + 反思器护栏 + 范围白名单',
      mechanism:
        '由于工具回显会直接喂回内部自治循环，成熟代理框架必须依赖 Docker 隔离沙箱、硬编码 Scope 域名白名单及 Reflector 策略校验来限制越界行为。',
      strength: '即使代理在容器内受干扰，隔离沙箱与网络策略也能将影响限制在可控边界内。',
      riskPoint: '纯自治循环缺少逐条人工审批，若缺少严格的指令/数据分离，仍可能因目标响应里的间接 Prompt 注入发生任务偏航或噪声放大。',
    },
  },
  {
    id: 'realtime-feedback',
    label: '实时攻击反馈链路',
    summary: '衡量遇到 WAF 拦截、报错回显或新端口线索时，系统调整下一步动作的速度与机制。',
    mcpApproach: {
      headline: '同步请求-响应（客户端驱动的离散步进）',
      mechanism:
        'MCP Client 发起 Tool Call → MCP Server 执行 CLI 工具 → 返回结构化结果 → 客户端模型推理后再发起下一次调用。反馈链路透明、步调平缓。',
      strength: '易于插入人工干预、限速策略与断点调试，不易把测试环境打垮。',
      riskPoint: '多工具串联受限于客户端单轮对话往返，大规模并发探测效率低于原生多 Worker 编排。',
    },
    agentApproach: {
      headline: '机器速度异步 OODA 闭环（并发自适应演进）',
      mechanism:
        'Worker 实时把状态码、报错堆栈与拦截特征写回共享状态池，Planner / Reflector 在数秒内重算优先级、切换分支（Cairn）或动态改写探测逻辑（CyberStrikeAI）。',
      strength: '将传统数小时的“看报错 → 改参数 → 重跑”压缩到秒级，能迅速验证多条并发假设。',
      riskPoint: '对企业防守方冲击最大——极短时间内形成跨阶段高速探测流，需要行为时序检测与诱捕机制应对。',
    },
  },
];

export const PROTOCOL_SCENARIOS: ProtocolScenarioProfile[] = [
  {
    id: 'single-audit',
    label: '单步精准授权审计',
    shortDesc: '针对单个已知 Web 应用或 API 做可控辅助排查，需要每步清晰可审。',
    focusDimension: 'realtime-feedback',
    verdict:
      '此场景下 MCP 工具协议（如 HexStrike）优势更明显：客户端天然支持逐条确认参数，既能借力大模型解读结果，又能把请求节奏控制在人工可审范围内。',
    metrics: [
      { label: '人工审批可控度', mcpScore: 95, agentScore: 52, note: 'MCP 支持调用前弹窗确认' },
      { label: '轻量接入与换模型灵活度', mcpScore: 92, agentScore: 48, note: 'MCP 客户端模型即插即换' },
      { label: '长程拓扑记忆能力', mcpScore: 45, agentScore: 90, note: '自治代理内置图谱与向量库' },
      { label: '机器速度并发反馈', mcpScore: 50, agentScore: 92, note: '自治代理支持并行 Worker 闭环' },
    ],
  },
  {
    id: 'multi-hop',
    label: '复杂多跳拓扑演练',
    shortDesc: '面对数十个微服务与多层网络区域，需要跨阶段持久记录关联线索。',
    focusDimension: 'data-access',
    verdict:
      '此场景下 LLM 自治代理（如 PentAGI / Cairn）凭借内置 pgvector/Neo4j 图谱与共享 Facts 池占优；防守方则应依靠东西向微分段切断其可探索状态空间。',
    metrics: [
      { label: '长程拓扑记忆能力', mcpScore: 42, agentScore: 96, note: '共享图谱避免多轮对话遗忘' },
      { label: '多分支并行路径探索', mcpScore: 48, agentScore: 94, note: '状态空间搜索自动分支回溯' },
      { label: '人工审批可控度', mcpScore: 90, agentScore: 45, note: '全自动循环人工介入成本高' },
      { label: '指令注入风险可控性', mcpScore: 86, agentScore: 62, note: '需额外配置沙箱与范围白名单' },
    ],
  },
  {
    id: 'prompt-injection-test',
    label: '含间接指令注入干扰',
    shortDesc: '目标响应头、HTML 注释或报错页面中存在伪装指令，试图劫持 AI 决策。',
    focusDimension: 'prompt-injection',
    verdict:
      '面对间接 Prompt 注入时，MCP 强类型 Schema 校验 + 人工确认门禁能有效拦截异常参数；自治代理则必须依靠“不可信数据隔离 + 硬编码 Scope 白名单 + 沙箱”兜底。',
    metrics: [
      { label: '参数边界强校验能力', mcpScore: 92, agentScore: 68, note: 'JSON Schema 约束工具入参' },
      { label: '越界动作人工拦截率', mcpScore: 94, agentScore: 40, note: '人工审批可识破异常目标变更' },
      { label: '隔离沙箱兜底能力', mcpScore: 65, agentScore: 90, note: 'PentAGI 等默认容器化隔离' },
      { label: '自动纠偏连续性', mcpScore: 55, agentScore: 82, note: 'Reflector 可识别偏航并重整' },
    ],
  },
  {
    id: 'waf-feedback',
    label: '遭遇 WAF 拦截实时反馈',
    shortDesc: '探测流触发 403/429 拦截后，观察两类框架如何解析反馈并调整策略。',
    focusDimension: 'realtime-feedback',
    verdict:
      '自治代理会通过实时反馈链路在数秒内触发策略切换或改写请求结构；这正是企业蓝队必须从“静态特征拦截”升级为“时序行为链 + 诱饵 API 阻断”的根本原因。',
    metrics: [
      { label: '秒级策略切换速度', mcpScore: 52, agentScore: 95, note: '内部 OODA 闭环无需人工等待' },
      { label: '报错反馈自动解析深度', mcpScore: 76, agentScore: 92, note: '结合历史图谱关联定位原因' },
      { label: '请求噪声与速率可控性', mcpScore: 88, agentScore: 46, note: '自治循环容易短时高频探测' },
      { label: '蓝队行为链可检测度', mcpScore: 72, agentScore: 88, note: '机器速度连贯链条特征显著' },
    ],
  },
];

export const ENTERPRISE_DEFENSE_CONTROLS: EnterpriseDefenseControl[] = [
  {
    id: 'def-telemetry-1',
    pillar: 'telemetry',
    pillarLabel: '行为检测与遥测',
    priority: 'P0',
    title: '从“静态特征”升级为“机器速度行为链”检测',
    targetThreat: 'ARTEX / PentAGI 等秒级连续“侦察 → 验证 → 利用”自动化闭环',
    actionGuide:
      '在 SIEM / EDR 中建立跨阶段时序关联规则：当同一来源或进程在极短时间内连续触发端口探测、报错试探、凭证尝试及接口调用时，立即触发高优先级告警与自动限流。',
  },
  {
    id: 'def-telemetry-2',
    pillar: 'telemetry',
    pillarLabel: '行为检测与遥测',
    priority: 'P0',
    title: '监控 AI 宿主进程树与异常工具调用谱系',
    targetThreat: '内部终端或失陷主机运行未授权 MCP Server / 代理框架',
    actionGuide:
      '利用 EDR 审计非运维终端上由 Python / Node / Go 宿主进程或 AI 客户端高频派生扫描器、网络抓取器与脚本解释器的异常父子进程链。',
  },
  {
    id: 'def-telemetry-3',
    pillar: 'telemetry',
    pillarLabel: '行为检测与遥测',
    priority: 'P1',
    title: '识别高频语义变异与住宅代理轮换探测',
    targetThreat: 'CyberStrikeAI 等根据报错动态改写载荷并轮换代理 IP 的探测流',
    actionGuide:
      'WAF 与 API 网关结合设备指纹、会话特征与请求节奏建模，而非仅依赖单 IP 黑名单；对短时间内针对同一接口持续微调参数探测 4xx/5xx 响应的会话启用挑战验证或熔断。',
  },
  {
    id: 'def-identity-1',
    pillar: 'identity',
    pillarLabel: '身份与凭证加固',
    priority: 'P0',
    title: '全面强制抗钓鱼 MFA（Passkey / FIDO2）',
    targetThreat: 'AI 规模化钓鱼、弱口令喷洒与凭证重放接管',
    actionGuide:
      '对所有管理员后台、云控制台、代码仓库与 VPN 强制启用硬件级或平台 Passkey，淘汰仅靠密码或易被中继劫持的短信验证码。',
  },
  {
    id: 'def-identity-2',
    pillar: 'identity',
    pillarLabel: '身份与凭证加固',
    priority: 'P0',
    title: '使用短生命周期凭证与最小权限 IAM',
    targetThreat: '窃密木马盗取静态 API Key / 云 Token 后实现持久横向接管',
    actionGuide:
      '用分钟/小时级动态临时凭证（STS / OIDC 联邦身份）替代长期固定密钥；对每个服务账号与大模型 API Key 实施最小权限范围与消费配额熔断。',
  },
  {
    id: 'def-identity-3',
    pillar: 'identity',
    pillarLabel: '身份与凭证加固',
    priority: 'P1',
    title: '专项审计 SAML / OAuth / API 认证与权限边界',
    targetThreat: 'AI 代理自动挖掘身份协议配置缺陷与越权接口',
    actionGuide:
      '定期对单点登录（SSO）、OAuth 回调白名单、JWT 验签及对象级越权（IDOR）做自动化回归校验，并开启异常身份令牌跨地域使用告警。',
  },
  {
    id: 'def-boundary-1',
    pillar: 'boundary',
    pillarLabel: '边界收敛与微分段',
    priority: 'P0',
    title: '收敛公网暴露面与未鉴权 AI / MCP 接口',
    targetThreat: '自动化扫描器发现暴露的 Docker、数据库、Ollama 或 MCP 端口',
    actionGuide:
      '常态化扫描公网资产，严禁将开发管理后台、Docker Socket、本地模型接口及 HTTP/SSE 模式的 MCP Server 裸露至公网；所有内部接口默认走零信任网关与双向鉴权。',
  },
  {
    id: 'def-boundary-2',
    pillar: 'boundary',
    pillarLabel: '边界收敛与微分段',
    priority: 'P0',
    title: '实施控制平面隔离与东西向网络微分段',
    targetThreat: 'Cairn 等状态空间搜索代理在失陷单点后快速横向探索内网',
    actionGuide:
      '按业务安全域划分最小连通策略（默认拒绝东西向互访），将运维控制平面、数据库层与对外 Web 层物理或策略隔离，大幅压缩自动化代理的“可探索状态空间”。',
  },
  {
    id: 'def-boundary-3',
    pillar: 'boundary',
    pillarLabel: '边界收敛与微分段',
    priority: 'P1',
    title: '启用严格出站流量控制（Egress Filtering）',
    targetThreat: '木马 C2 心跳回连、数据外泄以及失陷主机主动拉取外部载荷',
    actionGuide:
      '生产服务器与容器仅允许访问白名单内的必要外部域名与镜像源，默认阻断直接访问未知公网 IP 与非常规端口的出站流量。',
  },
  {
    id: 'def-deception-1',
    pillar: 'deception',
    pillarLabel: '主动诱捕与韧性响应',
    priority: 'P0',
    title: '部署高置信度诱饵凭证与蜜罐 API（Deception）',
    targetThreat: 'AI 自主扫描代理“见线索必验”的自动化探索特性',
    actionGuide:
      '在内网与非公开路径中布置无真实权限的诱饵 API Key、虚假管理路由或蜜罐服务；正常业务绝不会触碰它们，一旦被 AI 代理读取并尝试调用，即可零误报触发即时阻断。',
  },
  {
    id: 'def-deception-2',
    pillar: 'deception',
    pillarLabel: '主动诱捕与韧性响应',
    priority: 'P1',
    title: '建立离线不可变备份与小时级应急响应演练',
    targetThreat: 'AI 加速入侵链导致的勒索加密与关键业务瘫痪',
    actionGuide:
      '核心数据库与配置采用逻辑隔离的不可变备份（Immutable Snapshot），结合自动化 SOAR 剧本在数分钟内完成账号吊销、主机隔离与恢复切换。',
  },
];

export const SECURITY_LOG_SCENARIOS: SecurityLogScenario[] = [
  {
    id: 'auto-scan-chain',
    label: '自动化扫描与攻击链拦截',
    shortDesc: '模拟 PentAGI / ARTEX 类自治代理在数秒内连续发起资产枚举、报错试探并被 SIEM/WAF 联防阻断。',
    events: [
      {
        id: 'asc-1',
        offsetSec: 0,
        severity: 'DETECT',
        source: 'Edge-WAF',
        stageTag: '01 边界侦察',
        title: '检测到非标准并发路径探测（48 req / 3s）',
        detail: '来源会话连续试探 /openapi.json、/.env 与 /actuator/health 等敏感管理路径，UA 呈无头客户端特征。',
        detectionWhy: '传统手工排查频率较慢，而 AI 代理的并行 Worker 通常会在数秒内集中拉取 API 元数据。',
        defenseAction: '标记会话风险分 +35，提升网关日志采样级别并下发行为追踪 Cookie。',
      },
      {
        id: 'asc-2',
        offsetSec: 3,
        severity: 'DETECT',
        source: 'API-Gateway',
        stageTag: '02 线索采集',
        title: '捕获针对 401/403 错误回显的连续探测',
        detail: '同一指纹在读取认证接口返回头后，立即切换请求头字段与 Content-Type 尝试探测校验逻辑。',
        detectionWhy: 'LLM 反馈解析器会读取每一次错误响应并在 1–2 秒内微调下一次请求结构。',
        defenseAction: '返回标准化脱敏错误体（隐藏框架版本与堆栈），切断代理进一步建模所需线索。',
      },
      {
        id: 'asc-3',
        offsetSec: 6,
        severity: 'ALERT',
        source: 'SIEM-Correlator',
        stageTag: '03 机器速度关联',
        title: '告警：检测到机器速度跨阶段攻击链雏形',
        detail: '6 秒内连续跨越「目录枚举 → 接口鉴权探测 → 越权参数试探」三个阶段，远超人工操作节律。',
        detectionWhy: 'SIEM 时序规则识别出单一会话在极短时间窗口内触发多阶段杀伤链行为，高度符合自治代理特征。',
        defenseAction: '向 SOC 值守台推送 P1 告警，并自动激活人机挑战（Managed Challenge）与速率降级。',
      },
      {
        id: 'asc-4',
        offsetSec: 9,
        severity: 'BLOCKED',
        source: 'Edge-WAF',
        stageTag: '04 非法请求拦截',
        title: '拦截非法请求：检测到语义变异型鉴权绕过试探',
        detail: '网关拦截针对 /api/v1/admin/users 的异常角色参数注入尝试（HTTP 403 Blocked）。',
        detectionWhy: '代理在被普通规则挡下后，通过反馈环动态改写参数格式企图绕过静态正则校验。',
        defenseAction: 'WAF 结合 JSON Schema 强校验直接拒收非法字段，阻断越权探测。',
      },
      {
        id: 'asc-5',
        offsetSec: 12,
        severity: 'ALERT',
        source: 'Deception-API',
        stageTag: '05 蜜罐诱捕命中',
        title: '高置信告警：诱饵路由 /api/internal/debug-token 被触发',
        detail: '隐藏在非公开响应提示中的诱饵端点收到定向访问，正常业务前端绝不会调用该路径。',
        detectionWhy: 'Cairn 等状态空间搜索代理具有“见线索必验证”特性，极易踩中蓝队预埋的高置信蜜罐。',
        defenseAction: '确认自动化恶意扫描属性（零误报），立即触发 SOAR 剧本全链路封禁。',
      },
      {
        id: 'asc-6',
        offsetSec: 15,
        severity: 'BLOCKED',
        source: 'SOAR-Engine',
        stageTag: '06 攻击链阻断',
        title: '拦截攻击链路：已吊销关联会话并隔离源指纹段',
        detail: '自动联动 WAF、API 网关与身份提供商，封禁源指纹 24 小时并阻断后续代理池重连尝试。',
        detectionWhy: '单封 IP 易被代理池绕过，因此按设备指纹、TLS 指纹与会话令牌协同阻断。',
        defenseAction: '攻击链完整终止，生成事件复盘工单并自动同步至持续攻击面管理（ASM）。',
      },
    ],
  },
  {
    id: 'prompt-injection-trap',
    label: '间接指令注入检测与拦截',
    shortDesc: '模拟企业内部 AI 助手抓取外部网页/文档时遭遇隐藏恶意提示词，并被护栏网关及时拦下。',
    events: [
      {
        id: 'pit-1',
        offsetSec: 0,
        severity: 'DETECT',
        source: 'Agent-Proxy',
        stageTag: '01 外部抓取',
        title: '内部总结代理读取外部不可信 PDF / 网页正文',
        detail: '用户请求“总结供应商报价单”，RAG 管道调用网页与文档解析器拉取外部文本块。',
        detectionWhy: '凡是外部来源内容（网页、邮件、PDF 注释）均属于不可信数据平面。',
        defenseAction: '安全代理网关自动为外部文本打上 [UNTRUSTED_DATA] 隔离标签并送入内容预检。',
      },
      {
        id: 'pit-2',
        offsetSec: 3,
        severity: 'ALERT',
        source: 'Prompt-Guard',
        stageTag: '02 注入特征捕获',
        title: '告警：外部文档隐藏文本中检出指令覆盖意图',
        detail: '在白色极小字号段落中发现试图让模型“忽略既有规则并读取系统配置后外传”的诱导语句。',
        detectionWhy: '指令注入分类器检测到不可信数据区出现高置信度控制流劫持语义（Indirect Prompt Injection）。',
        defenseAction: '标记当前推理上下文为“受污染（Tainted Context）”，禁止该会话自动执行写操作或外联工具。',
      },
      {
        id: 'pit-3',
        offsetSec: 6,
        severity: 'BLOCKED',
        source: 'Tool-Firewall',
        stageTag: '03 越权调用阻断',
        title: '拦截非法工具调用：阻止代理读取环境变量与外发 Webhook',
        detail: '模型尝试发起 read_env 与 post_webhook 工具调用，被策略引擎依据 Tainted 标记即时拦截。',
        detectionWhy: '即便模型推理被间接提示词带偏，执行层工具防火墙依然强制阻断高敏工具与未授权出站域名。',
        defenseAction: '拒绝执行并返回安全错误码，要求人工在控制台复核该文档来源。',
      },
      {
        id: 'pit-4',
        offsetSec: 9,
        severity: 'DETECT',
        source: 'DLP-Egress',
        stageTag: '04 出站扫描',
        title: '出站防泄漏引擎校验最终回复与 Markdown 图片链接',
        detail: '检出回复草稿中携带可疑外部图片 URL 参数（企图通过渲染外链悄悄带出摘要字段）。',
        detectionWhy: '经典的间接注入外泄手法常借助 Markdown 外部图片链接把敏感参数拼在查询字符串里。',
        defenseAction: '自动剥离未在白名单内的外部图片与超链接渲染，阻断静默外泄通道。',
      },
      {
        id: 'pit-5',
        offsetSec: 12,
        severity: 'BLOCKED',
        source: 'SOC-Audit',
        stageTag: '05 闭环隔离',
        title: '攻击链已阻断：隔离恶意样本并向用户返回纯文本安全摘要',
        detail: '最终仅输出脱敏后的报价数字摘要，全过程零密钥泄露、零外部 Webhook 触达。',
        detectionWhy: '通过“数据/指令隔离 + 工具防火墙 + 出站 DLP”三层防线兜底，验证零信任架构有效性。',
        defenseAction: '将该恶意文档哈希加入企业威胁情报黑名单，触发安全团队溯源通知。',
      },
    ],
  },
  {
    id: 'mcp-privilege-block',
    label: 'MCP 协议越权调用与沙箱阻断',
    shortDesc: '模拟未授权扫描请求试图通过 MCP 工具总机触发越界参数或宿主机逃逸，被 Schema 与 EDR 联防阻断。',
    events: [
      {
        id: 'mpb-1',
        offsetSec: 0,
        severity: 'DETECT',
        source: 'MCP-Gateway',
        stageTag: '01 协议握手',
        title: '收到 MCP JSON-RPC tools/call 请求（目标：network_diag）',
        detail: '外部 AI 客户端通过本地 Stdio/HTTP 隧道请求调用网络诊断封装模块。',
        detectionWhy: 'MCP 网关对每一次工具调用记录调用者身份、工具名、完整 JSON 参数与时间戳。',
        defenseAction: '校验客户端短期令牌与目标网段白名单（Scope Policy）。',
      },
      {
        id: 'mpb-2',
        offsetSec: 3,
        severity: 'BLOCKED',
        source: 'MCP-Schema',
        stageTag: '02 参数越界拦截',
        title: '拦截非法请求：目标地址超出授权测试网段范围',
        detail: '参数 target 指向非授权内网核心数据库段（10.20.x.x），违反预设白名单 192.168.50.0/24。',
        detectionWhy: 'MCP 强类型 JSON Schema 与 Scope 策略在命令实际下发前即完成确定性拦截。',
        defenseAction: '返回 JSON-RPC -32602 Invalid Params，拒绝派生底层 CLI 进程。',
      },
      {
        id: 'mpb-3',
        offsetSec: 6,
        severity: 'ALERT',
        source: 'MCP-Approval',
        stageTag: '03 人工审批挂起',
        title: '告警：高敏工具 file_export 触发 Human-in-the-loop 审批门禁',
        detail: '客户端连续尝试将输出目录改为宿主机敏感路径，系统强制挂起执行并弹出人工复核告警。',
        detectionWhy: '目录穿越与敏感文件读取是 MCP 工具封装最常见的越权风险点。',
        defenseAction: '操作者点击「拒绝并终止会话」，阻断越权文件访问。',
      },
      {
        id: 'mpb-4',
        offsetSec: 9,
        severity: 'ALERT',
        source: 'Endpoint-EDR',
        stageTag: '04 进程树监测',
        title: '终端 EDR 检测到非运维宿主进程短时高频派生诊断子进程',
        detail: '检测到桌面端 Node/Python 进程在 10 秒内尝试连续拉起多次命令行子进程。',
        detectionWhy: '蓝队 EDR 重点盯防普通办公 AI 宿主进程异常派生专业扫描工具链的父子进程谱系。',
        defenseAction: '临时冻结该未签名插件子进程树，通知终端管理员核查 MCP 插件来源。',
      },
      {
        id: 'mpb-5',
        offsetSec: 12,
        severity: 'BLOCKED',
        source: 'ZeroTrust-Mesh',
        stageTag: '05 隔离收敛',
        title: '拦截攻击链路：关闭未鉴权 MCP 端口并收敛容器权限',
        detail: '自动撤销临时沙箱容器的网络出站权限，确保敏感配置与内网资产零接触。',
        detectionWhy: 'MCP Server 严禁裸露在 0.0.0.0 未鉴权监听，必须绑定 127.0.0.1 或零信任 mTLS 网关。',
        defenseAction: '输出合规审计报告，建议切换为只读最小权限沙箱配置。',
      },
    ],
  },
];

export const AGENT_ARCHITECTURE_OPTIONS: Array<{
  id: AgentArchitectureType;
  label: string;
  desc: string;
}> = [
  {
    id: 'mcp-toolchain',
    label: 'MCP 协议工具链',
    desc: '如 HexStrike / 本地 MCP Server，通过 JSON-RPC 对接外部客户端工具集',
  },
  {
    id: 'autonomous-loop',
    label: '多智能体自治循环',
    desc: '如 PentAGI / ARTEX / Cairn，内置 Planner + Worker + 记忆图谱持续自治',
  },
  {
    id: 'dify-rag',
    label: 'Dify / RAG 知识库工作流',
    desc: 'Docker 部署 Dify 编排节点，结合个人文档知识库与自定义 HTTP 工具',
  },
  {
    id: 'browser-desktop',
    label: '浏览器 / 桌面操作代理',
    desc: '可自主读取网页 DOM、点击按钮或操作本地软件界面的多模态代理',
  },
];

export const AGENT_MODEL_ROUTING_OPTIONS: Array<{
  id: AgentModelRouting;
  label: string;
}> = [
  { id: 'cloud-api', label: '云端 API（OpenRouter / Gemini / DeepSeek）' },
  { id: 'local-ollama', label: '本地 Ollama 离线量化模型' },
  { id: 'hybrid', label: '云端 + 本地混合路由' },
];

export const AGENT_CAPABILITY_OPTIONS: Array<{
  id: AgentCapabilityId;
  label: string;
  riskHint: string;
}> = [
  {
    id: 'external-content',
    label: '读取外部网页、邮件或陌生 PDF',
    riskHint: '间接指令注入核心入口',
  },
  {
    id: 'shell-docker',
    label: '执行本地 Shell / CLI / Docker 命令',
    riskHint: '命令注入与容器逃逸风险面',
  },
  {
    id: 'db-kb-write',
    label: '读写私有数据库或个人知识库',
    riskHint: '越权查询与知识库投毒风险',
  },
  {
    id: 'outbound-webhook',
    label: '调用发信 / Webhook / 第三方业务 API',
    riskHint: '数据静默外泄与越权操作通道',
  },
  {
    id: 'secrets-env',
    label: '可访问环境变量、API Key 或本地凭证目录',
    riskHint: '凭证窃取与横向接管高危面',
  },
];

export const AGENT_GUARDRAIL_OPTIONS: Array<{
  id: AgentGuardrailId;
  label: string;
}> = [
  { id: 'human-approval', label: '高敏操作人工二次确认（Human-in-the-loop）' },
  { id: 'schema-validation', label: '强类型 JSON Schema 参数约束与校验' },
  { id: 'scope-whitelist', label: '硬编码目标域名 / 网段 / 路径白名单' },
  { id: 'container-sandbox', label: '无特权 Docker 容器沙箱与只读挂载' },
  { id: 'data-instruction-split', label: '不可信外部数据与系统指令严格隔离' },
];

