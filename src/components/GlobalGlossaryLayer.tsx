import { createPortal } from 'react-dom';
import type { ActiveGlobalGlossaryTerm } from '../hooks/useGlobalGlossaryDecorator';
import { computeTooltipAnchorPosition } from '../utils/glossary';

interface GlobalGlossaryTooltipProps {
  activeTerm: ActiveGlobalGlossaryTerm | null;
  onDismiss: () => void;
}

/**
 * Portal-rendered floating Chinese annotation card for English terms discovered
 * automatically across the page by useGlobalGlossaryDecorator.
 */
export function GlobalGlossaryTooltip({
  activeTerm,
  onDismiss,
}: GlobalGlossaryTooltipProps) {
  if (!activeTerm || typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const pos = computeTooltipAnchorPosition(
    activeTerm.anchorRect,
    window.innerWidth,
    window.innerHeight,
    280
  );

  const { entry } = activeTerm;

  return createPortal(
    <div
      role="tooltip"
      data-testid="global-glossary-tooltip"
      data-glossary-ignore="true"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 280,
        transform: pos.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)',
        zIndex: 75,
      }}
      className="rounded-xl bg-slate-900 text-slate-100 border border-slate-700 shadow-xl p-3.5 text-left pointer-events-auto"
    >
      <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-slate-800">
        <span className="font-mono text-xs font-bold text-white">{entry.term}</span>
        <span className="text-[11px] font-semibold text-sky-300 shrink-0">
          {entry.shortCn}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans font-normal">
        {entry.plainExplain}
      </p>
      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mt-2">
        <span>{entry.category}</span>
        {activeTerm.pinned && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sky-300 hover:text-white cursor-pointer"
          >
            关闭
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
