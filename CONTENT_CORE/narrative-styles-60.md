# Narrative styles — 60 personas (replaces former 63-id set)

## Canonical sources

| Data | File |
|------|------|
| UI: `id`, `icon`, `name`, `description` (Thai) + section comments | `02-master-prompt-template.js` → `export const STYLE_OPTIONS` |
| LLM: English `NARRATIVE_PROMPT_BY_STYLE_ID` (keys **1–60** only) | `1click-full-v3.40 (2)/js/storymodePromptEnrich.js` |
| Mock bundle (same prompts, `const`) | `storymode-mock-enrich-bundle.js` |
| JSON export (for mocks / tooling) | `narrative-styles-60.json` |

## Categories (5)

1. **Sales — CLOSER SQUAD** · ids **1–10**  
2. **Character — DRAMA UNIT** · ids **11–20**  
3. **Thai cultural — THAI SOUL** · ids **21–30**  
4. **Life arc & talking objects — GRIND & GRIPE** · ids **31–40**  
5. **Modern life 2026 — LIFE MODE** · ids **41–60**

## Migration note

- Saved Story configs with narrative ids **61–63** are **dropped on restore** (`sidepanel.js` filters to 1–60).
- Full English prompt text: open `storymodePromptEnrich.js` and search `NARRATIVE_PROMPT_BY_STYLE_ID`.
