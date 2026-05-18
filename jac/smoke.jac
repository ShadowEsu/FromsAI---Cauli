"""Jac smoke tests — validates `.jac` surface (`jac/` modules), no HTTP."""

import form_parser;

with entry {
    sample_url = "https://docs.google.com/forms/d/e/ABC123xyz/viewform";
    extracted = form_parser.extract_form_id(sample_url);
    if extracted != "ABC123xyz" {
        raise AssertionError("extract_form_id mismatch");
    }
    if not form_parser.is_valid_google_form_url(sample_url) {
        raise AssertionError("expected valid Google Form URL");
    }
    if form_parser.map_question_type(2) != "multiple_choice" {
        raise AssertionError("map_question_type mismatch");
    }
    print("Jac smoke: OK — URL helpers behave as expected.");
}
