"""
Build skeleton folders for all 20 domains — generates empty files per schema.
Run once. Safe to rerun (will not overwrite existing files with data).
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent  # .../data/domains
META = ROOT / "_meta"
TAXONOMY = json.load((META / "taxonomy.json").open(encoding="utf-8"))
SCHEMA = json.load((META / "schema.json").open(encoding="utf-8"))

FILES = [
    "keywords.json",
    "sub_topics.json",
    "canonical_facts.json",
    "mechanisms.json",
    "entities.json",
    "common_myths.json",
    "product_angles.json",
    "sources.json",
    "narrative_hooks.json",
]

SKELETON_TEMPLATES = {
    "keywords.json": lambda d: {
        "domain_id": d["id"],
        "primary_th": d.get("keywords_th", []),
        "primary_en": d.get("keywords_en", []),
        "aliases_th": [],
        "aliases_en": [],
        "jargon_th": [],
        "jargon_en": [],
        "regex_patterns": [],
    },
    "sub_topics.json": lambda d: {
        "domain_id": d["id"],
        "sub_topics": [
            {
                "id": st,
                "label_th": "",
                "label_en": "",
                "description": "",
                "key_concepts": [],
                "related_sub_topics": [],
                "difficulty": "intermediate",
                "uncleped_mentioned": False,
            }
            for st in d.get("sub_topics", [])
        ],
    },
    "canonical_facts.json": lambda d: {
        "domain_id": d["id"],
        "_meta": {
            "target_count": 20,
            "current_count": 0,
            "last_harvested": None,
        },
        "facts": [],
    },
    "mechanisms.json": lambda d: {
        "domain_id": d["id"],
        "_meta": {"target_count": 10, "current_count": 0, "last_harvested": None},
        "mechanisms": [],
    },
    "entities.json": lambda d: {
        "domain_id": d["id"],
        "people": [],
        "molecules": [],
        "organizations": [],
        "case_studies": [],
    },
    "common_myths.json": lambda d: {
        "domain_id": d["id"],
        "_meta": {"target_count": 5, "current_count": 0, "last_harvested": None},
        "myths": [],
    },
    "product_angles.json": lambda d: {
        "domain_id": d["id"],
        "product_categories_expected": d.get("product_categories", []),
        "angles": [],
    },
    "sources.json": lambda d: {
        "domain_id": d["id"],
        "authoritative_sources_expected": d.get("authoritative_sources", []),
        "sources": [],
    },
    "narrative_hooks.json": lambda d: {
        "domain_id": d["id"],
        "hook_templates": [],
    },
}


def build() -> tuple[int, int]:
    created = 0
    skipped = 0
    for dom in TAXONOMY["domains"]:
        folder = ROOT / dom["id"]
        folder.mkdir(parents=True, exist_ok=True)
        for fname in FILES:
            fpath = folder / fname
            if fpath.exists():
                skipped += 1
                continue
            data = SKELETON_TEMPLATES[fname](dom)
            fpath.write_text(
                json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            created += 1
        readme = folder / "README.md"
        if not readme.exists():
            readme.write_text(
                f"# {dom['label_th']} ({dom['label_en']})\n\n"
                f"- **ID**: `{dom['id']}`\n"
                f"- **Tier**: {dom['tier']}\n"
                f"- **Priority**: {dom['priority']}\n"
                f"- **UncleD coverage**: {dom['uncleped_clips']} clips ({dom['uncleped_coverage_pct']}%)\n"
                f"- **Market value (TH)**: {dom['market_value_th']}\n\n"
                f"## Description\n{dom.get('description_th', '')}\n\n"
                f"## Expected sources\n" + "\n".join(f"- {s}" for s in dom.get("authoritative_sources", [])) + "\n\n"
                f"## Product categories\n" + "\n".join(f"- `{p}`" for p in dom.get("product_categories", [])) + "\n",
                encoding="utf-8",
            )
            created += 1
    return created, skipped


if __name__ == "__main__":
    c, s = build()
    print(f"[skeleton] created={c}, skipped_existing={s}")
    print(f"[skeleton] domains: {len(TAXONOMY['domains'])}")
    print(f"[skeleton] files per domain: {len(FILES)} + README.md")
    print(f"[skeleton] done @ {datetime.now().isoformat(timespec='seconds')}")
