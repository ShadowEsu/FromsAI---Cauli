"""Google Form parsing for Cauliform — URL rules in **Jac**; HTML/JSON walk uses embedded Python (same algorithm as `src/lib/form-parser.ts`)."""
import re;
import from urllib.parse { urlparse }

def extract_form_id(url: str) -> str | None {
    patterns = [
        r"forms\.google\.com/forms/d/e/([a-zA-Z0-9_-]+)",
        r"forms\.google\.com/forms/d/([a-zA-Z0-9_-]+)",
        r"docs\.google\.com/forms/d/e/([a-zA-Z0-9_-]+)",
        r"docs\.google\.com/forms/d/([a-zA-Z0-9_-]+)",
    ];
    for pat in patterns {
        m = re.search(pat, url);
        if m {
            return m.group(1);
        }
    }
    return None;
}

def is_valid_google_form_url(url: str) -> bool {
    try {
        parsed = urlparse(url);
        host_ok = (
            parsed.hostname == "forms.google.com"
            or parsed.hostname == "docs.google.com"
        );
        return host_ok and "/forms/" in parsed.path;
    } except Exception {
        return False;
    }
}

def map_question_type(type_code: int) -> str {
    type_map = {
        0: "short_text",
        1: "long_text",
        2: "multiple_choice",
        3: "dropdown",
        4: "checkbox",
        5: "short_text",
        7: "short_text",
        9: "date",
        10: "time",
        13: "file_upload",
    };
    if type_code in type_map {
        return type_map[type_code];
    }
    return "short_text";
}

::py::
import json
import re as py_re
import urllib.request


def _map_question_type(code: int) -> str:
    mapping = {
        0: "short_text",
        1: "long_text",
        2: "multiple_choice",
        3: "dropdown",
        4: "checkbox",
        5: "short_text",
        7: "short_text",
        9: "date",
        10: "time",
        13: "file_upload",
    }
    return mapping.get(code, "short_text")


def _parse_form_data_structure(data: object) -> list:
    questions: list = []
    question_data = None
    if isinstance(data, list) and len(data) > 1:
        bucket = data[1]
        if isinstance(bucket, list) and len(bucket) > 1:
            question_data = bucket[1]
    if not isinstance(question_data, list):
        return questions
    for item in question_data:
        if not isinstance(item, list) or len(item) < 2:
            continue
        entry_block = None
        if len(item) > 4 and isinstance(item[4], list) and len(item[4]) > 0:
            entry_block = item[4][0]
        entry_id = None
        required_flag = False
        choice_data = None
        if isinstance(entry_block, list):
            if len(entry_block) > 0:
                entry_id = entry_block[0]
            if len(entry_block) > 2:
                required_flag = bool(entry_block[2])
            if len(entry_block) > 1:
                choice_data = entry_block[1]
        qid = str(item[0]) if item[0] is not None else ""
        title = str(item[1]) if len(item) > 1 and item[1] is not None else ""
        type_code = int(item[3]) if len(item) > 3 and item[3] is not None else 0
        question = {
            "id": qid,
            "title": title,
            "type": _map_question_type(type_code),
            "required": required_flag,
            "entryId": entry_id,
            "options": [],
        }
        if isinstance(choice_data, list):
            opts = []
            for opt in choice_data:
                if isinstance(opt, list) and len(opt) > 0:
                    opts.append(str(opt[0]) if opt[0] is not None else "")
            question["options"] = opts
        if title:
            questions.append(question)
    return questions


def _parse_google_form_py(url: str, form_id: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
        },
    )
    with urllib.request.urlopen(req) as response:
        html = response.read().decode("utf-8", errors="replace")
    title_match = py_re.search(r"<title>([^<]+)</title>", html)
    title = "Untitled Form"
    if title_match:
        title = title_match.group(1).replace(" - Google Forms", "")
    data_match = py_re.search(
        r"FB_PUBLIC_LOAD_DATA_\s*=\s*(\[[\s\S]*?\]);",
        html,
    )
    if not data_match:
        raise RuntimeError("Could not parse form structure")
    form_payload = json.loads(data_match.group(1))
    questions = _parse_form_data_structure(form_payload)
    return {"id": form_id, "title": title, "questions": questions}

::py::

def parse_google_form(url: str) -> any {
    form_id = extract_form_id(url);
    if form_id is None {
        raise ValueError("Invalid Google Form URL");
    }
    return _parse_google_form_py(url, form_id);
}
