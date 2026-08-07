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

      <div style={{ position: 'absolute', top: 26, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {SCENES.map((s) => (
          <div
            key={s.id}
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              padding: '4px 12px',
              borderRadius: 2,
              border: `1px solid ${scene === s.id ? 'var(--gold)' : 'var(--gold-line)'}`,
              color: scene === s.id ? 'var(--gold-bright)' : 'var(--text-faint)',
              background: scene === s.id ? 'rgba(200,160,90,0.10)' : 'transparent',
            }}
          >
            {s.key} · {s.label.toUpperCase()}
          </div>
        ))}
      </div>
    </BroadcastFrame>
  );
}
