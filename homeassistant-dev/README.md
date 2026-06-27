# Rethink (dev)

Development build of Rethink, tracking the `master` branch.

This add-on pulls `ghcr.io/alexw23/rethink:dev`, which CI publishes on every
push to `master`. Use it to test unreleased changes before they ship as a
tagged release.

## Differences from the stable add-on

- **Image tag:** `dev` instead of a pinned version. Each push to `master`
  produces a new image under the same tag.
- **Slug:** `rethink-dev` so it can be installed alongside stable in the
  add-on store list, but **do not run both at once** — they bind the same
  ports (443, 4433, 44401, 8885). Stop stable before starting dev.

## Getting a fresh build

The `dev` tag is mutable. Once installed, the supervisor will keep using
the locally cached image until you force a refresh:

1. Stop the add-on.
2. Uninstall it.
3. Reinstall — supervisor pulls the latest `:dev` image.

(There is no "update" prompt because `version:` never changes.)

## Bug reports

If you hit something on the dev build, include:

- The commit SHA shown in CI for the run that produced your `:dev` image.
- The full add-on log.
- Any captures (`packet-parser`, `rethink-capture`) reproducing the issue.
