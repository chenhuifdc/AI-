import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Plus, Search, Trash2 } from 'lucide-react';
import { ROADMAP_STAGES } from '../data/learningData';
import type {
  MasteryProgressSummary,
  NavSection,
  ReuseMethod,
  ToolNote,
  ToolNoteDraft,
  ToolPlatform,
} from '../types/learning';
import { filterToolNotes, validateToolNoteInput } from '../utils/learningEngine';

interface MasteryToolboxViewProps {
  progress: MasteryProgressSummary;
  completedMilestoneIds: string[];
  onToggleMilestone: (milestoneId: string) => void;
  toolNotes: ToolNote[];
  onAddToolNote: (draft: ToolNoteDraft) => void;
  onToggleToolStatus: (noteId: string) => void;
  onDeleteToolNote: (noteId: string) => void;
  onNavigateToSection: (section: NavSection) => void;
  onNavigateToCase: (caseId: string) => void;
}

const REUSE_METHODS: ReuseMethod[] = [
  'Docker 部署',
  'HF Space 直用',
  'Ollama 本地拉取',
  'Dify 接口接入',
  'Agent 改造封装',
];

export function MasteryToolboxView({
  progress,
  completedMilestoneIds,
  onToggleMilestone,
  toolNotes,
  onAddToolNote,
  onToggleToolStatus,
  onDeleteToolNote,
  onNavigateToSection,
  onNavigateToCase,
}: MasteryToolboxViewProps) {
  const [platformFilter, setPlatformFilter] = useState<'ALL' | ToolPlatform>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form state for adding a custom open-source tool note
  const [name, setName] = useState<string>('');
  const [platform, setPlatform] = useState<ToolPlatform>('GitHub');
  const [method, setMethod] = useState<ReuseMethod>('Docker 部署');
  const [lifeScenario, setLifeScenario] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredNotes = useMemo(
    () => filterToolNotes(toolNotes, platformFilter, searchQuery),
    [toolNotes, platformFilter, searchQuery]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const draft: ToolNoteDraft = {
      name,
      platform,
      method,
      lifeScenario,
    };
    const validation = validateToolNoteInput(draft);
    if (!validation.valid) {
      setFormError(validation.error ?? '请完整填写工具名称与使用场景。');
      return;
    }

    onAddToolNote({
      name: draft.name.trim(),
      platform: draft.platform,
      method: draft.method,
      lifeScenario: draft.lifeScenario.trim(),
    });
    setName('');
    setLifeScenario('');
    setFormError(null);
  };

  return (
    <div className="space-y-12">
      {/* Header + Real-Time Mastery Progress Overview */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2 max-w-2xl">
          <p className="text-sm font-medium text-blue-700">
            系统化成长路线与个人开源资产库
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            四阶段实战清单与个人工具复用笔记
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            所有打卡记录与个人工具笔记均自动保存在当前浏览器本地。按阶段完成实操动作，逐步沉淀你专属的 GitHub 与 Hugging Face 武器库。
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 min-w-[280px] space-y-2.5 shrink-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium text-slate-600">
              {progress.currentStageLabel}
            </span>
            <span className="font-mono text-xl font-bold text-blue-700 tabular-nums">
              {progress.overallPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-700 rounded-full transition-all duration-300"
              style={{ width: `${progress.overallPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
            <span>
              清单打卡 {progress.completedMilestones}/{progress.totalMilestones}
            </span>
            <span>
              生活案例 {progress.completedCases}/{progress.totalCases}
            </span>
          </div>
        </div>
      </section>

      {/* 4-Stage Guided Mastery Roadmap */}
      <section aria-label="四阶段开源复用成长清单" className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          四阶段零代码开源复用路线图
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ROADMAP_STAGES.map((stage) => {
            const doneInStage = stage.milestones.filter((m) =>
              completedMilestoneIds.includes(m.id)
            ).length;

            return (
              <div
                key={stage.id}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="text-xs font-mono font-semibold text-blue-700">
                        {stage.stageNumber}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {stage.goal}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap shrink-0">
                      {doneInStage} / {stage.milestones.length}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {stage.milestones.map((milestone) => {
                      const checked = completedMilestoneIds.includes(milestone.id);
                      return (
                        <li
                          key={milestone.id}
                          className="flex items-start gap-3 py-1"
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`标记完成：${milestone.title}`}
                            onClick={() => onToggleMilestone(milestone.id)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 hover:border-blue-600'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                          </button>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  checked ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {milestone.title}
                              </span>
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                预计 {milestone.estimatedTime}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {milestone.practiceTask}
                            </p>
                            {milestone.linkedSection !== 'toolbox' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (milestone.linkedCaseId) {
                                    onNavigateToCase(milestone.linkedCaseId);
                                  } else {
                                    onNavigateToSection(milestone.linkedSection);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 pt-0.5 cursor-pointer"
                              >
                                <span>前往对应练习台</span>
                                <ArrowRight className="w-3 h-3" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal Open-Source Tool Notebook (Two-Zone: Left Library, Right Add Form) */}
      <section aria-label="我的开源复用卡片库" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Saved Open-Source Tools Library (~65%) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                我的开源工具复用笔记
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                共记录 {toolNotes.length} 个开源工具 · 已跑通{' '}
                {toolNotes.filter((n) => n.status === '已跑通').length} 个
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="按开源平台筛选"
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                {(['ALL', 'GitHub', 'Hugging Face'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    aria-pressed={platformFilter === plat}
                    onClick={() => setPlatformFilter(plat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      platformFilter === plat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {plat === 'ALL' ? '全部平台' : plat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="tool-search-input" className="sr-only">
              搜索已记录的开源工具或生活场景
            </label>
            <input
              id="tool-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工具名称、复用方式或生活场景（例如 PDF、体检、Docker）..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg space-y-1.5">
              <p className="text-sm font-medium text-slate-700">
                没有找到匹配的开源工具记录
              </p>
              <p className="text-xs text-slate-500">
                尝试清空搜索词，或在右侧表单中记录你刚发现的 GitHub / Hugging Face 宝藏工具。
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100" data-testid="tool-notes-list">
              {filteredNotes.map((note) => {
                const isDone = note.status === '已跑通';
                return (
                  <li
                    key={note.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span className="font-medium text-slate-700">{note.platform}</span>
                        <span aria-hidden="true">·</span>
                        <span>{note.method}</span>
                        <span aria-hidden="true">·</span>
                        <span>记录于 {note.createdAt}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 font-mono">
                        {note.name}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {note.lifeScenario}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleToolStatus(note.id)}
                        aria-label={`切换 ${note.name} 状态，当前为${note.status}`}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {note.status}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteToolNote(note.id)}
                        aria-label={`删除 ${note.name}`}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: Validated Add New Tool Form (~35%) */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              记录新发现的开源工具
            </h2>
            <p className="text-xs text-slate-500">
              逛 GitHub 或 Hugging Face 看到好工具？顺手记下它的零代码复用方式和生活场景。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="new-tool-name" className="block text-xs font-semibold text-slate-800">
                工具或模型名称
              </label>
              <input
                id="new-tool-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="例如：Crawl4AI 或 PaddleOCR Space"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="new-tool-platform" className="block text-xs font-semibold text-slate-800">
                  开源平台
                </label>
                <select
                  id="new-tool-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as ToolPlatform)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  <option value="GitHub">GitHub</option>
                  <option value="Hugging Face">Hugging Face</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="new-tool-method" className="block text-xs font-semibold text-slate-800">
                  零代码复用方式
                </label>
                <select
                  id="new-tool-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ReuseMethod)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {REUSE_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-tool-scenario" className="block text-xs font-semibold text-slate-800">
                打算解决什么生活/工作问题
              </label>
              <textarea
                id="new-tool-scenario"
                rows={3}
                value={lifeScenario}
                onChange={(e) => {
                  setLifeScenario(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="例如：用 Docker 部署后接入 Dify，每周日自动抓取并总结 5 个开源更新动态"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>添加到我的工具库</span>
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
