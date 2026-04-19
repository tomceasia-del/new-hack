# 01 — Google generative image stack (overview)

**Scope:** How **Gemini API native image generation** and **Imagen on Vertex AI** relate, when to use which, and where to read official English documentation.

**Last curated:** 2026-04-17 (verify links before shipping).

---

## 1. Two main doors (do not confuse them)

| Surface | Typical use | Primary docs |
|--------|-------------|----------------|
| **Gemini API** (Google AI for Developers) | Apps using `generativelanguage.googleapis.com`, AI Studio workflows, multimodal chat + images in/out | [Image generation](https://ai.google.dev/gemini-api/docs/image-generation) |
| **Vertex AI** (Google Cloud) | Enterprise GCP projects, IAM, VPC, billing by Cloud; Imagen `predict` and client libraries | [Image overview](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview) |

Same broad domain (text and images), different **accounts, billing, endpoints, and SDK entrypoints**.

---

## 2. Gemini API — “native” image generation (Nano Banana)

Google’s docs market **“Nano Banana”** as the name for **native image generation inside Gemini** (text and/or images in → images out, iterative editing in conversation).

**Official hub:** [Image generation (Gemini API)](https://ai.google.dev/gemini-api/docs/image-generation)

**Concepts you will see in that doc (verify on page):**

- **Models** — Names and availability rotate; the doc lists current image-capable model IDs (e.g. preview vs stable). Always copy the **exact string** from the doc when you configure your app.
- **REST** — `POST .../v1beta/models/{model}:generateContent` with API key (or auth method you use).
- **Response** — Mixed `text` and `inlineData` (base64 image) parts; your client must parse **parts**, not assume a single block.
- **Generation config** — Image-related knobs such as **aspect ratio** and **image size** appear in the official examples; values and which model accepts which option are **model-specific** — read the table in the doc.
- **Safety / provenance** — Docs describe **SynthID** watermarking on generated images (policy may evolve).
- **Grounding / tools** — Optional **Google Search** grounding and **Image Search** flows are documented for supported models; follow **display and attribution** requirements in the same doc if you ship a UI.
- **“Thinking” / multi-turn** — Newer Gemini 3–family image flows may involve **thinking** steps, **thought signatures**, and billing of thinking tokens; the doc explains how to preserve context across turns (especially if not using a high-level SDK that manages history for you).
- **Batch** — High-volume / async batch API is documented separately; good for offline pipelines.

**Prompting principle (from Google’s guidance):** Prefer a **short narrative description of the scene** over a **flat list of disconnected keywords** when you want coherent composition.

**Model card example (link may change):**  
[gemini-3.1-flash-image-preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image-preview)

**Related:** [Imagen on Gemini API](https://ai.google.dev/gemini-api/docs/imagen) — if your stack uses Imagen through the consumer-oriented API surface, read that page; do not assume parity with Vertex-only features.

---

## 3. Vertex AI — Imagen and “Gemini image” on Cloud

**Official hub:** [Generative AI on Vertex AI — Image overview](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)

Capabilities described there include **text-to-image**, **masked edit / outpainting-style workflows**, and **upscaling**, with **Python SDK** and **REST** examples (publisher model paths and `:predict` style calls).

**Imagen API reference (shape of `predict`):**  
[Imagen API (Vertex)](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api)

---

## 4. When to start with Gemini image vs Imagen 4 (Vertex doc’s framing)

Vertex’s image overview compares **Gemini image** vs **Imagen 4** at a high level. Paraphrased decision aid (confirm on the live doc):

| Topic | Gemini image (Vertex framing) | Imagen 4 (Vertex framing) |
|-------|-------------------------------|---------------------------|
| Strengths | Flexible, contextual; conversational / mask-free editing; combining elements from multiple references; style transfer while preserving subject | Strong quality / latency tradeoff for **specialized** image generation |
| Latency | Higher | Lower, closer to real-time for many setups |
| Cost model | Token-oriented | Positioned as cost-effective for specialized generation |
| Guidance | **Start with Gemini**; consider **Imagen 4 Ultra** when you need maximum quality or advanced specialized cases | |

This table is **product positioning**, not a benchmark. Measure for **your** prompts, region, and quota.

---

## 5. Prompt craft — Imagen on Vertex (official deep guide)

For **Imagen-style** prompting (subject / context / style, negative prompts, aspect ratios, photography vocabulary), use:

**[Prompt and image attribute guide (Vertex AI)](https://cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide)**

High-signal rules from that guide (still read the original):

- Structure prompts with **subject**, **context/background**, and **style**; iterate.
- For **text inside images**, keep strings **short** (the doc recommends **≤ 25 characters** for best results on supported versions).
- **Negative prompts:** describe what to **omit** plainly (e.g. `wall, frame`); avoid heavy use of “no / don’t” phrasing per Google’s examples.

---

## 6. Practical integration checklist

1. **Pick surface:** Gemini API vs Vertex AI (often decided by **auth**, **billing**, and **org policy**).
2. **Lock model ID** from the official doc for that surface; avoid copying IDs from blog posts alone.
3. **Parse multimodal responses** (parts, inline data, optional text).
4. **Log request IDs / errors** for quota and policy debugging.
5. **Reread docs** before changing model family (2.5 → 3.x style jumps often change config and token behavior).

---

## 7. This repo’s mock UI (local only)

Story-mode mocks in this workspace (`story-config-mock.html`, `story-config-result.html`) use **browser `localStorage`** for API key and result payload. That is **not** a Google security pattern for production; it exists for **local prototyping** only.

---

## See also

- [Google AI Studio](https://aistudio.google.com) — try prompts and models in a UI (availability varies by account and region).
- [Responsible AI / usage](https://cloud.google.com/vertex-ai/generative-ai/docs/image/responsible-ai-imagen) — linked from Vertex Imagen docs; read before user-facing launch.
