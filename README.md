# SignBridge AI — Two-Way ISL Communication Prototype

This project is structured as:

1. Camera -> ISL recognition -> English text -> voice
2. Text/voice -> ISL sign sequence -> animated boy/girl avatar

IMPORTANT:
- The camera is real browser camera access.
- The backend is ready to call a real ISL recognition model/API.
- A list of 200 sign names alone cannot create 200-sign recognition. Real recognition requires trained model weights or a real recognition API.
- The project therefore uses `MODEL_API_URL` as the model adapter. Put your trained/hosted ISL model endpoint there.
- The included avatar is a procedural prototype. Its motion library is an integration layer, not a claim that every generic arm movement is a linguistically validated ISL sign. For production, replace the motion data with validated ISL motion/pose data.

## Folder

SignBridgeAI/
  frontend/
    index.html
    app.js
    avatar.js
    styles.css
    config.js
  backend/
    main.py
    requirements.txt
    .env.example
    run_backend.bat
    services/
      model_adapter.py
      text_to_sign.py
    data/
      sign_dictionary.json
    models/
  run_frontend.bat
  README.md

## Windows 7

VS Code 1.70.3 is the last VS Code release that supports Windows 7.

Python 3.8 is the Python line to use on Windows 7. Python 3.8.10 is the last 3.8 release with a normal Windows installer.

For the easiest setup, use a 64-bit Windows 7 machine if possible.

## 1. Install Python

Install Python 3.8.10 and tick:

Add Python to PATH

Check:

python --version
pip --version

If Python was installed but `python` is not found, use the full Python path or reinstall with PATH enabled.

## 2. Open the project in VS Code

Open VS Code -> File -> Open Folder -> SignBridgeAI

Open the VS Code terminal.

## 3. Install backend packages

From the project root:

cd backend
python -m pip install -r requirements.txt

If `python` is not available but `py` is:

py -3.8 -m pip install -r requirements.txt

## 4. Configure the recognition model

Copy:

backend/.env.example

to:

backend/.env

Set:

MODEL_API_URL=

If you have a real ISL recognition server, for example:

MODEL_API_URL=http://127.0.0.1:9000/predict

The backend sends a JPEG frame as multipart form data named `image`.

The expected model response can be:

{
  "label": "HELLO",
  "confidence": 0.94,
  "top_k": [
    {"label": "HELLO", "confidence": 0.94},
    {"label": "THANK YOU", "confidence": 0.03}
  ]
}

The adapter also accepts common alternative field names such as `prediction`, `class_name`, `sign`, and `score`.

## 5. Start backend

From backend:

python main.py

or double-click:

backend/run_backend.bat

Backend:
http://127.0.0.1:8000

Health:
http://127.0.0.1:8000/api/health

## 6. Start frontend

Open another terminal at the project root:

python -m http.server 5500 --directory frontend

or double-click:

run_frontend.bat

Open:

http://127.0.0.1:5500

Camera permission is requested by the browser.

## Camera note

Do NOT open `index.html` using file://.

Use localhost:

http://127.0.0.1:5500

Modern browser security requires camera access from a secure context. Localhost is treated as a secure development origin by modern browsers.

## 7. Text -> animated ISL

Type:

Hello

or:

Thank you

or:

I need help

The backend tokenizes the sentence and returns a sign sequence.

The avatar then performs the configured animation sequence.

Unknown words are returned as `UNMAPPED`. Add validated sign motion data to:

frontend/avatar.js

and/or expand:

backend/data/sign_dictionary.json

## 8. 200+ signs

The recommended production pipeline is:

Camera
  -> landmark/frame preprocessing
  -> trained ISL model
  -> 200+ class prediction
  -> English text
  -> TTS

The INCLUDE dataset is a strong research starting point: it contains 263 word signs and thousands of videos. It is not itself a ready-made browser API.

Do not claim that this project has 200 working recognition classes until trained model weights have been connected and evaluated.

## 9. API endpoints

GET  /api/health
GET  /api/signs
POST /api/sign-to-text
POST /api/text-to-sign

`/api/sign-to-text` accepts a multipart JPEG image.

`/api/text-to-sign` accepts:

{
  "text": "Hello how are you?"
}

## 10. Troubleshooting

Camera does not open:
- Use http://127.0.0.1:5500
- Do not use file://
- Allow camera permission
- Close other applications using the camera
- If using Windows 7, browser compatibility may be the limiting factor.

Backend cannot start:
- Check `python --version`
- Use Python 3.8
- Run `python -m pip install -r backend/requirements.txt`

No recognition:
- The frontend is correctly sending frames, but a real recognition model must be configured with MODEL_API_URL.
- The fallback response intentionally says no model is configured instead of pretending a gesture was recognized.

## Security

Do not put private API keys in frontend JavaScript.

Put secrets in backend/.env.

This prototype does not implement production authentication, database persistence, encryption, rate limiting, or medical/legal-grade accuracy.
