Design a developer plan and implementation to rebuild the existing "AudiotranskriptionAufDeutsch" project so that it keeps the same user experience but uses Google Cloud Speech-to-Text instead of local Whisper inference.

Context you can rely on from the current app:
- Frontend (`app/frontend`) is a static HTML/CSS/JS bundle. It records microphone audio with MediaRecorder, slices 15 second chunks, and POSTs each chunk to `POST /transcribe` on the backend. UI shows status messages and appends recognized text to a textarea.
- Backend (`app/backend`) is a FastAPI service. It exposes `/health` and `/transcribe`, handles CORS for localhost origins, writes uploaded chunks to temp files, converts them to 16 kHz mono WAV with `ffmpeg`, and runs `faster-whisper` (`WhisperModel`) in German (`language="de"`) to produce text.
- Environment variables live in `.env`; today the backend reads `WHISPER_MODEL` and defaults to `small`.

Your goal:
- Keep the same folder layout (`app/backend`, `app/frontend`) and the same frontend UX (buttons, status text, 15 s chunking, textarea aggregation).
- Replace the transcription engine with Google Cloud Speech-to-Text (preferred: latest "listen" or standard long-running model that fits 15 s clips). Use the official Python client (`google-cloud-speech`) in the backend; do not shell out to `gcloud`.
- Authenticate with a service account JSON (path supplied via env). Support configuration via environment variables (see `.env`): project ID, region/location, preferred STT model.

Backend specifics:
1. Keep FastAPI and the `/health` + `/transcribe` routes.
2. On startup, validate Google credentials and build a SpeechClient that reuses connections.
3. Accept the uploaded audio chunk, normalize it to the sample rate/encoding expected by Google (use `ffmpeg` like today if needed).
4. Call `speech.Recognize` (streaming or regular) with `language_code="de-DE"`, `enable_automatic_punctuation=True`, and apply the configured model/region.
5. Return the recognized transcript string in the same JSON shape `{ "text": "..." }` so the frontend stays untouched.
6. Handle error cases gracefully (bad upload, Google API errors, missing credentials) and surface clear messages.

Frontend specifics:
- Reuse the existing assets with minimal edits; only change what is required to point at the backend (for example, if additional status info is useful).
- Keep the polling/interval chunk logic so UX remains identical.

Developer deliverables:
- Updated backend code (FastAPI app, requirements) and any helper modules.
- Updated requirements listing `google-cloud-speech` and related dependencies.
- You can find credentials in .env in the root of this project

Please return a concise implementation plan plus the code changes required (files, snippets, explanations) to achieve the above.
