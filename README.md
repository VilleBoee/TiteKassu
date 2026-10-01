# TiteKassu

A browser casino: fruit slots, blackjack, European roulette, and heads-up Texas Hold'em. One shared chip bank (saved in the browser), English / Finnish, and a light / dark theme.

This is a React + Vite web app (TanStack Start). Open it in a browser. There is no Electron window and no separate desktop installer.

## Requirements

- [Node.js 22](https://nodejs.org/) (20.19+ also works)
- npm (ships with Node)
- [Visual Studio Code](https://code.visualstudio.com/)

Check both in a terminal:

```bash
node -v
npm -v
```

## Open in VS Code

1. **File → Open Folder…** and choose this project folder (the one that contains `package.json`).
2. **Terminal → New Terminal** (`Ctrl+`` ` on Windows, `` Ctrl+` ``).
3. Run the commands below in that terminal. Stay in the project folder.

## Setup

Install dependencies once (and again after pulling new changes):

```bash
npm install
```

No `.env` file is required. Chips, language, and theme stay in `localStorage`. Sign-in and a database are off.

## Run the dev server

```bash
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080).

The server keeps running until you stop it with `Ctrl+C`. Save a file and the page reloads.

### Windows: `spawn vite ENOENT`

PowerShell can fail with:

```text
[with-app-env] failed to run vite: spawn vite ENOENT
```

Node cannot find the `vite.cmd` shim. Start Vite through `node` instead. Same app, same port:

**PowerShell**

```powershell
node scripts/with-app-env.mjs node .\node_modules\vite\bin\vite.js dev --host 127.0.0.1 --port 8080
```

**Command Prompt**

```bat
node scripts/with-app-env.mjs node .\node_modules\vite\bin\vite.js dev --host 127.0.0.1 --port 8080
```

If port 8080 is already taken, stop the other process or close the previous terminal, then run the command again.

## Production build

```bash
npm run build
```

That type-checks the client bundle via Vite and writes output under `.output/` (Nitro / Vercel preset). Without `DATABASE_URL` the migrate step prints a skip line and exits 0. That is expected locally.

**Windows, if `npm run build` hits the same `spawn vite ENOENT` error:**

```powershell
node scripts/with-app-env.mjs node .\node_modules\vite\bin\vite.js build
```

## Preview the build

After a successful build:

```bash
npm run preview
```

Open [http://127.0.0.1:8081](http://127.0.0.1:8081). Dev stays on port **8080**; the built preview stays on port **8081**.

**Windows workaround:**

```powershell
node scripts/with-app-env.mjs node .\node_modules\vite\bin\vite.js preview --host 127.0.0.1 --port 8081
```

## Other commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run preview` | Serve the last build on port 8081 |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test` | Script and unit tests |

## Playing

| Route | Game |
| --- | --- |
| `/` | Floor: pick a table |
| `/slots` | Fruit machine (holds, paytable) |
| `/blackjack` | Blackjack, 6-deck shoe |
| `/roulette` | European roulette |
| `/poker` | Heads-up no-limit Texas Hold'em (blinds 10 / 20) |

Header controls: **FI / EN** and the sun / moon theme switch. The chip count is the house bank for every game. A rebuy button appears when you are broke.

## Troubleshooting

- **Blank page right after `npm install`.** Stop the server (`Ctrl+C`) and start it again so Vite picks up new packages.
- **`EADDRINUSE` / port in use.** Something is already on 8080 or 8081. Stop that terminal, or on Windows:

  ```powershell
  netstat -ano | findstr :8080
  taskkill /PID <pid> /F
  ```

- **Old chips or language after a code update.** The bank lives in the browser. Clear site data for `localhost` if you want a fresh buy-in.
