# Volvo Vän - Frontend

This directory contains the Nuxt.js frontend for the Volvo Vän project.

## Project Structure

- `app/` - Application source code
  - `pages/` - Application routes (AudioView, ChatView, etc.)
  - `components/` - Vue components
  - `stores/` - Pinia state management (`agentStore.ts`)
  - `api/` - API integration helpers
- `public/` - Static assets and Audio Worklet scripts (`js/audio-modules/`)
- `nuxt.config.ts` - Nuxt configuration

## Development

You can run the frontend in isolation for UI development:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The UI will be available at `http://localhost:3000`.

> **Note**: In isolated mode, the agent connection might fail if the backend is not running on port 8080 or if the proxy configuration implies a specific setup. For full end-to-end testing, use the root Makefile commands.

## Production Build

The frontend is built as a static site (SPA mode) to be served by the Python backend.

```bash
# Build for production
npm run generate
```

This generates the static files in `.output/public`, which are then served by FastAPI in the parent directory.

## Integration with Backend

The root `Makefile` handles the integration:

- `make build-ui`: Runs `npm run generate` inside this directory.
- `make run-agent`: Serves the built UI via FastAPI on `http://localhost:8080`.

## Audio Worklets

The audio processing relies on Audio Worklets located in `public/js/audio-modules/`.
- `pcm-player-processor.js`: Handles 24kHz audio playback (from backend).
- `pcm-recorder-processor.js`: Handles 16kHz audio recording (to backend).
