#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

BUILD_DIR="${BUILD_DIR:-dist}"
REMOTE_BRANCH="gh-pages"
WORKTREE="$(mktemp -d)"

cleanup() {
  rm -rf "${WORKTREE}"
}
trap cleanup EXIT

REMOTE_REPO="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

git clone --depth 1 --single-branch --branch "${REMOTE_BRANCH}" "${REMOTE_REPO}" "${WORKTREE}"

find "${WORKTREE}" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "${BUILD_DIR}/." "${WORKTREE}/"
touch "${WORKTREE}/.nojekyll"

cd "${WORKTREE}"

git config user.name "${GITHUB_ACTOR:-github-actions[bot]}"
git config user.email "${GITHUB_ACTOR:-github-actions[bot]}@users.noreply.github.com"

git add -A

if git diff --cached --quiet; then
  echo "gh-pages is already up to date."
  exit 0
fi

git commit -m "chore(pages): publish ${GITHUB_SHA:-catalog}"
git push origin "HEAD:${REMOTE_BRANCH}"
