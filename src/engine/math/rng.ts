/**
 * Gerador com SEMENTE — a unica fonte de aleatoriedade do motor.
 *
 * Requisito duro, nao capricho: um numero que oscila entre um take e outro na
 * live destroi a credibilidade da ferramenta. Mesma entrada tem que dar saida
 * bit a bit identica, sempre. `Math.random` e `Date.now` sao proibidos dentro
 * de engine/ — ha um teste que varre os arquivos atras deles.
 *
 * xoshiro128** — rapido, periodo 2^128-1, qualidade estatistica boa o bastante
 * pra Monte Carlo.
 */
export interface Rng {
  /** Uniforme em [0, 1). */
  next(): number;
  /** Normal padrao via Box-Muller com cache do segundo valor. */
  nextNormal(): number;
}

function splitmix32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export function createRng(seed: number): Rng {
  const seeder = splitmix32(seed);
  let s0 = seeder();
  let s1 = seeder();
  let s2 = seeder();
  let s3 = seeder();

  let spare: number | null = null;

  const nextUint32 = (): number => {
    const result = Math.imul(s1, 5) >>> 0;
    const rotated = ((result << 7) | (result >>> 25)) >>> 0;
    const out = Math.imul(rotated, 9) >>> 0;

    const t = (s1 << 9) >>> 0;
    s2 = (s2 ^ s0) >>> 0;
    s3 = (s3 ^ s1) >>> 0;
    s1 = (s1 ^ s2) >>> 0;
    s0 = (s0 ^ s3) >>> 0;
    s2 = (s2 ^ t) >>> 0;
    s3 = ((s3 << 11) | (s3 >>> 21)) >>> 0;
    return out;
  };

  return {
    next(): number {
      return nextUint32() / 4294967296;
    },
    nextNormal(): number {
      if (spare !== null) {
        const value = spare;
        spare = null;
        return value;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = this.next() * 2 - 1;
        v = this.next() * 2 - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const factor = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * factor;
      return u * factor;
    },
  };
}

/** Semente fixa do projeto. Trocar muda todo numero de Monte Carlo da tela. */
export const BROADCAST_SEED = 20260813;
