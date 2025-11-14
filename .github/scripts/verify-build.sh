#!/bin/bash
set -e

CORE_CHANGED="$1"
CLI_CHANGED="$2"

echo "Verifying build artifacts..."

if [ "$CORE_CHANGED" == "true" ]; then
  if [ ! -d "packages/core/dist" ]; then
    echo "❌ @kaiord/core build output not found"
    exit 1
  fi
  echo "✓ @kaiord/core verified"
fi

if [ "$CLI_CHANGED" == "true" ]; then
  if [ ! -d "packages/cli/dist" ]; then
    echo "❌ @kaiord/cli build output not found"
    exit 1
  fi
  echo "✓ @kaiord/cli verified"
fi

echo "✅ All build outputs verified"
