# Volvo Vän - Frontend

The frontend for Volvo Vän — a dual-mode (voice + text) conversational AI assistant for Volvo. Built with **Nuxt 4**, **TypeScript**, and **Vue 3 Composition API**.

When the app opens, it automatically establishes a **WebSocket** connection to the Python/FastAPI backend. Users interact with the AI agent through either a voice interface (with real-time full-duplex audio streaming) or a text chat panel. The agent guides users through a car configuration journey — from selecting a model and customizing wheels, interior, and colors to finding a nearby dealer and booking a test drive. The UI dynamically updates with car images, dealer cards, and animated transitions as the conversation progresses.

## Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3 + Composition API + `<script setup>`)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Utilities**: [VueUse](https://vueuse.org/)
- **Styling**: SCSS with dark/light mode via `@nuxtjs/color-mode`
- **Device Detection**: `@nuxtjs/device`
- **Sanitization**: `isomorphic-dompurify`
- **Linting**: ESLint with Vue and stylistic plugins

## How It Works

1. **App load** — `app.vue` generates a unique user ID and renders the main page.
2. **WebSocket connect** — `pages/index.vue` calls `agentStore.connect()` on mount, opening a WebSocket to `/ws/{userId}/{sessionId}` on the same host.
3. **Voice mode** — User taps the microphone; the app requests mic permission, initializes Audio Worklet processors (16 kHz recording, 24 kHz playback), and streams PCM audio chunks over the WebSocket in real time.
4. **Chat mode** — User opens the chat panel and sends text messages; responses stream back as text chunks.
5. **Dynamic UI** — The backend sends `ui_action` events that switch the displayed component (model silhouette → wheels → interior → final configuration → dealer map → test drive confirmation), update background images, and show dealer detail cards.
6. **Disconnect** — On WebSocket close, audio resources are cleaned up and unfinished messages are dropped. The next user interaction reconnects automatically.

## Project Structure

```
ui/
├── app/
│   ├── app.vue                # Root component — generates user ID on mount
│   ├── error.vue              # Global error page (404, etc.)
│   ├── pages/                 # File-based routing (index.vue, [...slug].vue)
│   ├── components/            # Auto-imported Vue components
│   │   ├── audioCapture/      # Microphone recording UI
│   │   ├── baseComponents/    # Shared UI primitives (buttons, inputs, etc.)
│   │   ├── blobMask/          # Animated voice blob + spotlight mask
│   │   ├── chat/              # Chat panel and message rendering
│   │   ├── dealerDetailsCard/ # Dealer info and test drive confirmation cards
│   │   ├── debug/             # Debug overlays
│   │   ├── imageViewer/       # Car image display with transitions
│   │   ├── logo/              # Volvo logo
│   │   └── navigation/        # Bottom navigation bar (mic + chat toggles)
│   ├── composables/           # Auto-imported composables (useAgent, useDebugLog)
│   ├── constants/             # Shared constants (event names, routes, emits)
│   ├── stores/agent/          # Pinia agent store (see Store Architecture below)
│   ├── plugins/               # Nuxt plugins (Pinia setup)
│   ├── scss/                  # Global SCSS (colors, mixins, theme, helpers)
│   ├── types/                 # TypeScript type definitions
│   └── assets/                # Static assets used in components
├── public/                    # Static files served as-is
│   └── js/audio-modules/      # Audio Worklet processors (PCM recorder + player)
├── nuxt.config.ts             # Nuxt configuration
├── eslint.config.mjs          # ESLint configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Running the App

The recommended way to run the full app (frontend + backend):

```bash
# From the ui/ directory — install frontend dependencies
npm install

# From the project root — build the frontend (required before running the agent)
make build-ui

# From the project root — start the backend (serves the built frontend on http://localhost:8080)
make run-agent
```

> `make` commands must be run from the **project root**. `npm` commands must be run from the **`ui/` directory**.

`make build-ui` generates the static site into `.output/public`. `make run-agent` starts the FastAPI backend which serves the built frontend and handles WebSocket connections for audio and text streaming.

### Isolated Frontend Development

For UI-only work (styling, layout, component prototyping) you can run the Nuxt dev server in isolation. Note that the agent connection, audio streaming, and backend-driven UI actions will not work without the backend running.

```bash
# From the ui/ directory
npm install
npm run dev
```

### Linting

```bash
# From the project root
make lint-ui

# Or directly
npm run lint

# Auto-fix ESLint issues
npm run lint:fix
```

### All npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Nuxt dev server (port 8080) |
| `npm run build` | Build for production (SSR) |
| `npm run generate` | Generate static site (SPA) for FastAPI serving |
| `npm run preview` | Preview production build (port 8080) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |

### Production Build

The frontend is built as a static site (SPA mode) to be served by the Python backend:

```bash
npm run generate
```

This generates static files in `.output/public`, which FastAPI mounts and serves at `/`.

## Store Architecture

The Pinia store lives in `stores/agent/` and is split into four TypeScript files that separate concerns:

| File | Purpose |
|------|---------|
| **`index.ts`** | Store definition — imports and wires together state, actions, and getters. Exports the `useAgentStore` composable. |
| **`_state.ts`** | TypeScript interface (`AgentState`) defining all reactive state properties (connection status, audio nodes, conversation, UI component state, etc.). |
| **`_actions.ts`** | All business logic and state mutations — WebSocket connection management, audio initialization, PCM encoding/decoding, message handling, and processing of incoming agent events. This is the largest and most critical file in the store. |
| **`_getters.ts`** | Computed properties derived from state (`isIdle`, `hasConversation`, `lastAgentMessage`). |

When adding new store logic:
- New **actions** go in `_actions.ts` — never in `index.ts`
- New **state properties** are declared in `_state.ts` and initialized in `index.ts`
- New **getters** go in `_getters.ts`

## Audio Worklets

The audio processing relies on Audio Worklets located in `public/js/audio-modules/`:
- `pcm-recorder-processor.js`: Captures microphone input at 16 kHz and sends PCM chunks to the main thread for WebSocket transmission.
- `pcm-player-processor.js`: Receives 24 kHz PCM audio from the backend and plays it back through the speakers.

## URL Parameters

The app reads optional query parameters from the URL to configure the session and enable developer tools.

| Parameter | Example | Description |
|-----------|---------|-------------|
| `user` | `?user=lars` | Sets the user ID for the WebSocket session. If omitted, defaults to `demo_user_<random-uuid>` (generated in `app.vue` on mount). |
| `session` | `?session=my-session-1` | Sets the session ID for the WebSocket session. If omitted, a random UUID is generated automatically. |
| `debug` | `?debug=true` | Enables the debug UI overlay with a button to copy the full conversation log (all agent events, images, bookings) to the clipboard as JSON. |

Parameters can be combined: `http://localhost:8080/?user=lars&session=test-1&debug=true`

Providing a fixed `user` and `session` is useful for resuming a previous conversation or for reproducing issues — the backend persists session state in Firestore when enabled.

## Console Logging

The app uses a custom styled logger (`useDebugLog` composable) instead of raw `console.log` calls. All log output in the browser console is color-coded with CSS gradient badges for quick visual scanning.

| Log Level | Method | Color | Used For |
|-----------|--------|-------|----------|
| Info | `log.info()` | Blue | Session init, WebSocket URL, function calls |
| Success | `log.success()` | Green | WebSocket connected, mic access granted, audio started |
| Warning | `log.warn()` | Orange | WebSocket disconnect, audio cleanup errors, skipped chunks |
| Error | `log.error()` | Red | Connection timeout, mic denied, message parse failures |
| Conversation | `log.conversation()` | Purple | Agent events — prefixed with `▶ USER` or `◀ AGENT`, plus image/gradient/booking payloads |

### What gets logged

Opening the browser console during a session shows the full lifecycle:

1. **Session start** — `SESSION` log with the resolved `userId` and `sessionId`
2. **WebSocket** — `WEBSOCKET Connecting to: ws://…` followed by `WEBSOCKET Connected` on success, or timeout/error on failure. Disconnects log the close code and reason.
3. **Microphone** — `MICROPHONE Access granted` or `MICROPHONE Access denied` when the user taps the mic button.
4. **Audio pipeline** — `AUDIO Starting…` / `AUDIO Started` when Audio Worklets initialize. Warnings appear for skipped chunks or cleanup errors during teardown.
5. **Agent functions** — `Function Name: display_car_configuration` (or `find_retailer`, `book_test_drive`) whenever the agent calls a tool that triggers a UI action.
6. **Conversation flow** — Every incoming agent event and outgoing user message is logged under `▶ USER` / `◀ AGENT` with the full payload. Image updates, gradient changes, and booking details each get their own `◀ IMAGES` / `◀ GRADIENT` / `◀ BOOKING` entry.

### Debug payload export

The `useDebugLog` composable records all events to an in-memory array. When debug mode is enabled (`?debug=true`), a button appears that copies the full session payload (user ID, session ID, and all recorded events) to the clipboard as formatted JSON — useful for sharing reproduction steps or filing bug reports.

## Code Conventions

- **TypeScript**: All new code must be written in TypeScript. Strict mode is enabled in `tsconfig.json`.
- **Import alias**: Always use `@/` — never use relative paths beyond one level
- **Component folders**: camelCase (e.g. `audioCapture`, `dealerDetailsCard`)
- **Component files**: PascalCase (e.g. `AudioCaptureBlob.vue`, `DealerDetailsCard.vue`)
- **Constants**: No inline magic strings — all event names, emits, and routes go in `app/constants/`
- **Composables**: Prefer VueUse and Nuxt built-ins over hand-rolled solutions
- **SCSS**: Use `@use` (never `@import`), chained class naming (no BEM `__`/`--`)
- **Comments**: Own line only, never inline — only for non-obvious logic

## GitHub Copilot: Skills & Agents

This project includes custom GitHub Copilot skills and agents to accelerate frontend development. They are defined in `.github/skills/` and `.github/agents/` and are automatically available in Copilot Chat.

### Custom Agents

Agents are specialized AI assistants that can be invoked in Copilot Chat for complex, multi-step tasks. They have full access to the codebase and can read, write, and run code.

| Agent | Description | Trigger Examples |
|-------|-------------|------------------|
| **frontend-coder** | Hands-on frontend engineer that writes, edits, and debugs TypeScript/Vue code in the `ui/` folder. Follows all project conventions automatically and loads relevant skills before coding. | *"implement this component"*, *"fix this Vue bug"*, *"create a composable"*, *"add a Pinia store"*, *"style this component"* |
| **frontend-feature-architect** | Frontend feature planning and review specialist. Evaluates completeness against project conventions, identifies edge cases and reactivity issues, and creates structured implementation plans. | *"help me plan this frontend feature"*, *"is this frontend feature complete?"*, *"what am I missing in this component?"*, *"review my UI feature design"* |

### Custom Skills

Skills are focused knowledge modules that Copilot loads to produce better, convention-aware code. They are loaded automatically by agents or can be referenced directly in Copilot Chat.

| Skill | Description |
|-------|-------------|
| **vue-best-practices** | Vue 3 Composition API with `<script setup>` and TypeScript. Covers reactivity, component patterns, and SSR considerations. |
| **vueuse-functions** | Reference for applying VueUse composables. Helps replace bespoke logic with battle-tested utilities. |
| **vue-pinia-best-practices** | Pinia store patterns — setup stores, `storeToRefs()`, actions, and reactive state management. |
| **vue-router-best-practices** | Vue Router 4 patterns — navigation guards, route params, and page lifecycle interactions. |
| **vue-testing-best-practices** | Testing with Vitest, Vue Test Utils, and Playwright. Covers component testing, mocking, and E2E patterns. |
| **vue-debug-guides** | Debugging Vue 3 runtime errors, warnings, async failures, and SSR/hydration issues. |
| **vue-options-api-best-practices** | Vue 3 Options API reference (for legacy code only). |
| **vue-jsx-best-practices** | JSX syntax in Vue (class vs className, plugin config). |
| **create-adaptable-composable** | Patterns for building library-grade composables that accept `MaybeRef` / `MaybeRefOrGetter` inputs. |
| **web-coder** | Comprehensive web development knowledge — HTML, CSS, JavaScript, web APIs, HTTP, security, and performance. |
| **conventional-commit** | Generates structured, standardized commit messages following the Conventional Commits specification. |
| **suggest-awesome-github-copilot-skills** | Suggests relevant Copilot skills from the awesome-copilot repository based on project context. |
| **suggest-awesome-github-copilot-agents** | Suggests relevant Copilot agents from the awesome-copilot repository based on project context. |
| **suggest-awesome-github-copilot-instructions** | Suggests relevant Copilot instruction files from the awesome-copilot repository. |
