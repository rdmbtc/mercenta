#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/bump-version.sh 1.2.3
# Updates version in all SDK package configs (Python, JS, PHP).
# Go uses git tags — no file changes needed.

VERSION="${1:?Usage: $0 <version>  (e.g. 1.2.3)}"

# Validate semver format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: version must be semver (e.g. 1.2.3 or 1.2.3-rc.1)" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

# Python
echo "__version__ = \"${VERSION}\"" > "$ROOT/python/approute/_version.py"
echo "Python: $VERSION"

# JavaScript
cd "$ROOT/javascript"
npm version "$VERSION" --no-git-tag-version --allow-same-version
echo "JavaScript: $VERSION"

# PHP
cd "$ROOT/php"
tmp=$(mktemp)
jq --arg v "$VERSION" '.version = $v' composer.json > "$tmp" && mv "$tmp" composer.json
echo "PHP: $VERSION"

echo ""
echo "All SDKs updated to v${VERSION}"
echo "Next steps:"
echo "  git add -A && git commit -m \"release: v${VERSION}\""
echo "  git tag v${VERSION}"
echo "  git push origin main v${VERSION}"
