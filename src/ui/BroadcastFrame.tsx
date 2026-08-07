import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

/**
 * Palco fixo de 1920x1080 escalado por transform.
 *
 * Nao e preciosismo: layout fluido reflui entre um take e outro da live, e texto
 * que muda de posicao sozinho na tela destroi a leitura de quem esta assistindo.
 * Aqui tudo tem posicao absoluta em pixels e so o palco inteiro escala.
 */
export function BroadcastFrame({ children }: { readonly children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className="broadcast-root">
      <div className="broadcast-stage" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
