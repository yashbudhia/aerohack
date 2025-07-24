# Implementation Plan – Rubik’s-Cube Web App (3×3–4×4)

> Goal: deliver a production-ready website that renders & animates a Rubik’s cube (3×3 and 4×4), lets users scramble/interact, and solves it with a classical algorithm via a back-end API.

---

## 0. Tech-Stack at a Glance

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Front-end | React + Vite + TypeScript · `@react-three/fiber` · Three.js · GSAP | Modern, fast build; TS safety; declarative Three.js; GSAP for silky tweens |
| State Engine | Shared TS library (`cube-core`) | Gives a single authoritative cube model (3×3, 4×4) usable in both FE & BE |
| Back-end | Python 3.11 + Flask | Minimal setup; leverages mature Python cube libraries |
| Solver | Custom two-phase (IDA* + pruning tables) we implement ourselves | No third-party solving libraries allowed |
| Package Mgr | npm / yarn (FE) · pip + venv (BE) | Keep toolchains simple |
| Local Run | concurrently / foreman | Single command starts Flask & React dev servers |
| CI (optional) | GitHub Actions for lint & tests | Deployment can be manual for now |

---

## 1. Repository Layout
```
root/
 ├─ apps/
 │   ├─ frontend/          # React + Vite site
 │   └─ backend/           # Flask API server
 ├─ packages/
 │   └─ cube-core/         # Shared TS cube engine & types
 ├─ .github/workflows/     # CI pipelines
 ├─ docker/                # Dockerfiles for API
 └─ IMPLEMENTATION.md      # ← YOU ARE HERE
```

---

## 2. Phase Breakdown

### Phase 1 – Scaffolding & Monorepo Setup
1. Initialise git repository.
2. Front-end: `npm create vite@latest frontend -- --template react-ts`.
3. Back-end: `python -m venv venv` → `pip install flask kociemba`.
4. Optional: create shared `cube-core` TS utilities inside `frontend`.
5. Add `concurrently` dev script to run React and Flask together.
6. Initial commit.

### Phase 2 – `cube-core` (NxN Cube Engine)
*Requirements: support 3×3 & 4×4, expose move tables, stringify state.*

1. Representation
   - `CubieCube` approach (permutation + orientation arrays).
   - Extend with *centers & edges* parity for even cubes.
2. API surface
   ```ts
   interface CubeN {
     readonly size: 3 | 4;
     apply(move: Move): CubeN;
     scramble(seq?: number): string; // returns moves
     toFacelet(): string;            // 54/96-char string
     isSolved(): boolean;
   }
   ```
3. Utils: `parseAlg(string)`, `invertAlg`, `reduce4x4to3x3()`.
4. Unit tests (Jest) verifying known scrambles solve back.

### Phase 3 – Solver Service (Flask)
1. Implement our own two-phase IDA* search engine.
   - Phase 1: solve cube to subgroup **G1** (edges oriented, U/D corners correct).
   - Phase 2: solve remaining to identity.
   - Pre-compute pruning tables offline (Python script) and load as JSON.
2. 4×4 strategy: implement reduction:
   - Solve centers, pair edges, convert to virtual 3×3 representation.
   - Reuse two-phase engine for final solve.
   - Handle parity cases with custom algorithms.
3. Endpoint design  
   ```http
   POST /solve
   {
     "size": 3 | 4,
     "scramble": "R U R' ..."
   }
   200 → {
     "solution": "R' U' ...",
     "length": 21,
     "method": "kociemba"
   }
   ```
4. Enable CORS via `flask_cors` and add a simple in-memory rate limiter.
5. Run locally with `python app.py`; Dockerfile optional later.

### Phase 4 – Front-end Cube & UX
1. Render cubelet instancing via `@react-three/fiber`.
2. Group cubelets by **layer index** ⇒ animate 90° rotation.
3. Input
   - Pointer drag → raycast hit face → determine layer & direction.
   - Keyboard shortcuts.
4. Animation pipeline
   ```tsx
   const tween = gsap.to(groupRef.current.rotation, { x: Math.PI/2, duration: 0.3 });
   ```
5. Scramble button, Solve button → call API 🚀, animate returned algorithm step-by-step.
6. Visual polish: lighting, soft shadows, metalness, environment map.
7. Responsive UI: React + Chakra UI / Tailwind.

### Phase 5 – Integration & Shared Worker
*Why?* Keep solver offline-first for demo speeds.

1. Attempt in-browser solver fallback using `cubejs` compiled to ESM.
2. Add `WebWorker` to keep UI responsive.
3. Detect: if worker returns solution ≤ 2 s use local; else call server.

### Phase 6 – Testing
1. `cube-core`: Jest unit tests (move correctness, scramble/solve round-trip for known states).
2. Back-end: Pytest tests for solver functions and API endpoints.
3. Front-end: Playwright E2E – scramble, request solve, watch cube reach solved state within expected move count.

### Phase 7 – CI (optional)
1. GitHub Action workflow runs on pull requests:
   - `lint`: ESLint (FE) + black/flake8 (BE)
   - `test`: Jest (FE) + Pytest (BE)
2. No automated deployment pipeline yet; run locally or deploy manually when needed.

### Phase 8 – (Later) Observability
1. Integrate Sentry in React for error tracking.
2. Use Python logging to stdout in Flask (view in console).

### Phase 9 – Roadmap for AI Extension (Later)
1. Add `/solve/rl` endpoint (policy network).
2. Training pipeline documented in `RL_SPEC.md`.
3. Switcher in UI.

---

## 3. Timeline (Aggressive 1-Week Hackathon)
| Day | Deliverable |
|-----|-------------|
| 1 | Repo, workspaces, baseline CI |
| 2 | `cube-core` 3×3 finished, unit tests |
| 3 | 4×4 support & Fastify API |
| 4 | Three.js cube rendering & manual moves |
| 5 | Solve integration + animations |
| 6 | E2E tests, CI/CD, polish |
| 7 | Buffer, docs, deploy demo link |

---

## 4. Definitions & Conventions
*Moves:* `U D L R F B` with modifiers `'` & `2`.
*Scramble string:* space-separated moves.
*Facelet order:* `URFDLB` as in WCA.

---

## 5. Acceptance Criteria
- [ ] Website loads in < 3s (LCP) on Netlify.
- [ ] Users can rotate cube interactively on mobile & desktop.
- [ ] "Scramble" generates 20 random moves.
- [ ] "Solve" returns solution < 300 ms (server) for 3×3; < 1 s for 4×4.
- [ ] Animation FPS ≥ 60 on mid-range laptop.
- [ ] All tests green in CI.
- [ ] Public URL shared with judges.

---

Happy cubing!
