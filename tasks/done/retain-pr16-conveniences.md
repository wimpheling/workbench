# Retain useful conveniences from PR 16

## Description

Retain the setup, frontend development and export shortcuts plus historical-document labels from PR 16 after merging the current bifold assembly in PR 15.

## Discussion

The user explicitly requested applying these selected changes directly to main and closing PR 16. This overrides the usual branch/PR workflow for this task. Keep the engineering dependencies, existing combined validation commands and current bifold documentation. The rest of PR 16 is redundant or describes the superseded design.

## Implementation plan

- [x] Add setup, dev:frontend and export scripts using existing v3 commands
- [x] Label CAD_ROADMAP.md and DOOR_CLEARANCES.md as historical
- [x] Run required root test, check and build commands: npm test passed 11 engineering and 45 frontend tests; npm run check passed Ruff lint/format, 165 backend tests (15m39s), 45 frontend tests, TypeScript and build; npm run build passed. Shortcut targets were checked against the existing Makefile and frontend script.
- [x] Deliver the selected changes directly to main and close PR 16 as requested

## Open questions / blockers

- [x] No remaining scope questions; the user selected these changes explicitly.
