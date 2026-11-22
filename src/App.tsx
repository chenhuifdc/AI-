import { useEffect, useMemo, useState } from 'react';
import { PanelLeftOpen, Search } from 'lucide-react';
import { DecisionWizardModal } from './components/DecisionWizardModal';
import { GithubSearchSidebar } from './components/GithubSearchSidebar';
import { LifeCaseLabView } from './components/LifeCaseLabView';
import { MasteryToolboxView } from './components/MasteryToolboxView';
import { OpenSourceXRayView } from './components/OpenSourceXRayView';
import { SecurityDefenseView } from './components/SecurityDefenseView';
import { ToolchainBridgeView } from './components/ToolchainBridgeView';
import { TopNav } from './components/TopNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  INITIAL_TOOL_NOTES,
  LIFE_CASES,
  ROADMAP_STAGES,
} from './data/learningData';
import type { NavSection, ToolNote, ToolNoteDraft } from './types/learning';
import { computeMasteryProgress } from './utils/learningEngine';
import { getLatestCompletedTool } from './utils/similarTools';

const STORAGE_KEYS = {
  masteredCases: 'oss_lab_mastered_cases_v1',
  completedMilestones: 'oss_lab_completed_milestones_v1',
  toolNotes: 'oss_lab_tool_notes_v1',
  defenseControls: 'oss_lab_defense_controls_v1',
} as const;

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('bridge');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(LIFE_CASES[0].id);
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState<boolean>(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState<boolean>(false);

  const [masteredCaseIds, setMasteredCaseIds] = useState<string[]>(() =>
    loadStoredJson<string[]>(STORAGE_KEYS.masteredCases, ['family-finance-pdf'])
  );
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<string[]>(() =>
    loadStoredJson<string[]>(STORAGE_KEYS.completedMilestones, ['m1-1'])
  );
  const [toolNotes, setToolNotes] = useState<ToolNote[]>(() =>
    loadStoredJson<ToolNote[]>(STORAGE_KEYS.toolNotes, INITIAL_TOOL_NOTES)
  );
  const [checkedDefenseIds, setCheckedDefenseIds] = useState<string[]>(() =>
    loadStoredJson<string[]>(STORAGE_KEYS.defenseControls, ['def-identity-1', 'def-boundary-1'])
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.masteredCases,
        JSON.stringify(masteredCaseIds)
      );
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }, [masteredCaseIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.completedMilestones,
        JSON.stringify(completedMilestoneIds)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [completedMilestoneIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.toolNotes, JSON.stringify(toolNotes));
    } catch {
      // Ignore storage quota errors
    }
  }, [toolNotes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.defenseControls,
        JSON.stringify(checkedDefenseIds)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [checkedDefenseIds]);

  const totalMilestones = useMemo(
    () => ROADMAP_STAGES.reduce((sum, stage) => sum + stage.milestones.length, 0),
    []
  );

  const progress = useMemo(
    () =>
      computeMasteryProgress(
        masteredCaseIds,
        completedMilestoneIds,
        LIFE_CASES.length,
        totalMilestones
      ),
    [masteredCaseIds, completedMilestoneIds, totalMilestones]
  );

  const savedToolNames = useMemo(() => toolNotes.map((n) => n.name), [toolNotes]);
  const latestCompletedTool = useMemo(
    () => getLatestCompletedTool(toolNotes),
    [toolNotes]
  );

  const handleNavigateToSection = (section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveSection('cases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCaseMastered = (caseId: string) => {
    setMasteredCaseIds((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    );
  };

  const handleToggleMilestone = (milestoneId: string) => {
    setCompletedMilestoneIds((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  const handleAddToolNote = (draft: ToolNoteDraft) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextNote: ToolNote = {
      id: `note-${Date.now()}`,
      name: draft.name,
      platform: draft.platform,
      method: draft.method,
      lifeScenario: draft.lifeScenario,
      status: '待尝试',
      createdAt: today,
    };
    setToolNotes((prev) => [nextNote, ...prev]);
  };

  const handleToggleToolStatus = (noteId: string) => {
    setToolNotes((prev) =>
      prev.map((note) => {
        if (note.id !== noteId) return note;
        const becomingCompleted = note.status !== '已跑通';
        return {
          ...note,
          status: becomingCompleted ? '已跑通' : '待尝试',
          completedAt: becomingCompleted ? Date.now() : undefined,
        };
      })
    );
  };

  const handleDeleteToolNote = (noteId: string) => {
    setToolNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleToggleDefenseControl = (controlId: string) => {
    setCheckedDefenseIds((prev) =>
      prev.includes(controlId)
        ? prev.filter((id) => id !== controlId)
        : [...prev, controlId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900">
      <TopNav
        activeSection={activeSection}
        onSelectSection={handleNavigateToSection}
        onOpenWizard={() => setWizardOpen(true)}
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto flex items-start">
        {/* Desktop Persistent Collapsible Sidebar */}
        {sidebarOpenDesktop ? (
          <div className="hidden lg:block w-[332px] shrink-0 sticky top-16 h-[calc(100vh-4rem)] border-r border-slate-200 bg-white">
            <GithubSearchSidebar
              savedToolNames={savedToolNames}
              latestCompletedTool={latestCompletedTool}
              onSaveToToolbox={handleAddToolNote}
              onGoToToolbox={() => handleNavigateToSection('toolbox')}
              onCollapseDesktop={() => setSidebarOpenDesktop(false)}
            />
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center pt-5 px-2 shrink-0 sticky top-16">
            <button
              type="button"
              onClick={() => setSidebarOpenDesktop(true)}
              aria-label="展开 GitHub 场景检索侧边栏"
              title="展开 GitHub 场景检索侧边栏"
              className="p-2.5 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Mobile Trigger Bar for Sidebar Drawer */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setSidebarOpenMobile(true)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                <Search className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>GitHub 开源项目场景检索</span>
              </span>
              <span className="text-xs text-blue-700 font-medium whitespace-nowrap">
                打开侧边栏
              </span>
            </button>
          </div>

          {activeSection === 'bridge' && (
            <ToolchainBridgeView
              overallProgressPercent={progress.overallPercent}
              completedCasesCount={progress.completedCases}
              totalCasesCount={progress.totalCases}
              onNavigateToCase={handleNavigateToCase}
              onNavigateToSection={handleNavigateToSection}
            />
          )}

          {activeSection === 'xray' && <OpenSourceXRayView />}

          {activeSection === 'cases' && (
            <LifeCaseLabView
              selectedCaseId={selectedCaseId}
              onSelectCase={setSelectedCaseId}
              masteredCaseIds={masteredCaseIds}
              onToggleCaseMastered={handleToggleCaseMastered}
            />
          )}

          {activeSection === 'toolbox' && (
            <MasteryToolboxView
              progress={progress}
              completedMilestoneIds={completedMilestoneIds}
              onToggleMilestone={handleToggleMilestone}
              toolNotes={toolNotes}
              onAddToolNote={handleAddToolNote}
              onToggleToolStatus={handleToggleToolStatus}
              onDeleteToolNote={handleDeleteToolNote}
              onNavigateToSection={handleNavigateToSection}
              onNavigateToCase={handleNavigateToCase}
            />
          )}

          {activeSection === 'security' && (
            <SecurityDefenseView
              checkedDefenseIds={checkedDefenseIds}
              onToggleDefenseControl={handleToggleDefenseControl}
            />
          )}
        </main>
      </div>

      {/* Mobile Slide-Over Drawer for GitHub Search Sidebar */}
      {sidebarOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex bg-slate-900/45 backdrop-blur-[1px]"
          onClick={() => setSidebarOpenMobile(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="GitHub 场景检索抽屉"
            onClick={(e) => e.stopPropagation()}
            className="w-[88vw] max-w-[360px] h-full bg-white shadow-xl"
          >
            <GithubSearchSidebar
              savedToolNames={savedToolNames}
              latestCompletedTool={latestCompletedTool}
              onSaveToToolbox={handleAddToolNote}
              onGoToToolbox={() => {
                setSidebarOpenMobile(false);
                handleNavigateToSection('toolbox');
              }}
              onCloseMobile={() => setSidebarOpenMobile(false)}
              isMobileDrawer
            />
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            开源复用实验室 · 面向零代码 AI 实践者的 GitHub 与 Hugging Face 实战学习台
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigateToSection('bridge')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              能力图谱
            </button>
            <button
              type="button"
              onClick={() => handleNavigateToSection('xray')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              开源解剖台
            </button>
            <button
              type="button"
              onClick={() => handleNavigateToSection('cases')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              生活实战室
            </button>
            <button
              type="button"
              onClick={() => handleNavigateToSection('security')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              安全攻防
            </button>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="text-blue-700 font-medium hover:text-blue-800 transition-colors cursor-pointer"
            >
              打开选型诊断
            </button>
          </div>
        </div>
      </footer>

      <DecisionWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onJumpToCase={handleNavigateToCase}
      />

      <OfflineIndicator />
    </div>
  );
}
