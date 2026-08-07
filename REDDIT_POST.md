# Post para r/DotA2

## Títulos (escolhe um)

1. `I built an open fantasy calculator for TI2026 — and found a trap where UPGRADING an emblem quality can LOWER your score`
2. `TI2026 Fantasy: the math says your team pick barely matters, but your 40 reroll tokens do. Open tool + all the data`
3. `Open-source TI2026 fantasy calculator — every calculator (including mine vs battlepass) is underestimating scores by ~30%, here's why`

Recomendo o **1**. É verificável no cliente de cada um, é útil, e não é auto-promoção.

---

## Corpo do post

Hey everyone. I spent the last week building an open calculator for the TI2026 Dream Team and Predictions, and along the way I found a few things that I don't think anyone has published. The tool is free, there's no signup, no ads, and all the data and code are on GitHub so you can check my work or fork it.

**Tool:** https://dota2fantasy.pages.dev
**Code + data:** https://github.com/kamusmg/fantasy-ti-2026

Let me lead with the findings rather than the tool, because the findings are the useful part.

---

### 1. With Fractal on your banner, raising a quality can LOWER your score

Fractal gives +60% **only if every quality on the banner is different**. So if you have `III / II / I` and you spend a token on "randomly increase one Quality" and it hits the middle emblem, you get `III / III / I` — Fractal switches off on **all three** emblems, and that emblem drops from 190% to 160%.

I didn't find this by reading the rules. I found it because a property-based test failed and I went looking for why. Same shape of trap exists with **Friendly**: it needs 3+ on the banner, so on a 3-emblem group-stage banner it means *all three*. Reroll the trait on one of them and you lose +50% on the other two.

Check your own banner before spending on a global quality upgrade.

---

### 2. Only your BEST series counts — and that breaks how everyone is doing the math

From the in-client glossary, verbatim:

> "We then average the score of all players for a role and use that to decide the final score for a game. **The top two scoring games within a series are used** to get the role's final score for the match. **If a role participates in more than one series in a period, the best scoring series will be used.**"

Two selection operators. `E[max] ≠ max[E]`. If you just sum average per-map scores — which is what every calculator I've seen does, including battlepass.ru — you underestimate the period by roughly **30%**, and, worse, you get the ranking between high-variance and low-variance stats **backwards**, because variance converts into expected score when you get to keep the best draw.

Second consequence nobody prices in: **playing more series is a free option**. A team that goes 4-0 plays 4 series. A team that drops to the elimination round plays 6. Six draws from the same distribution, keep the max. A mid-table team can genuinely be worth more than a favourite.

---

### 3. You don't choose your stats. So the fight isn't the team — it's the tokens.

Also from the glossary: *"Rerolling the stat of an emblem will guarantee a new stat."* Stat, quality and trait are **all rolled**. The only two things you actually choose are the **team per role** and the **coach title**, and both are free and unlimited until lock.

So I measured how much the team choice is actually worth, at the 75th percentile of possible banners:

| Role | 1st vs 16th | 1st vs 2nd |
|---|---|---|
| **Support** | **35%** | 13% |
| Mid | 11% | 1.1% — technical tie |
| Core | 7% | 0.9% — technical tie |

Core and Mid are coin flips at the top. **Support is where the team pick actually matters**, and it has one dominant answer.

Now compare that to what a good banner is worth (mean banner → p90 banner, same team):

| Role | Reroll payoff |
|---|---|
| **Mid** | **+47%** |
| Support | +23% |
| Core | +21% |

Getting the team right in Core or Mid is worth ~1%. Rerolling the Mid banner well is worth 47%. **Everyone is arguing about which carry to take, and the actual leverage is in the 40 tokens.**

Why Mid specifically? Because that's where luck weighs most. Look at the blue pool:

- **Mid blue:** Runes 1434 · Camps 465 · Lotus 212 · Watchers 178 · Wards 175 · Smokes 14
- **Support blue:** Watchers 1233 · Camps 1171 · Wards 1132 · Smokes 954 · Lotus 880 · Runes 711

Runes is worth 3× the next option and 100× the worst. Roll Smokes on your mid's blue and that emblem is worth nothing. On Support blue, four of six options are within 8% of the top — a bad roll barely hurts, so a token there buys you very little.

And one more rules-derived point: **a bad stat can only be fixed surgically on a GREEN emblem.** Red only has per-emblem *quality* targeting, blue only *trait*. On red and blue, upgrading the quality of a bad stat is polishing garbage.

---

### How the numbers are built (and where they come from)

I'm standing almost entirely on two people's work:

- **u/Maroomm's** [Fantasy League 2026 Guide](https://www.reddit.com/r/DotA2/comments/1vble84/fantasy_league_2026_guide/) — 13 tournaments, 1,601 matches, per-stat values for all 16 core duos, mids and support duos. This is the backbone.
- **[battlepass.ru's calculator](https://battlepass.ru/en/ti2026/fantasy-calc)** — 2,888 parsed replays, league-wide per-role stat values.

They're combined rather than averaged: battlepass provides the **level** (better-measured, TI-relevant pool), Reddit provides the **team delta** (which teams are above/below average), with empirical-Bayes shrinkage by sample size. The measured scale factor between them comes out at **1.02** across all three roles, which independently confirms that Reddit's core/support rows are pair sums and need halving.

Two things I'd flag as genuinely novel in the pipeline:

**Sample size estimated from the data itself.** For teams where battlepass doesn't publish a map count, I estimate it from the `top`/`average` ratio in Maroomm's table — since `E[max of n]` grows with `n`, a pair with a high average but a low ceiling has played few games. Calibrated against the teams whose counts *are* published: r = 0.69 / 0.68 / 0.52.

**Strength-of-schedule correction.** For each stat I measured the mean z-score of teams that made battlepass's TI-relevant top-8, minus those that didn't. Low Deaths for mid scores **−0.60**. Tormentor for core, **−0.98**. Towers, −0.76. Dying rarely and taking free objectives are markers of *weak opposition*, not skill. The correction only penalises, never rewards, because the positive direction is confounded with battlepass's own reference banner.

**Verification:** the model reproduces the four coach-title gains battlepass publishes to within 2%. The cross-check I'm happiest with: the blue-hero rate implied by their Cerulean gain (0.3234) matches the mean of Maroomm's hero-colour table (0.3153) — 2.5% apart, from two sources that never talk to each other.

---

### What I do NOT guarantee

- The per-stat coefficients of variation and the 0.55 intra-duo correlation are **my own assumptions**. Nobody published them. They're what produces the conclusion that Mid outscores Core. If you have real numbers, I'd love them.
- **No reroll probability is published anywhere.** So the token advice above is derived from the *rules*, not from an invented EV model.
- Predictions hit **~5 of 16** by my own model, against 3.75 for random. That's not the model being bad — ten of the 16 teams land in the elimination round where winning or losing is close to a coin flip. Those slots pay off for nobody.
- I got things wrong during this and had to revert them. It's in the commit history.

---

### Full disclosure

I built this with Claude Opus doing the heavy lifting on the modelling and the code. That's why the Predictions screen literally has a "Claude Opus" button next to the pro picks. I'm not hiding it — everything is open precisely so you can check whether the math holds instead of taking my word for it.

The Predictions screen lets you switch between whose board you're looking at. Right now it's the model vs Topson's picks. If you have a pro's or a streamer's actual board (screenshot, post, clip — something real, not "what they'd probably pick"), send it and I'll add them.

---

**Tear it apart.** Especially the assumed CVs and the strength-of-schedule correction — those are the two places I'd expect to be wrong. Issues and PRs welcome, MIT licensed, and if you just want the raw JSON tables they're in `src/data/raw/`.

---

## Notas de postagem

- Melhor horário: manhã/meio-dia no fuso dos EUA (r/DotA2 tem público EU+NA).
- Flair: **Discussion** ou **Tool** se existir.
- No primeiro comentário, cola a cola direta (os 3 times + título) pra quem não quer clicar. Reddit premia quem entrega valor sem exigir clique.
- Se alguém apontar erro, **corrige e diz que corrigiu**. É o que constrói credibilidade nesse sub.
- **Não** menciona a live no corpo do post — o link da Twitch já está discreto no rodapé do site. Auto-promoção explícita afunda post em r/DotA2.
