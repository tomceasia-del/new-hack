# Life Coaching Domain

**Domain ID:** `life_coaching`  
**Tier:** Tier 2 (Behavior Science)  
**Status:** ✅ Complete — harvested 2026-04-22  
**Persona:** `discipline_coach` (primary), `uncleped` (secondary)

---

## Overview

Domain นี้ครอบคลุม **Behavior Science** สำหรับ life coaching content — ต่างจาก health domains ตรงที่ไม่มี drug interactions หรือ medical risks แต่มี **clinical boundary** ที่สำคัญมาก: **ห้ามนำเสนอ coaching เป็นการรักษาโรคจิตเวช**

---

## Sub-topics (8)

| ID | หัวข้อ | Difficulty |
|---|---|---|
| `habit_formation` | การสร้างนิสัย | Basic |
| `mindset` | กรอบความคิด (Growth/Fixed) | Basic |
| `self_control` | การควบคุมตนเอง & Willpower | Intermediate |
| `procrastination` | การผัดวันประกันพรุ่ง | Basic |
| `motivation` | แรงจูงใจ (Intrinsic/Extrinsic) | Intermediate |
| `behavior_design` | การออกแบบพฤติกรรม & Environment | Intermediate |
| `resilience` | ความยืดหยุ่นทางจิตใจ | Intermediate |
| `decision_making` | การตัดสินใจ & Cognitive Bias | Advanced |

---

## Key Figures

- **James Clear** — Atomic Habits, Identity-Based Habits, 1% Better
- **BJ Fogg** — Behavior Model (B=MAP), Tiny Habits (Stanford)
- **Carol Dweck** — Growth Mindset (Stanford)
- **Daniel Kahneman** — System 1/2, Loss Aversion, Prospect Theory (Nobel 2002)
- **Martin Seligman** — Learned Helplessness → Learned Optimism, PERMA
- **Roy Baumeister** — Ego Depletion, Willpower research
- **Phillippa Lally** — 66-day habit formation (UCL 2010)
- **Peter Gollwitzer** — Implementation Intention meta-analysis (94 studies)
- **Timothy Pychyl & Fuschia Sirois** — Procrastination as emotion regulation

---

## Content Count

| ไฟล์ | จำนวน |
|---|---|
| `canonical_facts.json` | 20 facts (T1: 9, T2: 8, T3: 3) |
| `mechanisms.json` | 7 mechanisms |
| `common_myths.json` | 9 myths |
| `product_angles.json` | 8 angles |
| `entities.json` | 20 people, 10 concepts, 9 orgs, 4 case studies |
| `narrative_hooks.json` | 7 hook templates |
| `sources.json` | 15 sources (Tier A: 11, Tier B: 4) |
| `keywords.json` | 10 primary TH, 10 primary EN, + aliases + regex |
| `sub_topics.json` | 8 sub-topics |

---

## Compliance Rules (สำคัญมาก)

### ห้ามเด็ดขาด
- ❌ Claim ว่า coaching/product **รักษา** depression, anxiety, PTSD, ADHD หรือโรคจิตเวชใดๆ
- ❌ บอกว่า coaching **แทนที่** licensed therapist หรือจิตแพทย์
- ❌ **รับประกัน** ผลลัพธ์ใดๆ (income, career, relationship)
- ❌ ใช้คำว่า **"บำบัด"** หรือ **"รักษา"** กับ coaching products
- ❌ **Diagnose** ผู้ชมว่ามี ADHD, depression, anxiety

### ต้องระวัง (Yellow)
- ⚠️ Procrastination content — อาจมี ADHD overlay ต้อง disclaimer
- ⚠️ Resilience content — อย่าใช้กับผู้ที่มีอาการ clinical depression
- ⚠️ Mindfulness/meditation — PTSD trigger risk
- ⚠️ Coaching programs — ต้องระบุ ICF-aligned scope of practice

### Risk Levels
- 🟢 **Green**: habit_formation, mindset, behavior_design, motivation (general)
- 🟡 **Yellow**: procrastination (ADHD), resilience (depression), coaching programs

---

## Differentiation จาก Health Domains

| ประเด็น | Health Domains | Life Coaching |
|---|---|---|
| Drug interactions | มี | ไม่มี |
| Medical supervision | ต้องระบุ | ไม่จำเป็น (ยกเว้น clinical cases) |
| อย. Thailand | Relevant | ไม่ relevant |
| Clinical boundary | Medical conditions | Mental health disorders |
| Evidence source | PubMed, Clinical trials | Social/behavioral psychology journals |

---

## ไฟล์ทั้งหมด (9/9 ✅)

```
life_coaching/
├── README.md              ✅
├── keywords.json          ✅
├── sub_topics.json        ✅
├── canonical_facts.json   ✅ (20 facts)
├── mechanisms.json        ✅ (7 mechanisms)
├── common_myths.json      ✅ (9 myths)
├── product_angles.json    ✅ (8 angles)
├── entities.json          ✅
├── narrative_hooks.json   ✅
└── sources.json           ✅
```
