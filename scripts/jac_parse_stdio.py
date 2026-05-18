#!/usr/bin/env python3
"""Stdio bridge: one JSON object on stdin `{\"url\": \"...\"}` → JSON `{ ok, data }` for Next.js."""

from __future__ import annotations

import json
import os
import sys


def main() -> None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    jac_dir = os.path.join(repo_root, "jac")
    if jac_dir not in sys.path:
        sys.path.insert(0, jac_dir)

    import form_parser as fp

    raw = sys.stdin.read()
    if not raw.strip():
        print(json.dumps({"ok": False, "error": "empty stdin"}))
        sys.exit(1)
    payload = json.loads(raw)
    url = payload.get("url")
    if not url or not isinstance(url, str):
        print(json.dumps({"ok": False, "error": "url required"}))
        sys.exit(1)
    try:
        data = fp.parse_google_form(url)
        print(json.dumps({"ok": True, "data": data}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
