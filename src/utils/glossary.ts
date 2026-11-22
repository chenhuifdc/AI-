import {
  GLOSSARY_ENTRIES,
  type GlossaryCategory,
  type GlossaryEntry,
} from '../data/glossaryData';

export interface GlossaryTextSegment {
  type: 'text' | 'term';
  content: string;
  entry?: GlossaryEntry;
  suppressInlineGloss?: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface LookupRecord {
  key: string;
  entry: GlossaryEntry;
}

const LOOKUP_MAP = new Map<string, GlossaryEntry>();
const ALL_KEYS: string[] = [];

for (const entry of GLOSSARY_ENTRIES) {
  const forms = [entry.term, ...(entry.aliases ?? [])];
  for (const form of forms) {
    const normalized = form.toLowerCase();
    if (!LOOKUP_MAP.has(normalized)) {
      LOOKUP_MAP.set(normalized, entry);
      ALL_KEYS.push(form);
    }
  }
}

// Longest terms first so multi-word phrases like "Docker Compose" or "Prompt Injection"
// match completely before shorter sub-terms like "Docker" or "API".
ALL_KEYS.sort((a, b) => b.length - a.length);

const TERM_REGEX = new RegExp(
  `(?<![A-Za-z0-9_/-])(${ALL_KEYS.map(escapeRegExp).join('|')})(?![A-Za-z0-9_])`,
  'gi'
);

/**
 * Checks whether the surrounding text already explains the term in Chinese parentheses
 * or wraps the term inside parentheses right after a Chinese label (e.g. "指令注入（Prompt Injection）").
 * In that case, we still show the hover/tap tooltip, but suppress redundant inline "(中文)" text.
 */
export function shouldSuppressInlineGloss(
  fullText: string,
  matchStart: number,
  matchEnd: number
): boolean {
  const before = fullText.slice(Math.max(0, matchStart - 4), matchStart);
  const after = fullText.slice(matchEnd, Math.min(fullText.length, matchEnd + 4));

  // Pattern 1: "中文（EnglishTerm）" or "中文(EnglishTerm)"
  if (/[（(]\s*$/.test(before) && /^\s*[）)]/.test(after)) {
    return true;
  }
  // Pattern 2: "EnglishTerm（中文解释）" already followed immediately by Chinese parentheses
  if (/^\s*[（(][\u4e00-\u9fa5]/.test(after)) {
    return true;
  }
  // Pattern 3: Inside a slash list inside parentheses like "(pgvector / Neo4j)"
  if (/[（(][^）)]*$/.test(fullText.slice(Math.max(0, matchStart - 24), matchStart)) && /^[^（(]*[）)]/.test(fullText.slice(matchEnd, Math.min(fullText.length, matchEnd + 24)))) {
    return true;
  }
  return false;
}

/**
 * Tokenizes plain Chinese/English copy into text and matched glossary term segments.
 * Skips URLs (https://...) and avoids duplicating inline glosses for repeated mentions of the same term within one block.
 */
export function tokenizeGlossaryText(text: string): GlossaryTextSegment[] {
  if (!text) return [];

  const segments: GlossaryTextSegment[] = [];
  const seenInlineTerms = new Set<string>();

  // First protect URLs from accidental term matching inside domains/paths
  const urlRegex = /https?:\/\/[^\s)）]+/gi;
  const protectedRanges: Array<[number, number]> = [];
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    protectedRanges.push([urlMatch.index, urlMatch.index + urlMatch[0].length]);
  }

  const isInsideProtectedRange = (start: number, end: number) =>
    protectedRanges.some(([pStart, pEnd]) => start < pEnd && end > pStart);

  TERM_REGEX.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TERM_REGEX.exec(text)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    const end = start + matchedText.length;

    if (isInsideProtectedRange(start, end)) {
      continue;
    }

    const entry = LOOKUP_MAP.get(matchedText.toLowerCase());
    if (!entry) continue;

    if (start > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, start) });
    }

    const alreadyGlossedInBlock = seenInlineTerms.has(entry.term);
    const contextSuppress = shouldSuppressInlineGloss(text, start, end);
    const suppressInlineGloss = alreadyGlossedInBlock || contextSuppress;
    seenInlineTerms.add(entry.term);

    segments.push({
      type: 'term',
      content: matchedText,
      entry,
      suppressInlineGloss,
    });

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Filters glossary entries by category and free-text query (matches English term, aliases, or Chinese explanation).
 */
export function filterGlossaryTerms(
  entries: GlossaryEntry[],
  category: GlossaryCategory | 'ALL',
  query: string
): GlossaryEntry[] {
  const cleanQuery = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (category !== 'ALL' && entry.category !== category) {
      return false;
    }
    if (!cleanQuery) return true;
    return (
      entry.term.toLowerCase().includes(cleanQuery) ||
      (entry.aliases ?? []).some((a) => a.toLowerCase().includes(cleanQuery)) ||
      entry.shortCn.toLowerCase().includes(cleanQuery) ||
      entry.plainExplain.toLowerCase().includes(cleanQuery)
    );
  });
}

export function lookupGlossaryEntry(term: string): GlossaryEntry | undefined {
  return LOOKUP_MAP.get(term.trim().toLowerCase());
}

export interface GlossaryMatchOffset {
  start: number;
  end: number;
  matchedText: string;
  entry: GlossaryEntry;
}

export interface RectBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TooltipAnchorPosition {
  top: number;
  left: number;
  placement: 'top' | 'bottom';
}

const SKIPPABLE_GLOSSARY_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
  'OPTION',
  'SVG',
  'MATH',
  'KBD',
  'SAMP',
]);

/**
 * Returns true if an element tag should be skipped by the global auto-decorator
 * (e.g. code blocks, inputs, scripts, SVG diagrams).
 */
export function isSkippableGlossaryTag(tagName: string): boolean {
  return SKIPPABLE_GLOSSARY_TAGS.has(tagName.toUpperCase());
}

/**
 * Returns exact UTF-16 [start, end) character offsets of all glossary matches in a plain text node.
 * Skips URLs (https://...) and matches longest multi-word phrases first.
 */
export function findGlossaryMatchesWithOffsets(text: string): GlossaryMatchOffset[] {
  if (!text || text.trim().length < 2) return [];

  const urlRegex = /https?:\/\/[^\s)）]+/gi;
  const protectedRanges: Array<[number, number]> = [];
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    protectedRanges.push([urlMatch.index, urlMatch.index + urlMatch[0].length]);
  }

  const isInsideProtectedRange = (start: number, end: number) =>
    protectedRanges.some(([pStart, pEnd]) => start < pEnd && end > pStart);

  const matches: GlossaryMatchOffset[] = [];
  TERM_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TERM_REGEX.exec(text)) !== null) {
    const start = match.index;
    const matchedText = match[0];
    const end = start + matchedText.length;

    if (isInsideProtectedRange(start, end)) {
      continue;
    }

    const entry = LOOKUP_MAP.get(matchedText.toLowerCase());
    if (!entry) continue;

    matches.push({ start, end, matchedText, entry });
  }

  return matches;
}

/**
 * Checks whether viewport coordinates (x, y) fall within a DOMRect box (with optional touch/mouse tolerance).
 */
export function isPointInsideRect(
  x: number,
  y: number,
  rect: RectBox,
  paddingPx = 2
): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;
  return (
    x >= rect.left - paddingPx &&
    x <= rect.right + paddingPx &&
    y >= rect.top - paddingPx &&
    y <= rect.bottom + paddingPx
  );
}

/**
 * Computes viewport-clamped fixed coordinates for a floating glossary tooltip above or below an anchor rect.
 */
export function computeTooltipAnchorPosition(
  anchorRect: RectBox,
  viewportWidth: number,
  _viewportHeight: number,
  tooltipWidth = 280
): TooltipAnchorPosition {
  const margin = 12;
  const center = anchorRect.left + anchorRect.width / 2;
  const clampedLeft = Math.max(
    margin,
    Math.min(viewportWidth - tooltipWidth - margin, center - tooltipWidth / 2)
  );
  const placement: 'top' | 'bottom' = anchorRect.top > 150 ? 'top' : 'bottom';
  const top = placement === 'top' ? anchorRect.top - 8 : anchorRect.bottom + 8;
  return { top, left: clampedLeft, placement };
}

export type { LookupRecord };
