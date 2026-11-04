# MAP132 DIGITALS — Deployment safety and rollback

## Current status

This workflow is being developed on the isolated branch
`safety/deployment-rollback-2026-11-04`. It does not deploy when pushed to
that branch. Production deployment is only available through a manual
`workflow_dispatch` on `main`, after the protected workflow has been merged.

The existing production workflow on `main` is unchanged until an approved
merge. Do not merge this workflow until the repository and Cloudflare
prerequisites below have been checked.

## What the protected workflow does

1. Pull requests targeting `main` run a dependency install and Vite build.
2. A production run must be manually dispatched on `main` with
   `deploy_production=true`.
3. It requires the repository secret `MAP132_DATA_BACKUP_CONFIRMED` to equal
   `true`. This gate must not be set until KV and R2 backup files have been
   exported and a restore has been tested in a non-production environment.
4. Before deployment, it reads the active Cloudflare Worker deployment and
   saves the complete active version-percentage list as the rollback target.
   If this preflight cannot read a valid active deployment, it stops before
   deploying.
5. After deployment it checks the homepage, health endpoint, and portfolio API.
6. If those checks fail, it asks Cloudflare to create a deployment using the
   saved previous version list, then repeats the smoke checks.
7. The workflow reports failure even when rollback succeeds, so the failed
   release is not mistaken for a successful release.

## Required GitHub configuration before production use

- Add a GitHub Environment named `production`.
- Configure required reviewers for that environment where the repository plan
  supports it.
- Add/verify repository secrets:
  - `CLOUDFLARE_API_TOKEN`: must be able to deploy Workers, read deployments,
    and create a rollback deployment (Workers Scripts Read + Write).
  - `CLOUDFLARE_ACCOUNT_ID`.
  - `MAP132_DATA_BACKUP_CONFIRMED`: set to the exact string `true` only
    after the separate KV/R2 backup and restore process is proven.
- Protect `main`: require pull requests and successful validation checks.
- Disable or replace the old push-to-main production workflow when this
  protected workflow is approved for use. Do not leave two production deploy
  workflows active.

## Important limits

- Cloudflare Worker versions preserve the deployed Worker code, static assets,
  bindings, and compatibility settings. They do not snapshot the contents of
  KV or R2.
- Cloudflare rollback does not reverse data mutations or restore deleted
  storage resources. KV portfolio content and R2 media therefore need a
  separate export, retention, and restore-tested process.
- Current smoke checks prove basic homepage/API availability and response
  shape. They do not prove visual correctness, admin login, every UI feature,
  every media object, or that the portfolio API returned the original KV
  content rather than fallback defaults. The KV read-failure defect must be
  fixed and tested before relying on the portfolio check as a data-integrity
  signal.
- A failed smoke check triggers rollback, but this cannot guarantee detection
  of every visual or user-specific regression. Manual visual QA remains
   required before accepting a release.
- A rollback can fail if the Cloudflare token lacks permissions, the previous
  version is unavailable, or required bindings/resources have been removed.

## Current production status

No production deployment, Cloudflare configuration change, KV write, or R2
operation is performed by this branch workflow. Automatic rollback is not
active on production until this workflow is reviewed, merged, configured, and
tested with an approved controlled deployment.
