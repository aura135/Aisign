import os
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass


class ISLModelAdapter:
    def __init__(self):
        self.url = os.getenv("MODEL_API_URL", "").strip()
        self.api_key = os.getenv("MODEL_API_KEY", "").strip()
        try:
            self.min_confidence = float(os.getenv("MODEL_MIN_CONFIDENCE", "0.65"))
        except Exception:
            self.min_confidence = 0.65

    def configured(self):
        return bool(self.url)

    def predict(self, image_bytes):
        if not self.url:
            return {
                "label": None,
                "confidence": 0.0,
                "top_k": [],
                "message": "No real ISL recognition model is configured. Set MODEL_API_URL in backend/.env."
            }

        headers = {}
        if self.api_key:
            headers["Authorization"] = "Bearer " + self.api_key

        try:
            response = requests.post(
                self.url,
                files={"image": ("frame.jpg", image_bytes, "image/jpeg")},
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
        except Exception as exc:
            return {
                "label": None,
                "confidence": 0.0,
                "top_k": [],
                "message": "Model API request failed: " + str(exc)
            }

        label = (
            data.get("label")
            or data.get("prediction")
            or data.get("class_name")
            or data.get("sign")
        )

        confidence = data.get("confidence", data.get("score", 0.0))
        try:
            confidence = float(confidence)
        except Exception:
            confidence = 0.0

        top_k = data.get("top_k", [])

        if label and confidence >= self.min_confidence:
            message = "Recognition model prediction received."
        elif label:
            message = "A label was returned but confidence is below the configured threshold."
        else:
            message = "Model returned no recognized sign."

        return {
            "label": label if confidence >= self.min_confidence else None,
            "raw_label": label,
            "confidence": confidence,
            "top_k": top_k,
            "message": message
        }
