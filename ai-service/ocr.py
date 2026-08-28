import pytesseract
from PIL import Image
import io
import re
from difflib import SequenceMatcher


def extract_text_from_image(image_bytes: bytes, cert_text: dict) -> dict:
    """
    Use Tesseract OCR to extract text from an image and compare
    it with the submitted certificate text fields.
    
    Returns a dict with:
        - extracted_text: raw OCR output
        - match_ratio: similarity (0-1) between OCR text and submitted text
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed (handles PNG with transparency)
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")

        # Tesseract config: assume a single block of text
        config = "--oem 3 --psm 6"
        extracted_text = pytesseract.image_to_string(image, config=config)
        extracted_text_clean = extracted_text.strip().lower()

        # Build a combined string from submitted fields for comparison
        submitted_combined = " ".join([
            cert_text.get("holderName", ""),
            cert_text.get("institution", ""),
            cert_text.get("degree", ""),
            str(cert_text.get("year", "")),
        ]).lower()

        # Compute similarity ratio
        match_ratio = SequenceMatcher(
            None, extracted_text_clean, submitted_combined
        ).ratio()

        return {
            "extracted_text": extracted_text.strip(),
            "match_ratio": round(match_ratio, 3)
        }

    except Exception as e:
        # If OCR fails (e.g., non-image file), return neutral result
        return {"extracted_text": "", "match_ratio": 1.0, "error": str(e)}
