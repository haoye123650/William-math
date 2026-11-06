# 尹健熙 · Pui Kiu Mathematics

DSE-style mathematics papers for a Pui Kiu student. Tests 1–3 are junior secondary. Tests 4–6 step up through S.3, S.4 and Paper 1 style. Questions are original, written to the HKEAA syllabus — they are not copies of any year’s paper.

Public site: [https://haoye123650.github.io/William-math/](https://haoye123650.github.io/William-math/)

| Paper | Level | Difficulty | Time |
| --- | --- | --- | --- |
| Test 1 | S.1 diagnostic | ★☆☆☆☆ | 70 min |
| Test 2 | S.1 harder | ★★☆☆☆ | 75 min |
| Test 3 | S.2 | ★★★☆☆ | 80 min |
| Test 4 | S.3 | ★★★★☆ | 85 min |
| Test 5 | S.4 Compulsory Part | ★★★★★ | 90 min |
| Test 6 | DSE Paper 1 style | ★★★★★ | 100 min |

Each paper is 100 marks. Section E is extra. Calculators are not allowed.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:45217](http://127.0.0.1:45217).

- `/paper/1` … `/paper/6` sit a paper
- `/print/1` blank paper
- `/answers/1` mark scheme

## GitHub Pages

GitHub Pages is the only host. The public site is [https://haoye123650.github.io/William-math/](https://haoye123650.github.io/William-math/). The app is a static export, and `docs/` is the folder Pages serves. `npm run build:pages` is the publish build: it writes `docs/`.

1. In the repository: **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: `main`, folder: `/docs`.
4. Save, then open `https://haoye123650.github.io/William-math/`.

After changing questions, rebuild and publish:

```bash
npm run build:pages
```

Then commit `docs/` and push `main`.
