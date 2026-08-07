import { useEffect, useState } from 'react';
import { BroadcastFrame } from './ui/BroadcastFrame';
import { DreamScene } from './features/dream/DreamScene';
import { PredictionsScene } from './features/predictions/PredictionsScene';
import './ui/theme.css';

type Scene = 'dream' | 'predictions';

const SCENES: readonly { readonly id: Scene; readonly key: string; readonly label: string }[] = [
  { id: 'dream', key: '1', label: 'Dota dos Sonhos' },
  { id: 'predictions', key: '2', label: 'Palpites' },
];

export default function App() {
  const [scene, setScene] = useState<Scene>('dream');

  // Troca de cena por tecla: numa live, mexer o mouse na tela e sujeira.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = SCENES.find((s) => s.key === e.key);
      if (target) setScene(target.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <BroadcastFrame>
      {scene === 'dream' ? <DreamScene /> : <PredictionsScene />}

      {/*
        Abas no TOPO, centralizadas. No rodape elas ficavam na borda do palco e
        sumiam quando a janela nao era 16:9 — e a segunda cena so existe se
        alguem souber que ela existe.
      */}
      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 10 }}>
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScene(s.id)}
            style={{
              font: 'inherit',
              cursor: 'pointer',
              fontSize: 15,
              letterSpacing: '0.12em',
              padding: '8px 22px',
              borderRadius: 3,
              border: `2px solid ${scene === s.id ? 'var(--gold-bright)' : 'var(--gold-line)'}`,
              color: scene === s.id ? 'var(--bg-deep)' : 'var(--gold)',
              background: scene === s.id ? 'var(--gold-bright)' : 'rgba(0,0,0,0.30)',
              fontWeight: scene === s.id ? 700 : 500,
            }}
          >
            {s.key} · {s.label.toUpperCase()}
          </button>
        ))}
      </div>
    </BroadcastFrame>
  );
}
