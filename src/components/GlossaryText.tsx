import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GlossaryEntry } from '../data/glossaryData';
import { useGlossaryMode } from '../context/GlossaryContext';
import { tokenizeGlossaryText } from '../utils/glossary';

interface GlossaryTextProps {
  text: string;
  /** Force disable inline Chinese parentheses for tight headings/labels while keeping hover/tap tooltip */
  tooltipOnly?: boolean;
  /** Light or dark surface styling */
  tone?: 'light' | 'dark';
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

function InteractiveTerm({
  displayText,
  entry,
  showInlineGloss,
  tone,
}: {
  displayText: string;
  entry: GlossaryEntry;
  showInlineGloss: boolean;
  tone: 'light' | 'dark';
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [pos, setPos] = useState<TooltipPosition | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const pinnedRef = useRef<boolean>(false);

  const computePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 280;
    const margin = 12;
    const center = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      margin,
      Math.min(window.innerWidth - tooltipWidth - margin, center - tooltipWidth / 2)
    );
    const spaceAbove = rect.top;
    const placement: 'top' | 'bottom' = spaceAbove > 140 ? 'top' : 'bottom';
    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
    setPos({ top, left: clampedLeft, placement });
  };

  const openTooltip = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    computePosition();
    setOpen(true);
  };

  const scheduleClose = () => {
    if (pinnedRef.current) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      if (!pinnedRef.current) {
        setOpen(false);
      }
    }, 120);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: Event) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        pinnedRef.current = false;
        setOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      pinnedRef.current = false;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const underlineClass =
    tone === 'dark'
      ? 'border-b border-dashed border-sky-400/75 text-sky-200 hover:text-white'
      : 'border-b border-dashed border-blue-400/90 hover:border-blue-700 hover:text-blue-800';

  const inlineNoteClass =
    tone === 'dark'
      ? 'text-[0.88em] font-normal text-slate-400 ml-0.5'
      : 'text-[0.88em] font-normal text-slate-500 ml-0.5';

  const tooltipNode =
    open && pos ? (
      <div
        role="tooltip"
        data-testid="glossary-tooltip-popover"
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: 280,
          transform: pos.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)',
          zIndex: 70,
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
        <div className="text-[10px] text-slate-400 mt-2">{entry.category}</div>
      </div>
    ) : null;

  return (
    <span className="inline">
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={`${entry.term}（${entry.shortCn}）：${entry.plainExplain}`}
        data-glossary-term={entry.term}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleClose}
        onFocus={openTooltip}
        onBlur={scheduleClose}
        onClick={(e) => {
          e.stopPropagation();
          if (pinnedRef.current) {
            pinnedRef.current = false;
            setOpen(false);
          } else {
            pinnedRef.current = true;
            openTooltip();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (pinnedRef.current) {
              pinnedRef.current = false;
              setOpen(false);
            } else {
              pinnedRef.current = true;
              openTooltip();
            }
          } else if (e.key === 'Escape') {
            pinnedRef.current = false;
            setOpen(false);
          }
        }}
        className={`inline cursor-help transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-[2px] ${underlineClass}`}
      >
        {displayText}
      </span>
      {showInlineGloss && (
        <span data-testid="inline-cn-gloss" className={inlineNoteClass}>
          （{entry.shortCn}）
        </span>
      )}
      {tooltipNode && typeof document !== 'undefined'
        ? createPortal(tooltipNode, document.body)
        : null}
    </span>
  );
}

export function GlossaryText({
  text,
  tooltipOnly = false,
  tone = 'light',
}: GlossaryTextProps) {
  const { inlineGlossEnabled } = useGlossaryMode();
  const segments = tokenizeGlossaryText(text);

  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.type === 'text' || !seg.entry) {
          return <span key={idx}>{seg.content}</span>;
        }
        const showInline =
          inlineGlossEnabled && !tooltipOnly && !seg.suppressInlineGloss;
        return (
          <InteractiveTerm
            key={`${seg.entry.term}-${idx}`}
            displayText={seg.content}
            entry={seg.entry}
            showInlineGloss={showInline}
            tone={tone}
          />
        );
      })}
    </>
  );
}
