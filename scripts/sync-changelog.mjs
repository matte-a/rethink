#!/usr/bin/env node
// Keep addon CHANGELOG copies in sync with the canonical root CHANGELOG.md.
// HA doesn't follow symlinks inside add-on folders, so we ship real copies
// and enforce they match at commit time. Run as a pre-commit hook.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(repoRoot, 'CHANGELOG.md')
const copies = [resolve(repoRoot, 'homeassistant/CHANGELOG.md'), resolve(repoRoot, 'homeassistant-dev/CHANGELOG.md')]

const master = readFileSync(source, 'utf8')
const staged = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)

const rootStaged = staged.includes('CHANGELOG.md')
const outOfSync = []
for (const path of copies) {
    if (readFileSync(path, 'utf8') !== master) outOfSync.push(path)
}

if (outOfSync.length === 0) process.exit(0)

// If the root file isn't part of this commit, refuse — the addon copies are
// meant to be regenerated from root, not edited directly.
if (!rootStaged) {
    console.error('[sync-changelog] addon CHANGELOG copies differ from root CHANGELOG.md:')
    for (const p of outOfSync) console.error(`  ${p}`)
    console.error('Edit CHANGELOG.md at the repo root — the addon copies are generated from it.')
    process.exit(1)
}

for (const path of outOfSync) {
    writeFileSync(path, master)
    console.log(`[sync-changelog] synced ${path}`)
}
execFileSync('git', ['add', ...outOfSync], { cwd: repoRoot, stdio: 'inherit' })
