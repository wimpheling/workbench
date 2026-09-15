# Remove obsolete v2 application

## Description

Remove the old root application and archived EnclosureV2 renderer so v3 is
unambiguously the active product.

## Discussion

The user explicitly confirmed v3 as the target and requested deletion of
src, v2 and the obsolete contributor note. There is no separate v2 directory;
the old implementations lived in src and legacy. Both are removed from the
branch, recoverable from Git revision 8bd0897. The contributor note is replaced
with v3-specific guidance. Supplier assets and historical planning documents
are retained. The new bifold prototype calculations are moved to engineering;
their integration into v3 remains a separate, unfinished task.

## Implementation plan

- [x] Remove src, legacy and obsolete v2 entrypoints/build scripts/configuration.
- [x] Replace contributor guidance and root README with v3 setup and commands.
- [x] Preserve bifold studies, tests and working STL generators under engineering.
- [x] Verify 11 engineering tests and both generators; all seven STLs regenerate.
- [x] Verify v3 frontend: 14 tests, type checking and production build pass.
- [x] Verify backend: lint and formatting pass; all 76 tests pass (two dependency
  deprecation warnings). Root test/build entrypoints also pass against v3.

## Open questions / blockers

- [x] Resolve deletion scope: src and legacy contain the old applications;
  v3 remains intact and no running server was stopped by this cleanup.
