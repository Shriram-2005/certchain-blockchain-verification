import spacy
import re
from datetime import datetime
from typing import Any

# Load English model (small — works on free HuggingFace CPU space)
# Run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None  # Graceful degradation if model not installed


def check_consistency(cert_text: dict, known_data: dict) -> dict:
    """
    NLP-based semantic consistency validation.
    
    Checks:
      1. Is the institution in our known institutions database?
      2. Is the date logic valid? (year is not in future, not before 1900)
      3. Does the degree type make sense for this institution type?
    
    Returns dict with boolean flags for each check.
    """
    result = {
        "institution_known": False,
        "dates_valid": True,
        "degree_institution_match": True,
        "all_passed": False,
    }

    institution = cert_text.get("institution", "").strip().lower()
    degree      = cert_text.get("degree", "").strip().lower()
    year_str    = str(cert_text.get("year", "")).strip()

    # ── Check 1: Institution recognized ────────────────────────────────────
    known_institutions = [k.lower() for k in known_data.get("institutions", [])]
    
    if institution:
        # Exact match
        if institution in known_institutions:
            result["institution_known"] = True
        else:
            # Partial match (e.g. "IIT" in "IIT Madras")
            result["institution_known"] = any(
                institution in ki or ki in institution
                for ki in known_institutions
            )

    # ── Check 2: Date logic ─────────────────────────────────────────────────
    if year_str:
        try:
            year = int(year_str)
            current_year = datetime.now().year
            if year > current_year or year < 1900:
                result["dates_valid"] = False
        except ValueError:
            result["dates_valid"] = False

    # ── Check 3: Degree ↔ Institution type match ────────────────────────────
    if degree and institution:
        # Map known degree keywords to institution types
        degree_keywords = {
            "medical": ["mbbs", "md", "bds", "nursing", "pharmacy", "medicine"],
            "engineering": ["b.tech", "b.e", "m.tech", "m.e", "engineering"],
            "law": ["llb", "llm", "law", "legal"],
            "management": ["mba", "pgdm", "management", "business"],
        }
        institution_types = known_data.get("institution_types", {})
        institution_type = None
        for k, v in institution_types.items():
            if any(name.lower() in institution for name in v):
                institution_type = k
                break

        if institution_type:
            expected_degrees = degree_keywords.get(institution_type, [])
            if expected_degrees:
                degree_matches = any(kw in degree for kw in expected_degrees)
                result["degree_institution_match"] = degree_matches

    result["all_passed"] = (
        result["institution_known"]
        and result["dates_valid"]
        and result["degree_institution_match"]
    )

    return result
