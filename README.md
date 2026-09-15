# Workbench

The active enclosure application is **[v3](v3/README.md)**: a native
Python/CadQuery backend with a SolidJS/Three.js frontend. The old EnclosureV2
app and archived renderer have been removed; their history remains in Git.

## Run

```sh
make -C v3 setup
make -C v3 serve
```

Open http://127.0.0.1:8000. Requires uv, Python 3.12 and Node.js/npm.
See [v3 setup and usage](v3/README.md) for development, verification and exports.

## Checks

```sh
make -C v3 check
```

## Engineering studies

The [printed bifold guide](engineering/bifold-assembly/printed-guide/README.md)
is an unreleased Bambu A1 mini prototype, now represented in the v3 model and
live door animation. Physical hardware validation remains pending.
Standalone calculations and generators use Node 24:

```sh
npm ci
npm run test:engineering
node scripts/bifold-assembly-study.mjs
node scripts/printed-bifold-guide.mjs
```

Root npm dependencies support these studies only; v3 has its own locked
dependencies. Root `dev`, `build`, `test`, and `check` commands delegate to v3
(install its dependencies with `make -C v3 setup` first).

`CAD_ROADMAP.md` and `DOOR_CLEARANCES.md` retain historical v2 planning notes,
not current implementation guidance. Active development is tracked in
[v3/TRACKING.md](v3/TRACKING.md) and [tasks](tasks/AGENTS.md).
