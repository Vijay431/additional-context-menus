#!/usr/bin/env bash
# Release gate: fail before any build or publish unless the release is valid.
# Env: EVENT_NAME, INPUT_TAG, RELEASE_TAG, RELEASE_PRERELEASE, ACTOR, ALLOWLIST, GITHUB_OUTPUT
set -euo pipefail

fail() {
  echo "::error::$*"
  exit 1
}

if [ "$EVENT_NAME" = workflow_dispatch ]; then
  allow=$(printf '%s' "${ALLOWLIST:-}" | tr -d ' ')
  [ -n "$allow" ] || fail "RELEASE_WHITELIST_ACTORS variable is not configured or is empty."
  [[ ",$allow," == *",$ACTOR,"* ]] || fail "User $ACTOR is not authorized to run this workflow manually."
  TAG=$INPUT_TAG
  state=$(gh release view "$TAG" --json isDraft,isPrerelease --jq '"\(.isDraft) \(.isPrerelease)"') ||
    fail "No GitHub Release found for tag $TAG."
  read -r draft PRE <<<"$state"
  [ "$draft" = false ] || fail "Release $TAG is a draft."
else
  TAG=$RELEASE_TAG
  PRE=$RELEASE_PRERELEASE
fi

tag_re='^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'
[[ $TAG =~ $tag_re ]] || fail "Invalid tag '$TAG'. Expected v<major>.<minor>.<patch>[-suffix]."
git check-ref-format "refs/tags/$TAG" || fail "Invalid tag ref: $TAG"

commit=$(git rev-parse --verify --quiet "refs/tags/$TAG^{commit}") || fail "Tag $TAG not found in repository."
pkg_version=$(git show "$commit:package.json" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version")
[ "$TAG" = "v$pkg_version" ] ||
  fail "Tag $TAG does not match package.json version $pkg_version at $commit."

git merge-base --is-ancestor "$commit" origin/main ||
  fail "Tag $TAG ($commit) is not reachable from main."

if [[ $TAG =~ -(rc|next|beta|alpha) ]]; then
  is_prerelease=true
else
  is_prerelease=false
fi
[ "$PRE" = "$is_prerelease" ] ||
  fail "Release pre-release flag is $PRE but version ${TAG#v} implies $is_prerelease."

{
  echo "tag=$TAG"
  echo "version=${TAG#v}"
  echo "is_prerelease=$is_prerelease"
} >>"$GITHUB_OUTPUT"
