# Build the Nuxt conversational UI
FROM node:20-alpine AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run generate

# Build the React dashboard
FROM node:20-alpine AS dashboard-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY src/ ./src/
COPY public/ ./public/
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js ./
ENV VITE_FIREBASE_API_KEY=AIzaSyBmw05T1YKPzmKrS2Ea7ic0nqZOgvMQb6I
ENV VITE_FIREBASE_AUTH_DOMAIN=vml-map-xd-volvo.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=vml-map-xd-volvo
ENV VITE_FIREBASE_STORAGE_BUCKET=vml-map-xd-volvo.firebasestorage.app
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=719852784419
ENV VITE_FIREBASE_APP_ID=1:719852784419:web:032fd561ab3878b29b9a96
ENV VITE_GEMINI_API_KEY=AIzaSyBT_9A96G6oUUqjkCRZbYTJCJdAwU2CkAg
ENV VITE_FIRESTORE_DB=volvo-vaen-v2-db
ENV VITE_UNICORN_PROJECT_ID=X0ErZR3QhPzMHfKgBbJJ
ENV VITE_RETELL_API_KEY=key_094fcc2e6bba78a35d3e55a54b86
RUN npx tsc -b && npx vite build

# Build the backend
FROM python:3.13-slim AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set the working directory in the container
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED=1

# Copy the app source code
COPY app ./app

# Copy the built Nuxt UI
COPY --from=ui-builder /app/ui/.output/public ./ui/.output/public

# Copy the built React dashboard
COPY --from=dashboard-builder /app/dist ./dist

# Copy preview pages (split-screen + architecture overview)
COPY preview.html ./preview.html
COPY preview-dev.html ./preview-dev.html

# Copy the debug frontend source code (Vanilla JS, no build needed)
COPY debug_frontend ./debug_frontend

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port
EXPOSE 8080

# Run the application
CMD ["uv", "run", "gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "app.main:app"]