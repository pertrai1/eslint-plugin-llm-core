#!/usr/bin/env bash
set -euo pipefail

tag="${1:?Expected a release tag}"
target="${2:?Expected the publishing commit SHA}"
ref="refs/tags/$tag"

if ! remote_refs=$(git ls-remote --tags origin "$ref" "$ref^{}"); then
  echo "::error::Could not verify release tag $tag. Check repository access and retry." >&2
  exit 1
fi
tag_commit=""
peeled_commit=""
while read -r sha name; do
  if [[ "$name" == "$ref" ]]; then
    tag_commit="$sha"
  elif [[ "$name" == "$ref^{}" ]]; then
    peeled_commit="$sha"
  fi
done <<< "$remote_refs"
# Annotated tags name a tag object; compare its peeled commit instead.
tag_commit="${peeled_commit:-$tag_commit}"

if [[ -n "$tag_commit" && "$tag_commit" != "$target" ]]; then
  echo "::error::Release tag $tag points to $tag_commit; expected publishing commit $target. Investigate the mismatch before retrying; no tag was changed." >&2
  exit 1
fi

if [[ "${3:-}" == "--verify-only" ]]; then
  exit 0
fi

if gh release view "$tag" >/dev/null 2>&1; then
  echo "Release $tag already exists at $target, skipping"
else
  gh release create "$tag" --target "$target" --generate-notes
fi
