import type { NavSection } from '../types/learning';
import { GlossaryControlsButton } from './GlossaryControlsButton';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenWizard: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: 'bridge', label: '能力图谱' },
  { id: 'xray', label: '开源解剖台' },
  { id: 'cases', label: '生活实战室' },
  { id: 'toolbox', label: '实战清单' },
  { id: 'security', label: '安全攻防' },
];

export function TopNav({ activeSection, onSelectSection, onOpenWizard }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('bridge')}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          开源复用实验室
        </button>

        {/* Zone 2: 5 Single-line Navigation Links */}
        <nav
          aria-label="主导航"
          className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectSection(item.id)}
                className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-blue-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Glossary Controls, PWA Install Action & Primary Diagnostic CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <GlossaryControlsButton />
          <PWAInstallButton />
          <button
            type="button"
            onClick={onOpenWizard}
            className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span className="sm:hidden">选型诊断</span>
            <span className="hidden sm:inline">工具选型诊断</span>
          </button>
        </div>
      </div>

      {/* Compact single-row mobile navigation (keeps total mobile sticky height well under 15% of 844px) */}
      <nav
        aria-label="移动端主导航"
        className="md:hidden border-t border-slate-100 px-2 py-1.5 flex items-center justify-between gap-1 overflow-x-auto bg-white"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectSection(item.id)}
              className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
