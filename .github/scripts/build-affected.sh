#!/bin/bash
set -e

CORE_CHANGED="$1"
CLI_CHANGED="$2"

echo "Building affected packages..."

if [ "$CORE_CHANGED" == "true" ]; then
  echo "Building @kaiord/core..."
  pnpm --filter @kaiord/core build
fi

if [ "$CLI_CHANGED" == "true" ]; then
  if [ "$CORE_CHANGED" != "true" ]; then
    echo "Building @kaiord/core (dependency)..."
    pnpm --filter @kaiord/core build
  fi
  echo "Building @kaiord/cli..."
  pnpm --filter @kaiord/cli build
fi

echo "✅ Build completed"
