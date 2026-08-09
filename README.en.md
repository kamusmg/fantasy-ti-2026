# The International 2026 Fantasy — open calculator

**[dota2fantasy.pages.dev](https://dota2fantasy.pages.dev)** · open calculator for the TI 2026
Dream Team and Predictions.

*[Leia em português](README.md)*

Built for [KamusMG](https://twitch.tv/kamusmg)'s stream. Data and engine are all here —
use it, copy it, disagree with it, open an issue.

---

## The short answer

| | Team | |
|---|---|---|
| **SUPPORT** (pos 4+5) | **LGD Gaming** — Thiolicor + KJ | 13% clear of second |
| **MID** (pos 2) | **Team Falcons** — Malr1ne | technical tie with BoomBoys |
| **CORE** (pos 1+3) | **TEAM VISION** — Satanic + Noticed | tied with LGD, broken by market odds |
| **COACH TITLE** | **the Clutch Cerulean** | +11% blue hero, +16% last possible match |

**Spend your 40 tokens on MID.** Worth +47%, double the other two roles — because Runes is
worth 3× the next-best blue stat, while Support's blue pool is flat.

**A bad stat can only be fixed directly on a GREEN emblem.** On red you can only target
quality, on blue only the trait. Upgrading the quality of a bad stat is polishing garbage.

⚠️ **With Fractal on the banner, RAISING a quality can LOWER your score.** It only pays when
all three qualities differ. No public calculator warns about this.

---

## What almost everyone models wrong

**You don't choose the stats.** From the in-client glossary: *"Rerolling the stat of an
emblem will guarantee a new stat."* Stat, quality and trait are all **rolled**. The only free
decisions are the **team per role** and the **coach title** — and both are free and unlimited
until lock. That's why the answer is three team names, not a "9-stat build".

**A role's score is the AVERAGE of its players**, not the sum. Core and Support are duos.

**Only the BEST series of the period counts**, and within it the **top 2 games**. Two
consequences nobody prices in:

1. Summing means underestimates the period by **~30%** and — worse — inverts the ranking
   between high- and low-variance stats. `E[max] ≠ max[E]`.
2. Playing **more series is a free option**. A 4-0 team plays 4 series; a team that drops to
   the elimination round plays 6. A mid-table team can be worth more than a favourite.

---

## The data

Everything lives in [`src/data/raw/`](src/data/raw), raw and with provenance.

| File | Contents | Source |
|---|---|---|
| `reddit.roleStats.json` | per-stat value for all 16 Core duos, 16 mids, 16 Support duos | [u/Maroomm's guide](https://www.reddit.com/r/DotA2/comments/1vble84/fantasy_league_2026_guide/) — 13 tournaments, 1,601 matches |
| `battlepass.leagueStats.json` | per-stat per-role league-wide values | [battlepass.ru](https://battlepass.ru/en/ti2026/fantasy-calc) — 2,888 replays |
| `battlepass.topRoles.json` | top-8 role scores per role + observed maps | same |
| `prefixFrequency.json` | hero-colour frequency for all 80 players | Reddit, same dataset |
| `teamStrength.json` | team strength for the Swiss simulation | Polymarket odds + OpenDota Elo |
| `teams.json` | all 16 rosters with positions | Liquipedia, cross-checked 3 ways |

**Reddit's Core and Support rows are PAIR SUMS** — the role score is the average, so we halve
them in `data/load.ts`. The raw file stays untouched.

### Two naming traps that cost real accuracy

**Valve makes betting-sponsored orgs play under aliases at TI:** TEAM VISION = **PariVision**,
BoomBoys = **BetBoom**, Iron Wing = **1w Team**, HULIGANI = **L1GA**. I got this wrong at first
and treated the reigning EWC 2026 champion as an unknown.

**Org ratings lie about the current roster.** Team Liquid's 1430 Elo comes from **3,132 games
of org history**, not the five who will play. Iron Wing shows 1280 off 30 games, but the
*players* are the ex-Tundra squad that won Birmingham and DreamLeague 29. And "Tundra Esports"
is no longer the roster that won those titles — five different people. That's why the primary
strength source is the **betting market**, which prices who actually walks on stage.

**When a player leaves after the tables were published.** On 2026-08-09 TaiLung was banned
from TI for match fixing and Topson took the LGD mid slot. Renaming him in `teams.json` would
have removed his name from the screen and left **his statistics quietly recommending teams
underneath** — both sources measured TaiLung. So a roster change is its own fact, in
`rosterChanges.json`, and it *invalidates* that (team, role) pair: the pair stays selectable,
but falls back to the league average with a `NO OWN DATA` badge and zero shrink weight. Topson
appears in neither table — they cover the 16 qualified teams, and Tundra did not qualify — so
the swap deletes a number rather than replacing one. LGD's mid goes from 6th to 7th of 16
(−0.8%) and its best banner reverts from *Creep Score* to *Deaths*, like the other fifteen:
the anomaly was the player, not the team. The site's recommendation does not change.

---

## How the engine decides

**Level from battlepass, team delta from Reddit.** `estimate = leagueMean + w·k·teamDelta`,
with `w = n/(n+n₀)` empirical Bayes. The measured scale factor comes out at **1.02** across
all three roles, independently confirming the pair-halving.

**Sample size estimated, not assumed.** For teams without a published map count, sample size
comes from the `top`/`average` ratio in Reddit's table — `E[max of n]` grows with `n`.
Calibrated against teams whose count is known: **r = 0.69 / 0.68 / 0.52**.

**Strength-of-schedule correction.** Measured per stat: mean z-score of teams that made the
TI-relevant top-8 minus those that didn't. Low Deaths for mid scores **−0.60**; Tormentor for
core, **−0.98**. Dying rarely and taking free objectives are markers of weak opposition. The
correction is **asymmetric** (penalty only) because the positive direction is confounded with
battlepass's own reference banner.

**Recommendation at the p75, not the mean or the best case.** The "best banner" is a maximum
over ~200 noisy assignments — whoever wins it tends to be whoever carries the largest
estimation error. Measured: OG at mid goes from 16th at the mean to 4th at the maximum
**without climbing in between**. Textbook winner's curse, and it was cut.

**Exact optimiser.** 9,216 candidates × 64 titles in ~200 ms. Roles aren't independent because
the title applies to all five players, but with the title *fixed* they become separable again —
so it's an outer loop over titles, and each role takes its own maximum. No pruning, no
heuristics.

---

## Verification

The oracle test reproduces the **four title gains published by battlepass.ru** to within 2%,
validating units, source blending, the coach model and the averaging rule in one shot. The
strongest cross-check: the blue-hero rate implied by the Cerulean gain (battlepass, 0.3234)
matches the mean of our Reddit frequency table (0.3153) — **2.5% apart, between sources that
never talk to each other**.

54 tests. NaN guard across the full enumeration, bit-identical deterministic output,
`Math.random` and `Date.now` banned inside `engine/`.

The strongest validation came from outside: **two** real banner screenshots, from two
different players, each reproduce all **nine percentages** exactly — eighteen numbers,
zero fitting. The second one carries the case that separates a correct model from an
almost-correct one: with **two Uniques** on the same banner, the client shows **both**
worth zero. A model that rewarded the first would get eight of his nine numbers right.

The first screenshot already showed the same Fractal trait worth +80% on one
banner and +20% on another — because on one the three tiers are distinct and on the
other they are not.

Two in-game traps were **found by property testing** and are now pinned: raising a quality can
lower the banner (it breaks Fractal), and swapping a trait for Benevolent can hurt neighbours
(it breaks the Friendly threshold).

---

## What I do NOT guarantee

- **The per-stat coefficients of variation and the 0.55 intra-duo correlation are my own
  assumptions.** Nobody published them. They're what produces the conclusion that Mid outscores
  Core.
- **No reroll probability is published anywhere.** That's why the token guidance is derived from
  the *rules*, not from an invented EV model.
- **Predictions hit ~5 of 16**, against 3.75 for pure guessing. That isn't the model being bad:
  ten of the 16 teams land in the elimination round, where winning or losing is close to a coin
  flip.

---

## Running it

```bash
npm install
npm run dev          # full screen; keys 1 2 G T switch scenes, L switches language
npm test             # 54 tests

npx vite-node scripts/cola.ts       # the cheat sheet, in the terminal
npx vite-node scripts/palpites.ts   # the 16 predictions with stability
npx vite-node scripts/report.ts     # data audit
node scripts/fetch-portraits.mjs    # re-download photos from Valve's CDN
node scripts/optimize-images.mjs    # shrink 71 MB -> 1.4 MB
```

Photos and logos are Valve's official ones:
`cdn.cloudflare.steamstatic.com/apps/dota2/players/{account_id}.png` plus OpenDota's
`logo_url`. Two similar-looking paths **don't** work: `images/players/` only has 19 of the 80,
and `images/team_logos/` only answers for the older orgs.

## Licence

MIT for the code. The data is aggregated from the public sources credited above — if you use
it, credit them too.
