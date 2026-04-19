/**
 * CONTENT_CORE/12-hook-master.js
 * Hook Master system prompt functions
 * Source: sidepanel.js stubs (lines 14–24), HOOK_LIBRARY from 02-master-prompt-template.js
 *
 * Usage:
 *   // Single-item generation (sidepanel.js line 4333)
 *   const systemMsg = HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory);
 *
 *   // Batch generation (sidepanel.js line 4814)
 *   const hookSystemMsg = HOOK_MASTER_SECTION + buildHookMasterPrompt(item.hookCategory, batchUsedHookIds);
 *
 *   // Full AI call system prompt (sidepanel.js lines 5185, 11558)
 *   { role: 'system', content: getEnhancedPrompt(item.hookCategory) }
 */

import { HOOK_LIBRARY, HOOK_CATEGORIES, ADAPTIVE_VIDEO_DIRECTOR_PROMPT } from './02-master-prompt-template.js';

// ==================== HOOK_MASTER_SECTION ====================
// Stable prefix that precedes every hook-aware AI system message.
// Reminds the AI about hook selection rules and output format.
export const HOOK_MASTER_SECTION = `
== HOOK SELECTION RULES ==
You MUST begin the video script/dialogue with one of the provided hooks below (word-for-word or very close paraphrase).
The hook is the FIRST THING the audience hears — it must be punchy, attention-grabbing, and match the hook's energy.

Rules:
1. Choose ONE hook from the provided list. Do NOT combine multiple hooks.
2. Embed the chosen hook ID as "hookId" in your JSON output.
3. Do not add filler before the hook — the hook IS the opening line.
4. Adapt the hook naturally to the product context while preserving its emotional trigger.
5. After the hook: deliver the product value proposition within 3–5 seconds of screen time.

`.trim();

// ==================== buildHookMasterPrompt ====================
// Returns a hook selection section for the AI system message.
// Filters HOOK_LIBRARY by category (if provided) and excludes already-used hooks.
//
// @param {string} overrideCat  - Optional category key: 'FOMO' | 'AUTHENTIC' | 'OBSESSION' | 'CURIOSITY'
// @param {number[]} usedHookIds - Hook IDs already used in this batch (to avoid repetition)
// @returns {string} Hook selection prompt fragment, or '' if no hooks available
export function buildHookMasterPrompt(overrideCat, usedHookIds = []) {
  let pool = [...HOOK_LIBRARY];

  // Filter by category if specified and valid
  if (overrideCat && HOOK_CATEGORIES[overrideCat]) {
    pool = pool.filter(h => h.cat === overrideCat);
  }

  // Exclude already-used hooks
  if (usedHookIds && usedHookIds.length > 0) {
    pool = pool.filter(h => !usedHookIds.includes(h.id));
  }

  if (pool.length === 0) return '';

  // Select 5 diverse hooks for the AI to choose from
  // Shuffle and take first 5 to provide variety
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);

  const catLabel = overrideCat && HOOK_CATEGORIES[overrideCat]
    ? `${HOOK_CATEGORIES[overrideCat].icon} ${HOOK_CATEGORIES[overrideCat].name} — ${HOOK_CATEGORIES[overrideCat].desc}`
    : 'ทุกหมวด (Mixed)';

  const hookLines = shuffled
    .map(h => `  [ID:${h.id}] "${h.text}"`)
    .join('\n');

  return `

== AVAILABLE HOOKS (${catLabel}) ==
Choose ONE of these hooks as your opening line:
${hookLines}

After selecting your hook, include "hookId": <selected_id> in your JSON response.
`.trim();
}

// ==================== getEnhancedPrompt ====================
// Returns the full system prompt for AI content generation calls.
// Combines ADAPTIVE_VIDEO_DIRECTOR_PROMPT + HOOK_MASTER_SECTION + hook selection.
//
// Used in:
//   - sidepanel.js line 5185: { role: 'system', content: getEnhancedPrompt(item.hookCategory) }
//   - sidepanel.js line 11558: { role: 'system', content: getEnhancedPrompt() }
//
// @param {string} overrideHookCat  - Optional category: 'FOMO' | 'AUTHENTIC' | 'OBSESSION' | 'CURIOSITY'
// @param {number[]} usedHookIds    - Hook IDs to exclude
// @returns {string} Complete system prompt
export function getEnhancedPrompt(overrideHookCat, usedHookIds = []) {
  const hookSection = buildHookMasterPrompt(overrideHookCat, usedHookIds);
  if (!hookSection) {
    return ADAPTIVE_VIDEO_DIRECTOR_PROMPT;
  }
  return `${ADAPTIVE_VIDEO_DIRECTOR_PROMPT}

${HOOK_MASTER_SECTION}

${hookSection}`;
}
