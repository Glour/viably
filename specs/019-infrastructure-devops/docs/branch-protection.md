# Branch Protection Rules

## GitHub Settings

Go to Repository → Settings → Branches → Add branch protection rule.

### Rule for `main` branch

**Pattern**: `main`

**Checks**:
- [x] Require a pull request before merging
  - Required approving reviews: 1
- [x] Require status checks to pass before merging
  - Required checks:
    - `Backend Checks`
    - `Frontend Checks`
- [x] Require branches to be up to date before merging
- [x] Require conversation resolution before merging
- [x] Automatically delete head branches

**Do NOT enable**:
- Do not require linear history (allows merge commits)
- Do not restrict who can push (team is small)

## Effect

- Direct pushes to `main` are blocked
- PRs must pass CI (backend + frontend checks)
- At least 1 review required
- Stale branches auto-deleted after merge
