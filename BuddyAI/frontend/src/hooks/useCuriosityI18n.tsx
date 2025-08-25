import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import axios from 'axios';

type Lang = 'en' | 'ar';

interface I18nCtx {
  pageLang: Lang;
  setPageLang: (l: Lang) => void;
  translateText: (text: string, target: Lang, source?: Lang) => Promise<string>;
  translateArray: (items: string[], target: Lang, source?: Lang) => Promise<string[]>;
}

const Ctx = createContext<I18nCtx | null>(null);

export const CuriosityI18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageLang, setPageLang] = useState<Lang>('en');
  const cacheRef = useRef<Map<string, string>>(new Map());

  const translateText = useCallback(async (text: string, target: Lang, source?: Lang) => {
    if (!text) return '';
    const key = `${target}|${text}`;
    const cached = cacheRef.current.get(key);
    if (cached !== undefined) return cached;
    try {
      const resp = await axios.post(`/api/core/translate/`, { text, sourceLang: source, targetLang: target }, { timeout: 15000 });
      const out = resp.data?.success ? (resp.data.translatedText as string) : text;
      cacheRef.current.set(key, out);
      return out;
    } catch {
      return text;
    }
  }, []);

  const translateArray = useCallback(async (items: string[], target: Lang, source?: Lang) => {
    const out: string[] = [];
    for (const item of items) {
      out.push(await translateText(item, target, source));
    }
    return out;
  }, [translateText]);

  const value = useMemo(() => ({ pageLang, setPageLang, translateText, translateArray }), [pageLang, translateArray, translateText]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCuriosityI18n = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCuriosityI18n must be used within CuriosityI18nProvider');
  return ctx;
};


