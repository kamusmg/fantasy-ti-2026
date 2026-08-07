import { useEffect, useState } from 'react';
import { BroadcastFrame } from './ui/BroadcastFrame';
import { DreamScene } from './features/dream/DreamScene';
import { PredictionsScene } from './features/predictions/PredictionsScene';
import { LangProvider, useLang } from './i18n/LangContext';
import type { Lang } from './i18n/strings';
import './ui/theme.css';

type Scene = 'dream' | 'predictions';

function Shell() {
  const [scene, setScene] = useState<Scene>('dream');
  const { lang, setLang, t } = useLang();

  const scenes: readonly { readonly id: Scene; readonly key: string; readonly label: string }[] = [
    { id: 'dream', key: '1', label: t.dreamTitle },
    { id: 'predictions', key: '2', label: t.predictionsTitle },
  ];

  // Troca de cena por tecla: numa live, mexer o mouse na tela e sujeira.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setScene('dream');
      if (e.key === '2') setScene('predictions');
      if (e.key.toLowerCase() === 'l') setLang(lang === 'pt' ? 'en' : 'pt');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lang, setLang]);

  return (
    <BroadcastFrame>
      {scene === 'dream' ? <DreamScene /> : <PredictionsScene />}

      {/*
        Abas no TOPO, centralizadas. No rodape ficavam na borda do palco e sumiam
        quando a janela nao era 16:9 — e a segunda cena so existe se alguem
        souber que ela existe.
      */}
      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10 }}>
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScene(s.id)}
            style={{
              font: 'inherit', cursor: 'pointer', fontSize: 15, letterSpacing: '0.12em',
              padding: '8px 22px', borderRadius: 3,
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
