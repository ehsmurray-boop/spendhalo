#!/bin/bash
set -e

echo "Pre-install hook: fixing pnpm lockfile compatibility"
echo "pnpm version on EAS: $(pnpm --version)"

# The workspace root is two levels up from the Expo project dir
# (artifacts/finsight-mobile -> artifacts -> workspace root)
# But EAS may run us from the workspace root already — check both
if [ -f "pnpm-lock.yaml" ]; then
  WORKSPACE_ROOT="$(pwd)"
elif [ -f "../../pnpm-lock.yaml" ]; then
  WORKSPACE_ROOT="$(cd ../.. && pwd)"
else
  echo "Could not find pnpm-lock.yaml — skipping regeneration"
  exit 0
fi

echo "Workspace root: $WORKSPACE_ROOT"
echo "Removing incompatible lockfile and regenerating with current pnpm..."
rm -f "$WORKSPACE_ROOT/pnpm-lock.yaml"
cd "$WORKSPACE_ROOT"
pnpm install --no-frozen-lockfile
echo "Lockfile regenerated — EAS frozen install will now succeed"
