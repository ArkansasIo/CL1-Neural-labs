#!/usr/bin/env python3
"""Audit repository completeness and unresolved local references (stdlib only).

Run from any directory:
    python scripts/audit_repository.py
    python scripts/audit_repository.py --json
The tool reports actionable gaps; it does not claim that every optional file is required.
"""
from __future__ import annotations

import argparse
import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = {
    "project entry point": ["package.json", "README.md", "LICENSE", "index.html"],
    "frontend entry points": ["src/main.tsx", "src/App.tsx", "src/index.css", "vite.config.ts", "tsconfig.json"],
    "core simulation": ["src/simulation/neuralCulture.ts", "src/types/cl1.ts"],
    "backend and config": ["server.ts", ".env.example", "public/build-info.json"],
    "Python SDK": ["python/pyproject.toml", "python/requirements.txt", "python/cl1_neural_lab/cli.py", "python/cl1_neural_lab/server.py"],
    "automated checks": [".github/workflows/release-gates.yml", "python/tests", "sandbox/tests"],
}
SOURCE_SUFFIXES = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
IMPORT_RE = re.compile(
    r"""(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"]([^'"]+)['"]"""
)
MD_LINK_RE = re.compile(r"!?(?:\[[^\]]*\])\(([^)]+)\)")


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def source_files() -> list[Path]:
    ignored = {".git", "node_modules", "dist", "build", ".venv", "__pycache__"}
    return [
        p for p in ROOT.rglob("*")
        if p.is_file() and not any(part in ignored for part in p.parts)
        and p.suffix.lower() in SOURCE_SUFFIXES
    ]


def resolve_local_import(source: Path, specifier: str) -> bool:
    if not specifier.startswith("."):
        return True
    base = (source.parent / specifier).resolve()
    candidates = [base]
    if not base.suffix:
        candidates.extend(base.with_suffix(ext) for ext in (".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".css", ".svg", ".png", ".jpg", ".webp"))
        candidates.extend(base / ("index" + ext) for ext in (".ts", ".tsx", ".js", ".jsx", ".mjs"))
    return any(p.is_file() for p in candidates)


def audit_imports() -> list[dict[str, str]]:
    findings = []
    for source in source_files():
        try:
            content = source.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for match in IMPORT_RE.finditer(content):
            specifier = match.group(1)
            if specifier.startswith(".") and not resolve_local_import(source, specifier):
                findings.append({
                    "severity": "ERROR",
                    "kind": "unresolved-local-import",
                    "file": rel(source),
                    "reference": specifier,
                })
    return findings



def audit_python_imports() -> list[dict[str, str]]:
    """Check package-relative and explicit cl1_neural_lab imports for absent modules."""
    findings: list[dict[str, str]] = []
    package_root = ROOT / "python" / "cl1_neural_lab"

    def module_exists(base: Path) -> bool:
        return base.with_suffix(".py").is_file() or (base / "__init__.py").is_file()

    ignored = {".git", "node_modules", "dist", "build", ".venv", "__pycache__"}
    for source in ROOT.rglob("*.py"):
        if any(part in ignored for part in source.parts):
            continue
        try:
            tree = ast.parse(source.read_text(encoding="utf-8"), filename=str(source))
        except (OSError, UnicodeDecodeError, SyntaxError):
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.ImportFrom):
                continue
            if node.level:
                base = source.parent
                for _ in range(node.level - 1):
                    base = base.parent
                if node.module:
                    base = base.joinpath(*node.module.split("."))
                    if not module_exists(base):
                        findings.append({
                            "severity": "ERROR",
                            "kind": "unresolved-python-import",
                            "file": rel(source),
                            "reference": "." * node.level + node.module,
                        })
            elif node.module and (
                node.module == "cl1_neural_lab" or node.module.startswith("cl1_neural_lab.")
            ):
                suffix = node.module.removeprefix("cl1_neural_lab").strip(".")
                base = package_root.joinpath(*suffix.split(".")) if suffix else package_root
                if not module_exists(base):
                    findings.append({
                        "severity": "ERROR",
                        "kind": "unresolved-python-import",
                        "file": rel(source),
                        "reference": node.module,
                    })
    return findings


def audit_markdown_links() -> list[dict[str, str]]:
    findings = []
    for source in ROOT.rglob("*.md"):
        if any(part in {".git", "node_modules", "dist", "build"} for part in source.parts):
            continue
        try:
            content = source.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for match in MD_LINK_RE.finditer(content):
            target = match.group(1).strip().split("#", 1)[0].split("?", 1)[0]
            if not target or target.startswith(("https://", "http://", "mailto:", "data:")):
                continue
            # Ignore anchor-only links and reference-style links not expressed as paths.
            if target.startswith("#"):
                continue
            candidate = (source.parent / target).resolve()
            if not candidate.exists():
                findings.append({
                    "severity": "WARNING",
                    "kind": "broken-relative-markdown-link",
                    "file": rel(source),
                    "reference": target,
                })
    return findings


def audit_required_paths() -> list[dict[str, str]]:
    findings = []
    for group, paths in REQUIRED_FILES.items():
        for item in paths:
            path = ROOT / item
            if not path.exists():
                findings.append({
                    "severity": "ERROR",
                    "kind": "missing-required-path",
                    "group": group,
                    "reference": item,
                })
    return findings


def audit_frontend_test_setup() -> list[dict[str, str]]:
    package_path = ROOT / "package.json"
    if not package_path.is_file():
        return []
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    scripts = package.get("scripts", {})
    has_test_script = any(name in scripts for name in ("test", "test:unit", "test:ci"))
    has_frontend_tests = any(
        p.is_file() and (
            p.name.endswith((".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"))
            or "__tests__" in p.parts
        )
        for p in (ROOT / "src", ROOT / "tests")
        if p.exists()
        for p in p.rglob("*")
    )
    if not has_test_script or not has_frontend_tests:
        missing = []
        if not has_test_script:
            missing.append("package.json test/test:unit/test:ci script")
        if not has_frontend_tests:
            missing.append("frontend unit/component tests (*.test.ts[x] or *.spec.ts[x])")
        return [{
            "severity": "GAP",
            "kind": "frontend-test-coverage",
            "reference": "; ".join(missing),
        }]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="print machine-readable JSON")
    args = parser.parse_args()

    findings = audit_required_paths() + audit_imports() + audit_python_imports() + audit_markdown_links() + audit_frontend_test_setup()
    report = {
        "repository_root": str(ROOT),
        "source_files_scanned": len(source_files()),
        "finding_count": len(findings),
        "findings": findings,
    }
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"Repository completeness audit: {ROOT}")
        print(f"Source files scanned: {report['source_files_scanned']}")
        print(f"Findings: {len(findings)}")
        if not findings:
            print("No gaps found by the configured checks.")
        for finding in findings:
            location = finding.get("file", finding.get("group", "project"))
            print(f"[{finding['severity']}] {finding['kind']} — {location}: {finding['reference']}")
        print("\nNote: this is a static audit, not a build, test run, or hardware validation.")
    return 1 if any(f["severity"] == "ERROR" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
