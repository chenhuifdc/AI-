import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useGlobalGlossaryDecorator } from '../hooks/useGlobalGlossaryDecorator';
import { GlobalGlossaryTooltip } from '../components/GlobalGlossaryLayer';

const GLOSSARY_INLINE_KEY = 'oss_lab_glossary_inline_v1';
const GLOSSARY_GLOBAL_AUTO_KEY = 'oss_lab_glossary_global_auto_v1';

interface GlossaryContextValue {
  inlineGlossEnabled: boolean;
  setInlineGlossEnabled: (enabled: boolean) => void;
  toggleInlineGloss: () => void;
  globalAutoEnabled: boolean;
  setGlobalAutoEnabled: (enabled: boolean) => void;
  autoDetectedCount: number;
}

const GlossaryContext = createContext<GlossaryContextValue>({
  inlineGlossEnabled: true,
  setInlineGlossEnabled: () => {},
  toggleInlineGloss: () => {},
  globalAutoEnabled: true,
  setGlobalAutoEnabled: () => {},
  autoDetectedCount: 0,
});

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [inlineGlossEnabled, setInlineGlossEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(GLOSSARY_INLINE_KEY);
      if (saved === null) return true;
      return saved === 'true';
    } catch {
      return true;
    }
  });

  const [globalAutoEnabled, setGlobalAutoEnabled] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(GLOSSARY_GLOBAL_AUTO_KEY);
      if (saved === null) return true;
      return saved === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GLOSSARY_INLINE_KEY, String(inlineGlossEnabled));
    } catch {
      // Ignore storage quota errors
    }
  }, [inlineGlossEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GLOSSARY_GLOBAL_AUTO_KEY, String(globalAutoEnabled));
    } catch {
      // Ignore storage quota errors
    }
  }, [globalAutoEnabled]);

  const { detectedCount, activeTooltip, dismissTooltip } = useGlobalGlossaryDecorator({
    enabled: globalAutoEnabled,
  });

  const value = useMemo<GlossaryContextValue>(
    () => ({
      inlineGlossEnabled,
      setInlineGlossEnabled,
      toggleInlineGloss: () => setInlineGlossEnabled((prev) => !prev),
      globalAutoEnabled,
      setGlobalAutoEnabled,
      autoDetectedCount: detectedCount,
    }),
    [inlineGlossEnabled, globalAutoEnabled, detectedCount]
  );

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <GlobalGlossaryTooltip activeTerm={activeTooltip} onDismiss={dismissTooltip} />
    </GlossaryContext.Provider>
  );
}

export function useGlossaryMode() {
  return useContext(GlossaryContext);
}
