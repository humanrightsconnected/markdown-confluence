# Dependabot Auto-Merge Setup Guide

This repository uses multiple approaches to automatically merge Dependabot PRs when all checks pass.

## Current Setup

### 1. GitHub Actions Workflow (Active)
**File:** `.github/workflows/dependabot-auto-merge.yml`

This workflow automatically approves and enables auto-merge for Dependabot PRs when all checks pass.

**How it works:**
- Triggers on all PRs from `dependabot[bot]`
- Waits for all checks to complete
- Auto-approves if all checks pass
- Enables GitHub's auto-merge feature
- Works immediately, no repository settings changes needed

### 2. Dependabot Grouping Configuration (Active)
**File:** `.github/dependabot.yml`

Dependabot groups updates by dependency type to reduce PR noise:

- **Development dependencies**: Groups patch and minor updates
- **GitHub Actions**: Groups patch and minor updates
- Limits open PRs to 10 per package ecosystem

**Benefits:**
- Fewer PRs to review (grouped updates)
- Cleaner commit history
- Easier to track what changed

### 3. Automatic Lock File Fixing (Active)
**File:** `.github/workflows/pr-check.yml`

Automatically fixes `package-lock.json` when Dependabot updates `package.json`:

- Detects when lock file is out of sync
- Runs `npm install --package-lock-only --ignore-scripts`
- Commits and pushes the fixed lock file
- Prevents "Missing from lock file" errors

## Option 4: Branch Protection Exemption (Recommended for Admins)

If you have **admin access** to the repository, you can exempt Dependabot from review requirements.

### Setup Steps

1. Go to **Settings** → **Branches**
2. Edit the **main** branch protection rule (or create one)
3. Under **"Require a pull request before merging"**:
   - Check **"Require approvals"**
   - Set minimum approvals (e.g., 1)
4. Under **"Allow specified actors to bypass required pull requests"**:
   - Click **"Add bypass allowed actor"**
   - Select or search for `dependabot[bot]`
   - Add the actor
5. Save changes

### What This Does

- **For human PRs**: Still requires review approval
- **For Dependabot PRs**: Can merge automatically when checks pass
- **Security**: Maintains quality through automated checks
- **Simplicity**: No extra workflows needed

### Combining with Existing Workflows

You can use **both** branch protection exemption **and** the GitHub Actions workflow:

- **Branch protection exemption**: Allows Dependabot to bypass review requirement
- **GitHub Actions workflow**: Automatically approves and enables auto-merge
- **Result**: Fully automated, no manual intervention

## Comparison

| Method | Admin Required | Setup | Flexibility | Maintenance |
|--------|---------------|-------|-------------|-------------|
| GitHub Actions | ❌ No | Medium | High | Low |
| Dependabot Config | ❌ No | Low | Medium | None |
| Branch Protection | ✅ Yes | Very Low | Medium | None |
| **All Three** | ✅ Yes | Medium | **Highest** | **Lowest** |

## Current Behavior

With the current setup (Actions + Config):

1. Dependabot creates PR
2. `pr-check.yml` fixes `package-lock.json` if needed
3. All checks run (lint, test, build)
4. If all pass:
   - `dependabot-auto-merge.yml` approves the PR
   - Auto-merge is enabled
   - PR merges automatically when branch protection satisfied
5. If checks fail:
   - PR is not approved
   - Manual review required

## Recommended Configuration

For **maximum automation** with **minimum maintenance**:

1. ✅ Keep the GitHub Actions workflow (already done)
2. ✅ Keep the Dependabot grouping config (already done)
3. ✅ Keep the lock file auto-fix (already done)
4. ✅ Add branch protection exemption for `dependabot[bot]` (requires admin)

This gives you:
- Zero manual intervention for passing Dependabot PRs
- Safety through automated checks
- Reduced PR noise through grouping
- No lock file sync issues

## Security Considerations

Auto-merging dependencies is safe when:

- ✅ You have comprehensive test coverage
- ✅ All checks must pass before merge
- ✅ Major version updates are excluded (or reviewed manually)
- ✅ Production dependencies are reviewed more carefully than dev dependencies

Current safety measures:
- All PRs must pass: linting, tests, and builds
- Dependabot only updates known, legitimate packages
- GitHub's Dependabot security advisories flag vulnerable updates
- Grouped updates make it easier to identify breaking changes

## Troubleshooting

### PRs Not Auto-Merging

1. Check that all checks passed
2. Verify branch protection allows auto-merge
3. Check workflow logs for errors
4. Ensure `GITHUB_TOKEN` has sufficient permissions

### Lock File Errors

The `pr-check.yml` workflow should fix these automatically. If it doesn't:
- Check the "Update package-lock.json if needed" step logs
- Verify `npm install --package-lock-only --ignore-scripts` works locally

### Too Many PRs

Adjust `open-pull-requests-limit` in `dependabot.yml` to reduce concurrent PRs.

## Further Reading

- [Dependabot auto-merge documentation](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)
- [Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
