import portraits from '../data/generated/portraits.json';

const players = portraits.players as Readonly<Record<string, string>>;
const teams = portraits.teams as Readonly<Record<string, string>>;

export function hasPortrait(playerId: string): boolean {
  return players[playerId] !== undefined;
}

/**
 * Foto oficial do jogador — a mesma que o cliente do Dota usa.
 *
 * As imagens sao corpo inteiro em alta, entao o recorte e `cover` com
 * `object-position: top`: pega o rosto e descarta o resto. Sem foto, cai numa
 * silhueta com a inicial, igual ao cliente faz com quem nao tem retrato.
 */
export function PlayerPortrait({
  playerId, nick, size,
}: {
  readonly playerId: string;
  readonly nick: string;
  readonly size: number;
}) {
  const src = players[playerId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, width: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid var(--gold-line)',
          background: 'linear-gradient(180deg, var(--bg-slot) 0%, var(--bg-mid) 100%)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={nick}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        ) : (
          <span className="display" style={{ fontSize: size * 0.42, color: 'var(--gold-dim)' }}>
            {nick.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: Math.max(13, size * 0.17),
          color: 'var(--text)',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.15,
          maxWidth: size + 10,
        }}
      >
        {nick}
      </span>
    </div>
  );
}

export function TeamLogo({ teamId, size }: { readonly teamId: string; readonly size: number }) {
  const src = teams[teamId];
  if (!src) return null;
  return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
}
