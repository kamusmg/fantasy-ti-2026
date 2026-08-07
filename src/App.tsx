import { useEffect, useState } from 'react';
import { BroadcastFrame } from './ui/BroadcastFrame';
import { DreamScene } from './features/dream/DreamScene';
import { PredictionsScene } from './features/predictions/PredictionsScene';
import { GuideScene } from './features/guide/GuideScene';
import { TraitsScene } from './features/traits/TraitsScene';
import { LangProvider, useLang } from './i18n/LangContext';
import type { Lang } from './i18n/strings';
import './ui/theme.css';

type Scene = 'dream' | 'predictions' | 'guide' | 'traits';

/**
 * Cena inicial pela URL: `#guia`, `#palpites`, `#sonhos`.
 *
 * Serve pro OBS: uma fonte de navegador por cena, cada uma abrindo ja na tela
 * certa, sem ninguem ter que apertar tecla no ar.
 */
const SCENE_BY_HASH: Readonly<Record<string, Scene>> = {
  '#sonhos': 'dream', '#dream': 'dream',
  '#palpites': 'predictions', '#predictions': 'predictions',
  '#guia': 'guide', '#guide': 'guide',
  '#tracos': 'traits', '#traits': 'traits',
};

function Shell() {
  const [scene, setScene] = useState<Scene>(() => SCENE_BY_HASH[window.location.hash] ?? 'dream');
  const { lang, setLang, t } = useLang();

  const scenes: readonly { readonly id: Scene; readonly key: string; readonly label: string }[] = [
    { id: 'dream', key: '1', label: t.dreamTitle },
    { id: 'predictions', key: '2', label: t.predictionsTitle },
    // Tecla G, nao 3: os numeros de 3 pra cima ja trocam de AUTOR dentro das
    // duas outras cenas, entao "3" mudaria de cena e de autor no mesmo aperto.
    { id: 'guide', key: 'G', label: t.guideTab },
    { id: 'traits', key: 'T', label: t.traitsTab },
  ];

  // Troca de cena por tecla: numa live, mexer o mouse na tela e sujeira.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setScene('dream');
      if (e.key === '2') setScene('predictions');
      if (e.key.toLowerCase() === 'g') setScene('guide');
      if (e.key.toLowerCase() === 't') setScene('traits');
      if (e.key.toLowerCase() === 'l') setLang(lang === 'pt' ? 'en' : 'pt');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lang, setLang]);

  return (
    <BroadcastFrame>
      {scene === 'dream' && <DreamScene />}
      {scene === 'predictions' && <PredictionsScene />}
      {scene === 'guide' && <GuideScene />}
      {scene === 'traits' && <TraitsScene />}

      {/*
        Abas no TOPO, centralizadas. No rodape ficavam na borda do palco e sumiam
        quando a janela nao era 16:9 — e a segunda cena so existe se alguem
        souber que ela existe.
      */}
      {/*
        Linha 1 do topo: cenas e idioma. A linha 2 (seletor de autor, dentro da
        cena de Palpites) fica em y=64 — antes as duas dividiam a mesma faixa e
        os botoes se cobriam.
      */}
      {/*
        Centralizado por `left/right: 0` + `justifyContent: center`, NAO por
        `left: 50%` + translate: naquele jeito a caixa so podia ocupar da metade
        da tela pra direita (960px), e ao chegar na quinta cena as abas quebravam
        em duas linhas. Centralizar por flex usa o palco inteiro.
      */}
      <div style={{ position: 'absolute', top: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, zIndex: 10 }}>
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScene(s.id)}
            style={{
              font: 'inherit', cursor: 'pointer', fontSize: 15, letterSpacing: '0.12em',
              padding: '8px 20px', borderRadius: 3, whiteSpace: 'nowrap',
              border: `2px solid ${scene === s.id ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
              color: scene === s.id ? 'var(--bg-deep)' : 'var(--gold)',
              background: scene === s.id ? 'var(--gold-bright)' : 'rgba(0,0,0,0.30)',
              fontWeight: scene === s.id ? 700 : 500,
            }}
          >
            {s.key} · {s.label}
          </button>
        ))}

        <div style={{ width: 14 }} />

        {(['pt', 'en'] as Lang[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            title="tecla L"
            style={{
              font: 'inherit', cursor: 'pointer', fontSize: 14, letterSpacing: '0.1em',
              padding: '8px 14px', borderRadius: 3,
              border: `2px solid ${lang === code ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
              color: lang === code ? 'var(--bg-deep)' : 'var(--gold)',
              background: lang === code ? 'var(--gold-bright)' : 'rgba(0,0,0,0.30)',
              fontWeight: lang === code ? 700 : 500,
            }}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      {/*
        Credito discreto no canto. Nivel do App pra aparecer nas duas cenas.
        Baixo contraste de proposito: quem procura acha, quem esta lendo a cola
        nao e interrompido.
      */}
      <a
        href="https://twitch.tv/kamusmg"
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'absolute', right: 26, bottom: 18, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 13, letterSpacing: '0.06em',
          color: 'var(--text-faint)', textDecoration: 'none',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9146FF', display: 'inline-block' }} />
        twitch.tv/kamusmg
      </a>
    </BroadcastFrame>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}
