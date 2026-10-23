import cv2
import numpy as np
from PIL import Image, ImageChops
import io


def compute_ela_score(image_bytes: bytes, quality: int = 90) -> float:
    """
    Error Level Analysis (ELA) — detects image manipulation across raster images and PDFs.
    
    How it works:
      1. Converts PDF pages or image buffers to RGB PIL images.
      2. Re-saves at a known JPEG quality (90).
      3. Computes the pixel-level difference between original and re-compressed.
      4. Evaluates both average variance and 99th-percentile localized spikes to detect
         isolated tamper edits (e.g. altered CGPA digits or modified student names).
    """
    try:
        images_to_check = []

        # 1. Check if document is a PDF
        if image_bytes.startswith(b"%PDF") or b"%PDF-" in image_bytes[:100]:
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=image_bytes, filetype="pdf")
                for page in doc:
                    pix = page.get_pixmap(dpi=150)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    images_to_check.append(img)
            except Exception:
                pass

        # 2. If not PDF, open directly as standard image
        if not images_to_check:
            images_to_check.append(Image.open(io.BytesIO(image_bytes)).convert("RGB"))

        scores = []
        for original in images_to_check:
            buffer = io.BytesIO()
            original.save(buffer, format="JPEG", quality=quality)
            buffer.seek(0)
            compressed = Image.open(buffer).convert("RGB")

            # Compute difference (ELA image)
            ela_image = ImageChops.difference(original, compressed)
            ela_array = np.array(ela_image).astype(np.float32)

            mean_ela = float(np.mean(ela_array))
            p99_ela = float(np.percentile(ela_array, 99))

            # Scaled score: captures overall page noise plus sharp localized spikes
            page_score = (mean_ela * 2.0) + (p99_ela * 0.45)
            scores.append(page_score)

        max_score = max(scores) if scores else 0.0
        return round(min(max_score, 100.0), 3)

    except Exception:
        # If document cannot be processed, return neutral score
        return 0.0
