# Dependency Management Strategy

## Overview
This document defines the consistent approach for managing dependencies across the SHORTLIST.GT project.

## Pinning Strategy

### Production Dependencies (Critical)
**Use exact versions** for dependencies that are critical to security, stability, or core functionality:
- `react@19.2.8` - Core framework, exact version required
- `react-dom@19.2.8` - DOM bindings, must match React version
- `next@16.3.5` - Framework version, exact for consistency
- `typescript@5.6.2` - Type system, exact version
- `jose@5.6.3` - JWT/cryptography, security-critical

### Secondary Dependencies
**Use caret (^) for semantic versioning** - allows automatic patch and minor updates:
- `@supabase/supabase-js@^2.112.4` - Allows 2.x updates
- `framer-motion@^13.1.1` - UI library, safe for minor updates
- `openai@^7.8.0` - API client, safe for minor updates

### Development Dependencies
**Use exact versions** for tools that affect build output:
- `eslint-config-next@16.3.5` - Must match Next.js version
- `@oxlint/plugins@1.83.0` - Exact for reproducible linting
- `vitest@4.1.11` - Test runner, exact for CI consistency

### Third-Party Hosted Dependencies
**Use CDN URLs with pinned versions**:
- `xlsx` - Downloaded from https://cdn.sheetjs.com/xlsx-0.20.2/xlsx-0.20.2.tgz (exact version)

## Enforcement

### Automated Updates
**Dependabot** (configured in `.github/dependabot.yml`) will:
- Monitor for security updates (auto-enabled)
- Create weekly check PRs for minor/patch updates
- Require review before merging non-security updates

### Pre-Commit Checks
Run before committing:
```bash
npm audit
npm audit --audit-level=high  # Fails on high-severity vulnerabilities
```

### CI/CD Checks
Every PR runs:
```bash
npm audit --audit-level=high
npm run type-check
npm run build
```

## When to Update

1. **Security Vulnerabilities**: Update immediately
2. **Critical Bug Fixes**: Coordinate with team
3. **Feature Updates**: Only with explicit team decision
4. **Patch Updates**: Can be included in routine maintenance PRs

## Rationale

- **Exact versions for critical paths** → Reproducible, secure, stable builds
- **Caret for stable libraries** → Benefit from bug fixes automatically
- **CDN pinning** → No npm registry dependency for optional libraries
- **Dependabot integration** → Reduces manual overhead, catches security issues

---
**Last Updated**: 2026-09-22
**Maintained By**: Security Team
