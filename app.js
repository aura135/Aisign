const API = window.SIGNBRIDGE_CONFIG.API_BASE;
const video = document.getElementById("camera");
const overlay = document.getElementById("cameraOverlay");
const apiStatus = document.getElementById("apiStatus");
const predictionText = document.getElementById("predictionText");
const predictionConfidence = document.getElementById("predictionConfidence");
const predictionMessage = document.getElementById("predictionMessage");
const avatar = new SignAvatar(document.getElementById("avatar"));

let stream = null;
let captureTimer = null;
let sending = false;
let lastPrediction = "";

async function checkBackend() {
  try {
    const r = await fetch(API + "/api/health");
    const data = await r.json();
    apiStatus.textContent = data.model_configured ? "Backend + model connected" : "Backend connected • model not configured";
  } catch (e) {
    apiStatus.textContent = "Backend offline";
  }
}
checkBackend();

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    overlay.textContent = "Camera API is unavailable in this browser.";
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();
    overlay.textContent = "Camera running";
    if (!captureTimer) captureTimer = setInterval(captureAndPredict, 900);
  } catch (e) {
    overlay.textContent = "Camera permission/error: " + e.message;
  }
}

function stopCamera() {
  if (captureTimer) clearInterval(captureTimer);
  captureTimer = null;
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  video.srcObject = null;
  overlay.textContent = "Camera stopped";
}

async function captureAndPredict() {
  if (sending || !stream || video.readyState < 2) return;
  sending = true;

  try {
    const canvas = document.createElement("canvas");
    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.72));
    const form = new FormData();
    form.append("image", blob, "frame.jpg");

    const r = await fetch(API + "/api/sign-to-text", {
      method: "POST",
      body: form
    });

    const data = await r.json();

    if (data.label) {
      predictionText.textContent = data.label;
      predictionConfidence.textContent = "Confidence: " +
        (Number(data.confidence || 0) * 100).toFixed(1) + "%";
      predictionMessage.textContent = data.message || "Prediction received.";

      if (data.label !== lastPrediction && data.confidence >= 0.75) {
        lastPrediction = data.label;
      }
    } else {
      predictionMessage.textContent = data.message || "No confident prediction.";
    }
  } catch (e) {
    predictionMessage.textContent = "Recognition request failed: " + e.message;
  } finally {
    sending = false;
  }
}

document.getElementById("startCamera").onclick = startCamera;
document.getElementById("stopCamera").onclick = stopCamera;

document.getElementById("speakPrediction").onclick = () => {
  const text = predictionText.textContent;
  if (text && text !== "—") {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
};

document.getElementById("speakText").onclick = () => {
  const text = document.getElementById("textInput").value.trim();
  if (!text) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
};

document.getElementById("convertText").onclick = async () => {
  const text = document.getElementById("textInput").value.trim();
  const sequenceBox = document.getElementById("signSequence");
  const status = document.getElementById("signStatus");

  if (!text) {
    status.textContent = "Type a message first.";
    return;
  }

  status.textContent = "Converting text to ISL sequence…";

  try {
    const r = await fetch(API + "/api/text-to-sign", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text})
    });

    const data = await r.json();

    sequenceBox.textContent = data.sequence && data.sequence.length
      ? data.sequence.join(" → ")
      : "No mapped signs";

    status.textContent = data.message || "Sequence ready.";

    avatar.play(data.sequence || []);
  } catch (e) {
    status.textContent = "Text-to-sign request failed: " + e.message;
  }
};
