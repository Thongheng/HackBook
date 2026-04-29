#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CURATED_CATALOG = ROOT / "data" / "checklistCatalog.json"
VALID_ACCESS = {"blackbox", "greybox", "both"}
VALID_SEVERITY = {"critical", "high", "medium", "low", "info"}
VALID_ROW_TYPES = {"test", "setup"}
VALID_PLATFORM = {"web", "mobile", "desktop"}
VALID_SECTION = {"baseline", "custom"}
VALID_SOURCE = {"catalog", "curated"}
DISALLOWED_PROTOCOL_TECH = {"graphql", "oauth", "websocket"}
CANONICAL_SHEET_ORDER = [
    "WEB - Baseline",
    "WEB - Custom",
    "MOBILE - Baseline",
    "MOBILE - Custom",
    "DESKTOP - Baseline",
    "DESKTOP - Custom",
]
SHEET_MAP = {
    ("web", "baseline"): "WEB - Baseline",
    ("web", "custom"): "WEB - Custom",
    ("mobile", "baseline"): "MOBILE - Baseline",
    ("mobile", "custom"): "MOBILE - Custom",
    ("desktop", "baseline"): "DESKTOP - Baseline",
    ("desktop", "custom"): "DESKTOP - Custom",
}


def slug(platform: str, label: str | None) -> str | None:
    if not label:
        return None
    token = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return f"{platform}:{token}"


def main() -> int:
    curated = json.loads(CURATED_CATALOG.read_text(encoding="utf-8"))["rows"]
    structural_errors: list[str] = []

    duplicate_ids = [ref for ref, count in Counter(row["id"] for row in curated).items() if count > 1]
    if duplicate_ids:
        structural_errors.append(f"Duplicate ids in curated catalog: {', '.join(sorted(duplicate_ids))}")

    seen_sheet_order: list[str] = []
    active_sheet: str | None = None

    for row in curated:
        if row["platform"] not in VALID_PLATFORM:
            structural_errors.append(f"{row['id']}: invalid platform {row['platform']}")
        if row["section"] not in VALID_SECTION:
            structural_errors.append(f"{row['id']}: invalid section {row['section']}")
        if row["access"] not in VALID_ACCESS:
            structural_errors.append(f"{row['id']}: invalid access {row['access']}")
        if row["severity"] not in VALID_SEVERITY:
            structural_errors.append(f"{row['id']}: invalid severity {row['severity']}")
        if row["rowType"] not in VALID_ROW_TYPES:
            structural_errors.append(f"{row['id']}: invalid rowType {row['rowType']}")
        if row["source"] not in VALID_SOURCE:
            structural_errors.append(f"{row['id']}: invalid source {row['source']}")

        expected_sheet = SHEET_MAP[(row["platform"], row["section"])]
        if row["sourceSheet"] != expected_sheet:
            structural_errors.append(f"{row['id']}: sourceSheet should be {expected_sheet}, got {row['sourceSheet']}")
        if row["sourceRef"] != row["id"]:
            structural_errors.append(f"{row['id']}: sourceRef should match id")

        tools = row.get("tools")
        if not isinstance(tools, list):
            structural_errors.append(f"{row['id']}: tools must be an array")
        elif not 1 <= len(tools) <= 3:
            structural_errors.append(f"{row['id']}: tools must contain between 1 and 3 entries")
        elif any(not isinstance(tool, str) or not tool.strip() for tool in tools):
            structural_errors.append(f"{row['id']}: tools entries must be non-empty strings")
        elif len({tool.strip().lower() for tool in tools}) != len(tools):
            structural_errors.append(f"{row['id']}: tools entries must be unique")

        if any(tech in DISALLOWED_PROTOCOL_TECH for tech in row.get("tech", [])):
            structural_errors.append(f"{row['id']}: graphql/oauth/websocket must be modeled as feature selection, not tech tags")

        if row["section"] == "custom":
            if not row["featureKey"] or not row["featureLabel"]:
                structural_errors.append(f"{row['id']}: custom row missing feature metadata")
            elif row["featureKey"] != slug(row["platform"], row["featureLabel"]):
                structural_errors.append(
                    f"{row['id']}: featureKey should be {slug(row['platform'], row['featureLabel'])}, got {row['featureKey']}"
                )
        else:
            if row["featureKey"] or row["featureLabel"]:
                structural_errors.append(f"{row['id']}: baseline row should not carry feature metadata")

        if active_sheet != expected_sheet:
            if expected_sheet in seen_sheet_order:
                structural_errors.append(f"{row['id']}: sheet block {expected_sheet} is not contiguous")
            else:
                seen_sheet_order.append(expected_sheet)
                active_sheet = expected_sheet

    if seen_sheet_order != [sheet for sheet in CANONICAL_SHEET_ORDER if sheet in seen_sheet_order]:
        structural_errors.append("Catalog rows are not grouped in canonical sheet order.")

    print("Checklist catalog validation summary")
    print(f"- Catalog rows: {len(curated)}")
    print(f"- Sources: {dict(Counter(row['source'] for row in curated))}")
    print(f"- Platforms: {dict(Counter(row['platform'] for row in curated))}")
    print(f"- Sections: {dict(Counter(row['section'] for row in curated))}")
    print(f"- Sheet blocks: {', '.join(seen_sheet_order)}")

    if structural_errors:
        print("\nStructural issues")
        for issue in structural_errors:
            print(f"- {issue}")
        return 1

    print("\nStructural checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
