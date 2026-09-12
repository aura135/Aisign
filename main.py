import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.model_adapter import ISLModelAdapter
from services.text_to_sign import SIGN_LIBRARY, text_to_sequence

app = FastAPI(title="SignBridge AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = ISLModelAdapter()


class TextRequest(BaseModel):
    text: str


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "service": "SignBridge AI",
        "model_configured": model.configured()
    }


@app.get("/api/signs")
def signs():
    return {
        "count": len(SIGN_LIBRARY),
        "signs": SIGN_LIBRARY
    }


@app.post("/api/sign-to-text")
async def sign_to_text(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WEBP image.")

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image.")

    return model.predict(image_bytes)


@app.post("/api/text-to-sign")
def text_to_sign(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    sequence, unknown = text_to_sequence(request.text)

    message = "Sign sequence created."
    if unknown:
        message += " Unmapped words: " + ", ".join(unknown)

    return {
        "text": request.text,
        "sequence": sequence,
        "unknown_words": unknown,
        "message": message
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
