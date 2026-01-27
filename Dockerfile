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

# Copy the frontend source code (Vanilla JS, no build needed)
COPY frontend ./frontend

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Expose the port
EXPOSE 8080

# Run the application
CMD ["uv", "run", "gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "app.main:app"]