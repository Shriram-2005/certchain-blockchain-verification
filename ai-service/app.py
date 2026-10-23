from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import json
import os
import re
from datetime import datetime

# Import our modules
from ocr import extract_text_from_image
from ela import compute_ela_score
from nlp_check import check_consistency

app = Flask(__name__)
CORS(app)

# Load known institutions database
INSTITUTIONS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "known_institutions.json")
with open(INSTITUTIONS_FILE, "r", encoding="utf-8") as f:
    KNOWN_DATA = json.load(f)


def compute_fraud_score(ocr_result: dict, ela_score: float, nlp_result: dict) -> dict:
    """
    Combine OCR, ELA, and NLP results into a single fraud score.
    
    Score breakdown:
      - ELA (image tampering):    0-70 points
      - NLP (inconsistencies):    0-20 points  
      - OCR mismatch:             0-10 points
    """
    score = 0.0
    flags = []

    # ELA contribution (max 70 points)
    ela_contribution = min(ela_score * 0.70, 70.0)
    score += ela_contribution
    if ela_score > 15:
        flags.append("ela_high_variance")
    if ela_score > 30:
        flags.append("ela_severe_manipulation")

    # NLP contribution (max 20 points)
    if not nlp_result.get("institution_known"):
        score += 10
        flags.append("institution_not_recognized")
    if not nlp_result.get("dates_valid"):
        score += 5
        flags.append("invalid_date_logic")
    if not nlp_result.get("degree_institution_match"):
        score += 5
        flags.append("degree_institution_mismatch")

    # OCR mismatch contribution (max 10 points)
    ocr_match = ocr_result.get("match_ratio", 1.0)
    if ocr_match < 0.7:
        score += 10
        flags.append("ocr_text_mismatch")
    elif ocr_match < 0.85:
        score += 5
        flags.append("ocr_partial_mismatch")

    # Numeric grade / CGPA alteration check
    if ocr_result.get("grade_mismatch"):
        score += 25.0
        flags.append("grade_mismatch_in_document")

    score = round(min(score, 100.0), 1)

    if score < 30:
        recommendation = "APPROVE"
    elif score < 70:
        recommendation = "REVIEW"
    else:
        recommendation = "REJECT"

    return {
        "fraudScore": score,
        "flags": flags,
        "recommendation": recommendation,
        "details": {
            "elaScore": round(ela_score, 2),
            "nlpConsistencyPassed": nlp_result.get("all_passed", False),
            "ocrTextMatchRatio": round(ocr_match, 3),
            "institutionRecognized": nlp_result.get("institution_known", False),
            "datesValid": nlp_result.get("dates_valid", True),
            "degreeInstitutionMatch": nlp_result.get("degree_institution_match", True)
        }
    }


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "CertChain AI Service is running", "version": "1.0.0"})


@app.route("/validate", methods=["POST"])
def validate():
    """
    Main validation endpoint.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        cert_text = data.get("certText", {})
        image_b64 = data.get("imageBase64", None)

        # ── Step 1: OCR ────────────────────────────────────────────────────
        ocr_result = {"match_ratio": 1.0, "extracted_text": ""}
        image_bytes = None
        if image_b64:
            if "," in image_b64:
                image_b64 = image_b64.split(",")[1]
            try:
                image_bytes = base64.b64decode(image_b64)
                ocr_result = extract_text_from_image(image_bytes, cert_text)
            except Exception as e:
                ocr_result = {"match_ratio": 0.9, "error": str(e)}

        # ── Step 2: ELA ────────────────────────────────────────────────────
        ela_score = 0.0
        if image_bytes:
            ela_score = compute_ela_score(image_bytes)

        # ── Step 3: NLP ────────────────────────────────────────────────────
        nlp_result = check_consistency(cert_text, KNOWN_DATA)

        # ── Step 4: Ensemble ───────────────────────────────────────────────
        result = compute_fraud_score(ocr_result, ela_score, nlp_result)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "error": str(e),
            "fraudScore": 0,
            "recommendation": "APPROVE",
            "flags": ["service_fallback"]
        }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Default 5000 matches Next.js .env.local
    app.run(host="0.0.0.0", port=port, debug=False)
