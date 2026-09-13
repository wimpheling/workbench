# CI and GitHub Pages

The repository has two intentionally separate workflows:

- `ci.yml` runs on pull requests and pushes to `main` or
  `refactor/viteplus-solidjs`. The quality job uses Node 24 and runs
  `npm ci`, `npm run check`, `npm test`, `npm run build`, and the static
  workflow-policy check. The Frame3DD job is explicitly optional and uses
  `continue-on-error: true`; an installed solver must never be required for
  ordinary rendering or validation.
- `pages.yml` deploys only from `main` (or manually via `workflow_dispatch`).
  It builds `dist`, uploads that directory with the Pages artifact action, and
  deploys it with the Pages deployment action. It grants only the Pages and
  OIDC permissions required by that deployment, plus read access to contents.

Run `npm run validate:workflows` locally to check the workflow contract. A
GitHub-hosted run still requires Pages to be enabled for the repository and
the source to be configured as **GitHub Actions** in repository Settings →
Pages. Those repository settings cannot be verified or changed from this
checkout without authenticated GitHub access.
