# Workbench contributor notes

## Active product

The active product is `v3/`: a Python/CadQuery backend under `v3/backend/`
and a SolidJS/Three.js frontend under `v3/frontend/`. The backend domain
model is the source of truth for geometry, dimensions, motion, verification,
and supplier specifications. Keep rendering as an adapter over that model
and use millimetres internally.

The superseded root `src/` application has been removed; `legacy/` is
retained history. Add product features to v3. See `v3/README.md` for setup, commands,
architecture, and verification limits.

## Branches, worktrees, and pull requests

Always make changes on a dedicated branch in a dedicated Git worktree and
submit them through a pull request targeting `main`. This includes code,
documentation, and task updates. Do not commit or push changes directly to
`main`.

Start each worktree from up-to-date `main`. Give concurrent tasks or agents
separate branches and worktrees. Keep changes scoped to the assigned task,
commit and push the branch, and include the outcome and validation results
in the PR. Merge when the user authorizes it, then update local `main`.

## Development tasks

Track work in `tasks/` and follow `tasks/AGENTS.md`. Draft Markdown tasks in
`todo/`, move them to `in-progress/` when implementation starts, and update
the discussion and checklists as work proceeds. Move tasks to `done/` only
when the outcome is delivered and every checkbox is checked. Make these
task updates in the worktree and include them in the relevant PR.

## Validation and confidence

For backend model, geometry, verification, or export changes, run
`uv run pytest` from `v3/`. For frontend or shared API changes, run
`npm test`, `npm run check`, and `npm run build` from `v3/frontend/`.
Root `npm test`, `npm run check`, and `npm run build` delegate to v3
backend/frontend tests, lint/format checks, type checks, and the frontend build.
Run relevant browser tests for interaction changes. Changes spanning the
backend and frontend require both sets of checks. Documentation-only changes
need review of their content, paths, and formatting, not application tests.

Report what was checked and any remaining limitations in the PR. A passing
geometric check does not prove a buildable assembly or physical performance.
Keep unresolved hardware, tolerances, installation, and measurement evidence
explicit; do not treat assumptions as verified facts.
