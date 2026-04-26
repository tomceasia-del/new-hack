# Safety Spec — Mandatory `safety_warning` Field for Every Fact & Product Angle

**Version:** 1.0.0 · **Last updated:** 2026-04-21

This file is the **single source of truth** that every domain harvester must read. It explains how to populate the `safety_warning` object required on every `canonical_fact` and `product_angle`.

---

## Why this exists

UncleD's channel handles medical topics (diabetes, cancer, supplements, fasting). A single script that tells a viewer to "หยุดยา" or "รักษามะเร็งเองที่บ้าน" can:

1. Get the channel permanently banned (TikTok medical policy)
2. Trigger อย. Thailand legal liability (พรบ.ยา 2510 / พรบ.อาหาร 2522)
3. Cause real harm to a viewer who stops insulin, warfarin, or chemotherapy

The `safety_warning` field lets a downstream `safety_validator.py` reject any composer output that pairs a non-green fact with forbidden phrasing.

---

## Field spec (copy into every fact + angle)

```json
"safety_warning": {
  "risk_level": "green | yellow | orange | red",
  "contraindications": ["<id from risk_taxonomy.contraindications>", "..."],
  "drug_interactions": ["warfarin (bleeding risk)", "metformin (hypoglycemia)"],
  "medical_supervision_required": true,
  "forbidden_scripts_th": [
    "ห้ามพูดว่า 'หยุดยา metformin แล้วกิน berberine แทน'",
    "ห้ามบอกว่า 'fasting รักษาเบาหวาน'"
  ],
  "required_disclaimer_th": "diabetes_th",
  "audience_exclusions": ["type_2_diabetes_on_medication", "pregnant_lactating"],
  "validator_keywords_th": ["แทน metformin", "หยุดยาเบาหวาน"],
  "regulatory_risk_notes": "อย. ไทย — berberine ไม่ได้ขึ้นทะเบียนเป็นยารักษาเบาหวาน"
}
```

---

## Risk-level decision tree

Use this flowchart for **every fact you write:**

1. Does the fact concern lifestyle behavior (exercise, sleep, hydration) with no drug/supplement/extreme behavior? → **green**
2. Does the fact involve a supplement/behavior that can interact with common Thai medications? → **yellow** (disclaimer required)
3. Does the fact involve extreme behavior (fasting >72h, megadose), reversal of a medical condition, or require audience filtering? → **orange**
4. Does the fact involve life-threatening conditions (cancer, T1 diabetes, pregnancy, organ failure) OR claim to replace medical care? → **red** (educational framing only, never as sales hook)

---

## Mandatory boilerplate by risk level

| risk_level | `required_disclaimer_th` (template_id) | `medical_supervision_required` | Can use as product angle? |
|---|---|---|---|
| green  | null | false | ✅ yes |
| yellow | `generic_medical_th` or domain template | false or true | ✅ yes (with disclaimer) |
| orange | domain-specific (e.g. `fasting_th`, `diabetes_th`) | true | ⚠️ yes if angle tier=T1/T2 + disclaimer + audience filter |
| red    | `cancer_th` or strongest applicable | true | ❌ NO — educational only |

Look up template IDs in `../safety/disclaimer_library.json`.

---

## Enum lookups

- **`contraindications`** → use ids from `../safety/risk_taxonomy.json` → `contraindications` object. Free-text is discouraged; prefer enum.
- **`audience_exclusions`** → use ids from `../safety/risk_taxonomy.json` → `audience_exclusions`.
- **`drug_interactions`** → can be free-text but prefer pattern: `"<drug> (<risk>)"`.
- **`validator_keywords_th`** → fact-specific phrases. The master list lives in `../safety/validator_keywords.json`; add only phrases not already in the master.

---

## Examples by domain (reference)

### Blood sugar — berberine fact
```json
{
  "fact_id": "bs_005",
  "statement_th": "Berberine 1,500 mg/วัน ลด HbA1c ได้ ~0.69% (meta-analysis 2024, N=4,150) เทียบเท่า metformin low-dose",
  "safety_warning": {
    "risk_level": "orange",
    "contraindications": ["type_2_diabetes_on_medication", "pregnancy_lactation", "type_1_diabetes"],
    "drug_interactions": ["metformin (synergistic hypoglycemia)", "cyclosporine (↑ blood levels 2-3x)", "warfarin (CYP2C9 interaction)"],
    "medical_supervision_required": true,
    "forbidden_scripts_th": [
      "ห้ามบอกว่า 'berberine = metformin' ตรง ๆ",
      "ห้ามบอกให้หยุดยาเบาหวานแล้วใช้ berberine แทน",
      "ห้ามบอกว่า berberine รักษาเบาหวานหายขาด"
    ],
    "required_disclaimer_th": "diabetes_th",
    "audience_exclusions": ["type_2_diabetes_on_medication", "pregnant_lactating", "type_1_diabetes", "under_18"],
    "validator_keywords_th": ["แทน metformin", "berberine รักษาเบาหวาน", "หยุดยาเบาหวาน"],
    "regulatory_risk_notes": "อย. ไทย: berberine ขึ้นทะเบียนเป็นอาหารเสริม ห้ามอ้าง 'รักษาเบาหวาน' — ใช้ 'สนับสนุนการควบคุมน้ำตาล'"
  }
}
```

### Bones — calcium fact
```json
{
  "fact_id": "bone_008",
  "statement_th": "Calcium citrate ดูดซึมดีกว่า calcium carbonate ~22-27% สำหรับผู้สูงอายุที่มี achlorhydria",
  "safety_warning": {
    "risk_level": "green",
    "contraindications": ["chronic_kidney_disease_stage_3_plus"],
    "drug_interactions": ["levothyroxine (ลดการดูดซึม — ห่างกัน 4 ชม.)", "tetracycline (chelation)"],
    "medical_supervision_required": false,
    "forbidden_scripts_th": ["ห้ามบอกว่า calcium รักษากระดูกพรุน"],
    "required_disclaimer_th": "supplement_th",
    "audience_exclusions": ["chronic_kidney_disease_stage_3_plus"],
    "validator_keywords_th": ["รักษากระดูกพรุน", "กระดูกงอกใหม่"],
    "regulatory_risk_notes": "อย. ไทย — ห้ามอ้าง 'รักษา/ป้องกันกระดูกพรุน' ใช้ 'สนับสนุนสุขภาพกระดูก'"
  }
}
```

### Longevity — autophagy/fasting fact
```json
{
  "fact_id": "aging_003",
  "statement_th": "Autophagy เริ่มเพิ่มขึ้นหลังอดอาหาร 24-48 ชม. (Bagherniya 2018)",
  "safety_warning": {
    "risk_level": "orange",
    "contraindications": ["type_1_diabetes", "type_2_diabetes_on_medication", "pregnancy_lactation", "eating_disorder_history", "elderly_frail", "cancer_active_treatment"],
    "drug_interactions": ["insulin (severe hypoglycemia)", "sulfonylurea (hypoglycemia)", "lithium (concentration increase)"],
    "medical_supervision_required": true,
    "forbidden_scripts_th": [
      "ห้ามแนะนำ fasting >48 ชม. ให้ผู้เป็นเบาหวาน/ผู้กินยา",
      "ห้ามบอกว่า fasting รักษามะเร็ง",
      "ห้ามพูดว่า 'autophagy = anti-aging guaranteed'"
    ],
    "required_disclaimer_th": "fasting_th",
    "audience_exclusions": ["type_1_diabetes", "type_2_diabetes_on_medication", "pregnant_lactating", "eating_disorder_history", "under_18", "elderly_65_plus_frail", "active_cancer_treatment"],
    "validator_keywords_th": ["fasting รักษามะเร็ง", "autophagy ย้อนวัย", "IF หายโรคทุกโรค"],
    "regulatory_risk_notes": "autophagy ยังไม่มีหลักฐานทางคลินิกที่อย. รับรองว่า 'ป้องกัน/รักษาโรค' ได้ — ใช้ framing 'กลไกทางชีววิทยา'"
  }
}
```

---

## Applies to which files

| File | `safety_warning` required? |
|---|---|
| `canonical_facts.json` | ✅ ทุก fact บังคับ |
| `product_angles.json` | ✅ ทุก angle บังคับ |
| `mechanisms.json` | ❌ not required (descriptive, not prescriptive) |
| `common_myths.json` | ⚠️ recommended for myths about diabetes/cancer — optional |
| `narrative_hooks.json` | ❌ inherits from `facts_used` (composer computes roll-up) |
| `entities.json` / `sources.json` / `sub_topics.json` / `keywords.json` | ❌ not required |

---

## Thai regulatory do's & don'ts (memorize)

**❌ FORBIDDEN phrasings** (อย. + TikTok medical policy + pharmacy act):
- "รักษา ___", "หาย ___", "ป้องกัน ___ ได้แน่นอน"
- "แทนยา ___"
- "ไม่ต้อง (หาหมอ/กินยา/ผ่าตัด/เคมีบำบัด)"
- "ฟื้นฟู ___ ได้ 100%"
- "ย้อนวัย ___ ได้"
- Specific disease mentions paired with supplement promises

**✅ ALLOWED phrasings**:
- "สนับสนุนการทำงานของ ___"
- "มีส่วนช่วยในการ ___"
- "เป็นส่วนประกอบที่ร่างกายต้องการ"
- "เหมาะสำหรับผู้ที่ต้องการดูแล ___"
- "ข้อมูลเพื่อการศึกษา — ปรึกษาแพทย์ก่อนใช้"

---

## Validation checklist before submitting harvest

- [ ] ทุก `fact` มี `safety_warning` ครบทุก field
- [ ] ทุก `product_angle` มี `safety_warning` ครบทุก field
- [ ] `risk_level` ไม่ใช่ค่าอื่นนอกจาก green/yellow/orange/red
- [ ] `contraindications` + `audience_exclusions` ใช้ ids จาก `risk_taxonomy.json`
- [ ] `required_disclaimer_th` เป็น template_id ที่มีจริงใน `disclaimer_library.json` (หรือ null สำหรับ green)
- [ ] Red-level facts ไม่ได้ถูก reference จาก `product_angles.supporting_facts[]`
- [ ] Drug interactions ครบสำหรับ top 5 Thai prescription categories (antidiabetic, anticoagulant, antihypertensive, statin, SSRI)
