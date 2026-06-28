#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_DIR="/opt/soc5-outbound"
readonly BRANCH="main"
readonly HEALTH_URL="http://127.0.0.1:8080/up"

exec 9>/tmp/soc5-outbound-deploy.lock
echo "Waiting for the production deployment lock..."
if ! flock -w 600 9; then
  echo "Timed out after 10 minutes waiting for another production deployment." >&2
  exit 1
fi
echo "Production deployment lock acquired."

cd "$APP_DIR"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Deployment refused: tracked files on EC2 contain local changes." >&2
  git status --short
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Deployment refused: $APP_DIR/.env is missing." >&2
  exit 1
fi

for variable in SUPABASE_URL SUPABASE_PUBLISHABLE_KEY; do
  if ! grep -Eq "^${variable}=.+" .env; then
    echo "Deployment refused: $variable is missing or empty in $APP_DIR/.env." >&2
    exit 1
  fi
done

echo "Fetching origin/$BRANCH..."
git fetch --prune origin "$BRANCH"
git merge --ff-only "origin/$BRANCH"

echo "Validating Compose configuration..."
docker compose config --quiet

echo "Building application images..."
docker compose build

echo "Starting application..."
docker compose up -d --remove-orphans

echo "Waiting for API health..."
for attempt in {1..24}; do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' soc5-outbound-api-1 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    break
  fi
  if [[ "$attempt" == "24" ]]; then
    echo "API did not become healthy." >&2
    docker compose ps
    docker compose logs --tail=100 api
    exit 1
  fi
  sleep 5
done

echo "Waiting for the public health endpoint..."
for attempt in {1..24}; do
  if curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" >/dev/null; then
    echo "Public health endpoint is ready."
    break
  fi
  if [[ "$attempt" == "24" ]]; then
    echo "Public health endpoint did not become ready." >&2
    docker compose ps
    docker compose logs --tail=100 web
    exit 1
  fi
  sleep 5
done

echo "Deployment completed successfully."
docker compose ps
git log -1 --oneline
