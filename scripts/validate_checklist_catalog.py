#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

from import_checklist_excel import DEFAULT_XLSX, load_rows


ROOT = Path(__file__).resolve().parents[1]
CURATED_CATALOG = ROOT / "data" / "checklistCatalog.json"
VALID_ACCESS = {"blackbox", "greybox", "both"}
VALID_SEVERITY = {"critical", "high", "medium", "low", "info"}
VALID_ROW_TYPES = {"test", "setup"}
VALID_PLATFORM = {"web", "mobile", "desktop"}
VALID_SECTION = {"baseline", "custom"}


def main() -> int:
    curated = json.loads(CURATED_CATALOG.read_text(encoding="utf-8"))["rows"]
    imported = load_rows(DEFAULT_XLSX)

    curated_by_id = {row["id"]: row for row in curated}
    imported_by_id = {row["id"]: row for row in imported}

    structural_errors: list[str] = []
    duplicate_ids = [ref for ref, count in Counter(row["id"] for row in curated).items() if count > 1]
    if duplicate_ids:
        structural_errors.append(f"Duplicate ids in curated catalog: {', '.join(sorted(duplicate_ids))}")

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
        if row["section"] == "custom" and (not row["featureKey"] or not row["featureLabel"]):
            structural_errors.append(f"{row['id']}: custom row missing feature metadata")
        if row["section"] == "baseline" and (row["featureKey"] or row["featureLabel"]):
            structural_errors.append(f"{row['id']}: baseline row should not carry feature metadata")

    missing_excel_refs = sorted(set(imported_by_id) - set(curated_by_id))
    repo_only_refs = sorted(set(curated_by_id) - set(imported_by_id))
    repo_only_curated = [ref for ref in repo_only_refs if curated_by_id[ref]["source"] == "curated"]
    repo_only_non_curated = [ref for ref in repo_only_refs if curated_by_id[ref]["source"] != "curated"]

    changed_fields: dict[str, list[str]] = defaultdict(list)
    comparable_fields = ["platform", "section", "featureLabel", "title", "objective", "severity", "rowType"]
    for ref in sorted(set(imported_by_id) & set(curated_by_id)):
        base = imported_by_id[ref]
        current = curated_by_id[ref]
        for field in comparable_fields:
            if base.get(field) != current.get(field):
                changed_fields[ref].append(field)

    orphan_features = sorted(
        feature
        for feature, count in Counter(row["featureKey"] for row in curated if row["featureKey"]).items()
        if count == 0
    )

    print("Checklist catalog validation summary")
    print(f"- Curated rows: {len(curated)}")
    print(f"- Excel rows: {len(imported)}")
    print(f"- Missing Excel refs in curated catalog: {len(missing_excel_refs)}")
    if missing_excel_refs:
        print(f"  {', '.join(missing_excel_refs)}")
    print(f"- Repo-only curated refs: {len(repo_only_curated)}")
    if repo_only_curated:
        print(f"  {', '.join(repo_only_curated)}")
    print(f"- Repo-only non-curated refs: {len(repo_only_non_curated)}")
    if repo_only_non_curated:
        print(f"  {', '.join(repo_only_non_curated)}")
    print(f"- Curated rows with Excel field drift: {len(changed_fields)}")
    for ref, fields in list(changed_fields.items())[:20]:
        print(f"  {ref}: {', '.join(fields)}")

    if orphan_features:
        structural_errors.append(f"Orphan feature keys: {', '.join(orphan_features)}")
    if repo_only_non_curated:
        structural_errors.append("Found repo-only rows not marked as curated.")

    if structural_errors:
        print("\nStructural issues")
        for issue in structural_errors:
            print(f"- {issue}")
        return 1

    print("\nStructural checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
