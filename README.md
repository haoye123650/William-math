# 尹健熙 · Pui Kiu Mathematics

DSE-style mathematics papers for a Pui Kiu student. Tests 1–3 are junior secondary. Tests 4–6 step up through S.3, S.4 and Paper 1 style. Three junior mixed quizzes sit beside them. Questions are original, written to the HKEAA syllabus — they are not copies of any year’s paper.

Public site: [https://haoye123650.github.io/William-math/](https://haoye123650.github.io/William-math/)

| Paper | Level | Difficulty | Time |
| --- | --- | --- | --- |
| Test 1 | S.1 diagnostic | ★☆☆☆☆ | 70 min |
| Test 2 | S.1 harder | ★★☆☆☆ | 75 min |
| Test 3 | S.2 | ★★★☆☆ | 80 min |
| Test 4 | S.3 | ★★★★☆ | 85 min |
| Test 5 | S.4 Compulsory Part | ★★★★★ | 90 min |
| Test 6 | DSE Paper 1 style | ★★★★★ | 100 min |
| Junior Mixed Quiz Paper 01 | S.1–S.3 | ★★★☆☆ | 45 min |
| Junior Mixed Quiz Paper 02 | S.1–S.3 | ★★★☆☆ | 45 min |
| Junior Mixed Quiz Paper 03 | S.1–S.3 | ★★★☆☆ | 50 min |

Tests 1–6 are 100 marks each. Section E is extra. Each quiz question is 1 mark, and the question keeps its [S1], [S2] or [S3] level tag. A fill-in answer is marked by normalising it and matching the keyed answer. Forms listed in `acceptedAnswers` are accepted too. A question that mentions a figure still shows its text when no image is attached. Calculators are not allowed.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:45217](http://127.0.0.1:45217).

- `/paper/1` … `/paper/6` sit a full paper
- `/paper/junior-01` … `/paper/junior-03` sit a junior mixed quiz
- `/print/1` blank paper (same pattern for `junior-01` … `junior-03`)
- `/answers/1` mark scheme (same pattern for the quizzes)

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
