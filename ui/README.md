# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Google Cloud Deployment

This project is configured for automatic deployment to Google Cloud Run when commits are pushed to the main branch.

### Prerequisites

1. Google Cloud project with Cloud Run and Cloud Build APIs enabled
2. Google Cloud SDK installed and authenticated
3. GitHub repository connected to Google Cloud Build

### Deployment Setup

1. **Connect your GitHub repository** to Google Cloud Build:
   - Go to Google Cloud Console > Cloud Build > Triggers
   - Create a new trigger connected to your GitHub repository
   - Select the main branch
   - Use the `cloudbuild.yaml` configuration file

2. **Environment variables** (if needed):
   - Set any required environment variables in Cloud Run configuration

3. **Custom domain** (optional):
   - You can map a custom domain to your Cloud Run service

### Manual Deployment

If you need to deploy manually:

```bash
# Build and push the Docker image
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy volvo-vaen --image gcr.io/YOUR_PROJECT_ID/volvo-vaen:latest --platform managed --region us-central1 --allow-unauthenticated --port 8080
```

### Cloud Build Configuration

The `cloudbuild.yaml` file defines the build pipeline:
- Installs dependencies
- Builds the Nuxt.js application
- Creates a Docker image
- Deploys to Cloud Run

The service will be available at: `https://volvo-vaen-xyz.a.run.app` (replace xyz with your actual URL)
