import { useCallback, useEffect, useRef, useState } from 'react';
import type { GlossaryEntry } from '../data/glossaryData';
import {
  findGlossaryMatchesWithOffsets,
  isPointInsideRect,
  isSkippableGlossaryTag,
  type RectBox,
} from '../utils/glossary';

export interface ActiveGlobalGlossaryTerm {
  entry: GlossaryEntry;
  matchedText: string;
  anchorRect: RectBox;
  pinned: boolean;
}

interface RegisteredTermRange {
  range: Range;
  entry: GlossaryEntry;
  matchedText: string;
}

export interface UseGlobalGlossaryDecoratorOptions {
  /** Enable/disable global DOM scanning and hover annotations. Defaults to true. */
  enabled?: boolean;
  /** Optional root container to observe; defaults to document.body. */
  rootElement?: HTMLElement | null;
}

const HIGHLIGHT_NAME = 'ai-glossary-term';

function isNodeIgnored(node: Node): boolean {
  let current: Node | null = node.parentNode;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const el = current as HTMLElement;
    if (isSkippableGlossaryTag(el.tagName)) {
      return true;
    }
    if (
      el.hasAttribute('data-glossary-term') ||
      el.getAttribute('data-glossary-ignore') === 'true' ||
      el.getAttribute('role') === 'tooltip' ||
      el.isContentEditable
    ) {
      return true;
    }
    current = el.parentNode;
  }
  return false;
}

function toRectBox(rect: DOMRect): RectBox {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Global React 19-safe hook that automatically detects English AI & cybersecurity terms
 * anywhere on the page using TreeWalker + MutationObserver, decorates them non-destructively
 * via the W3C CSS Custom Highlight API (zero DOM mutation), and powers interactive
 * hover/tap floating Chinese annotations.
 */
export function useGlobalGlossaryDecorator(
  options: UseGlobalGlossaryDecoratorOptions = {}
) {
  const { enabled = true, rootElement = null } = options;

  const [detectedCount, setDetectedCount] = useState<number>(0);
  const [activeTooltip, setActiveTooltip] = useState<ActiveGlobalGlossaryTerm | null>(null);

  const registeredRangesRef = useRef<RegisteredTermRange[]>([]);
  const activeTooltipRef = useRef<ActiveGlobalGlossaryTerm | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const rafPointerRef = useRef<number | null>(null);

  useEffect(() => {
    activeTooltipRef.current = activeTooltip;
  }, [activeTooltip]);

  const clearHoverCursor = () => {
    if (typeof document !== 'undefined') {
      delete document.documentElement.dataset.glossaryHover;
    }
  };

  const dismissTooltip = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    clearHoverCursor();
    setActiveTooltip(null);
  }, []);

  const clearCssHighlight = useCallback(() => {
    if (typeof CSS !== 'undefined' && 'highlights' in CSS) {
      CSS.highlights.delete(HIGHLIGHT_NAME);
    }
  }, []);

  const scanDocument = useCallback(() => {
    if (typeof document === 'undefined' || !enabled) {
      registeredRangesRef.current = [];
      clearCssHighlight();
      setDetectedCount(0);
      return;
    }

    const container = rootElement ?? document.body;
    if (!container) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = node.nodeValue;
        if (!value || value.trim().length < 2) {
          return NodeFilter.FILTER_REJECT;
        }
        // Quick ASCII pre-check so pure Chinese text nodes skip regex scanning
        if (!/[A-Za-z0-9]/.test(value)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (isNodeIgnored(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nextMatches: RegisteredTermRange[] = [];
    const domRanges: Range[] = [];

    let currentNode = walker.nextNode();
    while (currentNode) {
      const text = currentNode.nodeValue ?? '';
      const offsets = findGlossaryMatchesWithOffsets(text);
      for (const hit of offsets) {
        try {
          const range = document.createRange();
          range.setStart(currentNode, hit.start);
          range.setEnd(currentNode, hit.end);
          nextMatches.push({
            range,
            entry: hit.entry,
            matchedText: hit.matchedText,
          });
          domRanges.push(range);
        } catch {
          // Ignore stale text nodes if mutated mid-frame
        }
      }
      currentNode = walker.nextNode();
    }

    registeredRangesRef.current = nextMatches;
    setDetectedCount(nextMatches.length);

    if (
      typeof CSS !== 'undefined' &&
      'highlights' in CSS &&
      typeof Highlight !== 'undefined'
    ) {
      if (domRanges.length > 0) {
        CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...domRanges));
      } else {
        CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    }
  }, [enabled, rootElement, clearCssHighlight]);

  const scheduleScan = useCallback(() => {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
    }
    scanTimerRef.current = window.setTimeout(() => {
      scanDocument();
    }, 90);
  }, [scanDocument]);

  const findTermAtPoint = useCallback(
    (clientX: number, clientY: number): { item: RegisteredTermRange; rect: RectBox } | null => {
      const entries = registeredRangesRef.current;
      for (let i = 0; i < entries.length; i += 1) {
        const item = entries[i];
        if (!item.range.startContainer.isConnected) continue;
        const rects = item.range.getClientRects();
        for (let r = 0; r < rects.length; r += 1) {
          const box = toRectBox(rects[r]);
          if (isPointInsideRect(clientX, clientY, box, 2)) {
            return { item, rect: box };
          }
        }
      }
      return null;
    },
    []
  );

  // Observe DOM mutations & rescan automatically
  useEffect(() => {
    if (typeof document === 'undefined' || !enabled) {
      registeredRangesRef.current = [];
      clearCssHighlight();
      setDetectedCount(0);
      dismissTooltip();
      return;
    }

    const container = rootElement ?? document.body;
    if (!container) return;

    scanDocument();

    const observer = new MutationObserver((mutations) => {
      // Ignore pure attribute changes from tooltips/cursor flags
      const hasContentChange = mutations.some(
        (m) => m.type === 'childList' || m.type === 'characterData'
      );
      if (hasContentChange) {
        scheduleScan();
      }
    });

    observer.observe(container, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current);
      }
      clearCssHighlight();
      clearHoverCursor();
    };
  }, [enabled, rootElement, scanDocument, scheduleScan, clearCssHighlight, dismissTooltip]);

  // Delegated hover, tap/click, scroll, and Escape listeners
  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      // Don't compete with explicit <GlossaryText /> triggers or floating tooltips
      if (
        target?.closest('[data-glossary-term]') ||
        target?.closest('[role="tooltip"]') ||
        target?.closest('[data-glossary-ignore="true"]')
      ) {
        clearHoverCursor();
        return;
      }

      if (rafPointerRef.current !== null) return;
      const { clientX, clientY } = event;
      rafPointerRef.current = window.requestAnimationFrame(() => {
        rafPointerRef.current = null;
        const hit = findTermAtPoint(clientX, clientY);
        if (hit) {
          document.documentElement.dataset.glossaryHover = 'true';
          if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          const current = activeTooltipRef.current;
          if (
            !current ||
            current.entry.term !== hit.item.entry.term ||
            Math.abs(current.anchorRect.left - hit.rect.left) > 4 ||
            Math.abs(current.anchorRect.top - hit.rect.top) > 4
          ) {
            if (!current?.pinned) {
              setActiveTooltip({
                entry: hit.item.entry,
                matchedText: hit.item.matchedText,
                anchorRect: hit.rect,
                pinned: false,
              });
            }
          }
        } else {
          clearHoverCursor();
          const current = activeTooltipRef.current;
          if (current && !current.pinned && !closeTimerRef.current) {
            closeTimerRef.current = window.setTimeout(() => {
              closeTimerRef.current = null;
              if (activeTooltipRef.current && !activeTooltipRef.current.pinned) {
                setActiveTooltip(null);
              }
            }, 130);
          }
        }
      });
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-testid="global-glossary-tooltip"]')) {
        return;
      }
      // If user clicked a native interactive control (button/link/input), let that action proceed
      // unless they clicked non-interactive text directly
      if (
        target?.closest('[data-glossary-term]') ||
        target?.closest('[data-glossary-ignore="true"]')
      ) {
        dismissTooltip();
        return;
      }

      const hit = findTermAtPoint(event.clientX, event.clientY);
      if (hit && !target?.closest('button, a, input, select, textarea, label')) {
        const current = activeTooltipRef.current;
        if (current?.pinned && current.entry.term === hit.item.entry.term) {
          dismissTooltip();
        } else {
          if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
          setActiveTooltip({
            entry: hit.item.entry,
            matchedText: hit.item.matchedText,
            anchorRect: hit.rect,
            pinned: true,
          });
        }
      } else if (activeTooltipRef.current) {
        dismissTooltip();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeTooltipRef.current) {
        dismissTooltip();
      }
    };

    const handleScrollOrResize = () => {
      if (activeTooltipRef.current) {
        dismissTooltip();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      if (rafPointerRef.current !== null) {
        window.cancelAnimationFrame(rafPointerRef.current);
      }
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      clearHoverCursor();
    };
  }, [enabled, findTermAtPoint, dismissTooltip]);

  return {
    detectedCount,
    activeTooltip,
    dismissTooltip,
    rescan: scanDocument,
  };
}
