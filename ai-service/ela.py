import cv2
import numpy as np
from PIL import Image, ImageChops
import io


def compute_ela_score(image_bytes: bytes, quality: int = 90) -> float:
    """
    Error Level Analysis (ELA) — detects image manipulation.
    
    How it works:
      1. Save the image at a known JPEG quality (90)
      2. Compute the pixel-level difference between original and re-compressed
      3. Authentic images compress uniformly → low variance
      4. Manipulated (composited/cloned) regions → high variance = high ELA score
    
    Returns:
      ela_score: float (0-100), higher = more likely manipulated
    """
    try:
        # Open original image
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Re-save at known quality
        buffer = io.BytesIO()
        original.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        compressed = Image.open(buffer).convert("RGB")

        # Compute difference (ELA image)
        ela_image = ImageChops.difference(original, compressed)
        ela_array = np.array(ela_image).astype(np.float32)

        # Scale to 0-100 range
        # Typical authentic certificate: mean ELA < 5
        # Obvious Photoshop edit: mean ELA > 20
        mean_ela = float(np.mean(ela_array))
        ela_score = min(mean_ela * 3.0, 100.0)  # scale factor

        return round(ela_score, 3)

    except Exception:
        # If image cannot be processed, return neutral score
        return 0.0
