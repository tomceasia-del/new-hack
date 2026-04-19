/**
 * CONTENT_CORE/09-v2-prompts.js
 * V2 product showcase prompt builders (shipping box / unboxing format)
 * Source: sidepanel.js lines 13432–13460
 */

// ==================== buildV2ImagePrompt ====================
// Lines ~13418–13428 of sidepanel.js
// Builds a static high-angle shot of products + open shipping box + handwritten price tag.
// Parameters:
//   item  — { name, price }
//   s     — getV2TemplateSettings() object (see below)

export function buildV2ImagePrompt(item, s) {
  const name = item.name || 'product';
  const price = item.price || '???';
  return `Static high-angle medium shot. Multiple ${s.packagingDesc} of ${name} and an open brown corrugated cardboard shipping box. A white paper price tag handwritten in bold ${s.penColor} marker reading '${price}'. 2-3 ${s.packagingType} are placed upright in front of the box, and 6-8 ${s.packagingType} are neatly stacked inside the open box visible from above. The price tag is placed on the table in the foreground. Shot on a ${s.surface}. Bright natural daylight, soft shadows, ${s.background} background. Vibrant product colors pop against the brown cardboard. Photorealistic, 8K resolution, sharp focus on products, commercial advertising style.`;
}


// ==================== buildV2VideoPrompt ====================
// Lines ~13430–13440 of sidepanel.js
// Builds a 3-segment hand-reveal video prompt emphasising the product and price.

export function buildV2VideoPrompt(item, s) {
  const price = item.price || '???';
  return `[00:00-00:02] Static high-angle medium shot. The camera remains completely still, focusing on the ${s.packagingType} and the handwritten price tag reading '${price}' on the table.\n[00:02-00:04] A human hand enters the frame from the ${s.handDirection}. The hand points its index finger at the ${s.packagingType}, making a small circular motion to highlight the product size.\n[00:04-00:06] The hand moves down to point repeatedly at the handwritten price tag reading '${price}' on the table to emphasize the cheap price. The background shows slight, natural movement like ${s.bgMovement}. Smooth cinematic motion, photorealistic.`;
}


// ==================== buildV2ExtendPrompt ====================
// Lines ~13442–13452 of sidepanel.js
// Extends the video: hand picks up and holds the product to show value.
// Note: `item` parameter is not used inside the body — only s.packagingType.

export function buildV2ExtendPrompt(item, s) {
  return `Continue the static high-angle medium shot seamlessly. The human hand and the ${s.packagingType}. The hand stops pointing at the price tag and reaches out to pick up one of the ${s.packagingType} from the table. The hand lifts the ${s.packagingType} slightly to show its thickness and weight to the camera, holding it for a moment to emphasize its value, before gently placing it back down on the table. The background continues its subtle natural movement. Smooth cinematic motion, photorealistic, consistent lighting.`;
}


// ==================== getV2TemplateSettings ====================
// Lines ~13454–13464 of sidepanel.js
// Reads user-configured V2 template fields from the DOM.
// generateV2Prompts() (lines 13447–13461) requires packagingDesc, packagingType,
// surface, background, and bgMovement to be non-empty; penColor and handDirection
// have in-line defaults ('blue' and 'right side').

export function getV2TemplateSettings() {
  return {
    packagingDesc:  (document.getElementById('v2-packaging-desc')?.value    || '').trim(),
    packagingType:  (document.getElementById('v2-packaging-type')?.value    || '').trim(),
    penColor:       (document.getElementById('v2-pen-color')?.value         || 'blue').trim(),
    surface:        (document.getElementById('v2-surface')?.value           || '').trim(),
    background:     (document.getElementById('v2-background')?.value        || '').trim(),
    handDirection:  (document.getElementById('v2-hand-direction')?.value    || 'right side').trim(),
    bgMovement:     (document.getElementById('v2-bg-movement')?.value       || '').trim()
  };
}
