# Anti-slop Upstream Provenance

## Source

**Repository**: https://github.com/oxc-project/anti-slop  
**Installed**: 2026-09-21  
**Installation Method**: `install-anti-slop` skill (Anthropic Claude Code)  
**Oxlint Version**: 1.83.0  
**@oxlint/plugins Version**: 1.83.0  

## Installation Details

### Path
```
tools/oxlint/anti-slop/
```

### Configuration
File: `oxlint.config.ts` (repository root)

Registered jsPlugin:
```ts
{
  name: "anti-slop",
  specifier: "./tools/oxlint/anti-slop/index.ts",
}
```

Rules enabled: All 20 anti-slop rules + oxc/no-accumulating-spread at error level.

### Ignores Added
```
- .agent/**
- .agents/**
- .claude/**
- .codex/**
- .continue/**
- .cursor/**
- .gemini/**
- .opencode/**
- .pi/**
- .roo/**
- .windsurf/**
- tools/oxlint/anti-slop/**
```

## Deviations from Upstream

None. Vendored code is unmodified from the bundled plugin.

## License

Includes `vendor/eslint-stylistic/LICENSE` - preserved with vendored code per upstream requirements.

## Notes

- This is a fresh installation for security hardening
- No Effect plugin installed (no direct `effect` dependency in package.json)
- ESLint already configured in project; oxlint integrates as plugin
- Existing ESLint rules preserved alongside anti-slop rules
- 40+ existing TypeScript warnings left as-is (FASE 7 cleanup post-PROD)
