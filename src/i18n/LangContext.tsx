import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { STRINGS } from './strings';
import type { Lang } from './strings';

const STORAGE_KEY = 'fantasy-ti-lang';

interface LangValue {
  readonly lang: Lang;
  readonly setLang: (lang: Lang) => void;
  readonly t: (typeof STRINGS)[Lang];
}

const LangContext = createContext<LangValue | null>(null);

/**
 * Idioma da tela.
 *
 * Comeca no idioma do navegador e guarda a escolha — quem abre o link vindo da
 * live nao deveria ter que clicar pra ler na propria lingua.
 */
export function LangProvider({ children }: { readonly children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
    return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang precisa estar dentro de <LangProvider>');
  return value;
}
