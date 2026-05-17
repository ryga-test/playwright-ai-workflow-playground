#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION_FILE="$PROJECT_ROOT/.docker-version"

# ── Help ─────────────────────────────────────────────
usage() {
  echo "Usage: $0 [--pull-only] [--help]"
  echo ""
  echo "  Ensure the Playwright Docker image and npm dependencies are ready"
  echo "  so the pipeline agent can run browser steps without delays."
  echo ""
  echo "  Options:"
  echo "    --pull-only   Only pull the Docker image; skip npm install"
  echo "    --help        Show this message"
  exit 0
}

PULL_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --pull-only) PULL_ONLY=true ;;
    --help)      usage ;;
    *)           echo "Unknown option: $arg"; usage ;;
  esac
done

# ── Check Docker ─────────────────────────────────────
echo "=== Checking Docker ==="
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker is not installed or not on PATH."
  echo "Install Docker and try again: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null; then
  echo "ERROR: Docker daemon is not running or you lack permissions."
  echo "Start Docker Desktop or ensure your user is in the 'docker' group."
  exit 1
fi
echo "  Docker OK"

# ── Read the image tag ───────────────────────────────
echo "=== Reading image tag ==="
if [[ ! -f "$VERSION_FILE" ]]; then
  echo "ERROR: $VERSION_FILE not found."
  exit 1
fi

IMAGE_TAG="$(<"$VERSION_FILE")"
IMAGE="mcr.microsoft.com/playwright:$IMAGE_TAG"
echo "  Image: $IMAGE"

# ── Pull the image ───────────────────────────────────
echo "=== Pulling Docker image ==="
if docker image inspect "$IMAGE" &>/dev/null; then
  echo "  Image already present, skipping pull."
else
  echo "  Pulling $IMAGE ..."
  docker pull "$IMAGE"
  echo "  Pull complete."
fi

# ── Verify ───────────────────────────────────────────
echo "=== Verifying image ==="
docker run --rm "$IMAGE" node -e "console.log('Playwright Docker image ready.')"
echo "  Verification OK"

# ── npm install (unless --pull-only) ─────────────────
if $PULL_ONLY; then
  echo "=== Skipping npm install (--pull-only) ==="
else
  echo "=== Installing npm dependencies ==="
  cd "$PROJECT_ROOT"
  npm install
  echo "  npm install complete."

  # Quick check: @playwright/cli is available
  echo "=== Verifying @playwright/cli ==="
  if npx playwright-cli --version &>/dev/null; then
    echo "  @playwright/cli: $(npx playwright-cli --version)"
  else
    echo "  WARNING: @playwright/cli did not report a version (may be OK with npx)."
  fi
fi

echo ""
echo "=== DONE ==="
echo "Docker image $IMAGE is ready."
echo "Agent can now run browser-dependent pipeline steps for docker-runner apps."
