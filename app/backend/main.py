import os
import shutil
import subprocess
import tempfile
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.api_core import exceptions as google_exceptions
from google.cloud import speech
from google.oauth2 import service_account

FFMPEG_PATH = shutil.which("ffmpeg")
CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID")
REGION = os.getenv("GOOGLE_SPEECH_REGION", "global")
SPEECH_MODEL = os.getenv("GOOGLE_SPEECH_MODEL", "latest_long")
API_ENDPOINT = os.getenv("GOOGLE_API_ENDPOINT")

app = FastAPI(title="Google Speech Transcription")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "null",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_speech_client: Optional[speech.SpeechClient] = None
_client_error: Optional[str] = None


def _init_speech_client() -> None:
    global _speech_client, _client_error
    if _speech_client or _client_error:
        return

    credentials = None
    if CREDENTIALS_PATH:
        if not os.path.exists(CREDENTIALS_PATH):
            _client_error = (
                f"Google credentials file not found at '{CREDENTIALS_PATH}'. "
                "Set GOOGLE_APPLICATION_CREDENTIALS to a valid path."
            )
            return
        try:
            credentials = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
        except Exception as exc:  # pragma: no cover - credential parsing failure
            _client_error = f"Unable to load Google credentials: {exc}"
            return

    endpoint = API_ENDPOINT
    if not endpoint and REGION and REGION.lower() != "global":
        endpoint = f"{REGION}-speech.googleapis.com"

    client_options = {"api_endpoint": endpoint} if endpoint else None

    try:
        _speech_client = speech.SpeechClient(credentials=credentials, client_options=client_options)
        _ = _speech_client.transport.grpc_channel
    except Exception as exc:  # pragma: no cover - client creation failure
        detail = "Failed to initialize Google Speech client"
        if not credentials and not CREDENTIALS_PATH:
            detail += "; set GOOGLE_APPLICATION_CREDENTIALS to a service account file"
        _client_error = f"{detail}: {exc}"


_init_speech_client()


@app.get("/health")
async def health() -> JSONResponse:
    if _client_error:
        return JSONResponse(status_code=500, content={"status": "error", "detail": _client_error})
    if not FFMPEG_PATH:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "detail": "ffmpeg not found. Install ffmpeg and ensure it is on PATH.",
            },
        )
    return JSONResponse(content={"status": "ok"})


def _ensure_client() -> speech.SpeechClient:
    if _client_error:
        raise HTTPException(status_code=500, detail=_client_error)
    if not _speech_client:
        raise HTTPException(status_code=500, detail="Speech client is not initialized")
    return _speech_client


def _convert_audio_to_wav(source_path: str) -> str:
    if not FFMPEG_PATH:
        raise HTTPException(
            status_code=500,
            detail="ffmpeg not found. Install ffmpeg and ensure it is on PATH.",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as wav_file:
        wav_path = wav_file.name

    command = [
        FFMPEG_PATH,
        "-y",
        "-i",
        source_path,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-f",
        "wav",
        "-loglevel",
        "error",
        wav_path,
    ]

    try:
        subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.decode("utf-8", errors="ignore")
        raise HTTPException(
            status_code=400,
            detail=f"Audio conversion failed: {stderr.strip() or exc}",
        ) from exc

    return wav_path


async def _save_upload_to_temp(upload: UploadFile) -> str:
    suffix = ".webm"
    if upload.filename and "." in upload.filename:
        ext = upload.filename.split(".")[-1].lower()
        if ext in ["mp4", "m4a", "mp3", "wav", "webm", "ogg"]:
            suffix = f".{ext}"
    elif upload.content_type:
        if "mp4" in upload.content_type:
            suffix = ".mp4"
        elif "mpeg" in upload.content_type:
            suffix = ".mp3"
        elif "wav" in upload.content_type:
            suffix = ".wav"
        elif "ogg" in upload.content_type:
            suffix = ".ogg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        contents = await upload.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty")
        temp_file.write(contents)
        path = temp_file.name

    return path


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> JSONResponse:
    if not audio:
        raise HTTPException(status_code=400, detail="Missing audio file")

    if audio.content_type and not audio.content_type.startswith("audio"):
        allowed_types = ["audio/", "video/mp4", "video/webm"]
        if not any(audio.content_type.startswith(t) for t in allowed_types):
            raise HTTPException(status_code=400, detail="Unsupported content type. Expected audio file.")

    client = _ensure_client()

    temp_input_path: Optional[str] = None
    temp_wav_path: Optional[str] = None

    try:
        temp_input_path = await _save_upload_to_temp(audio)
        temp_wav_path = _convert_audio_to_wav(temp_input_path)

        with open(temp_wav_path, "rb") as wav_file:
            wav_bytes = wav_file.read()
        if not wav_bytes:
            raise HTTPException(status_code=400, detail="Converted audio is empty")

        recognition_config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="de-DE",
            enable_automatic_punctuation=True,
            model=SPEECH_MODEL,
        )
        recognition_audio = speech.RecognitionAudio(content=wav_bytes)

        metadata = (("x-goog-user-project", PROJECT_ID),) if PROJECT_ID else ()

        try:
            response = client.recognize(
                config=recognition_config,
                audio=recognition_audio,
                metadata=metadata,
            )
        except (google_exceptions.GoogleAPICallError, google_exceptions.RetryError) as exc:
            raise HTTPException(status_code=502, detail=f"Google Speech API error: {exc}") from exc

        text_parts = [
            result.alternatives[0].transcript.strip()
            for result in response.results
            if result.alternatives
        ]
        text = " ".join(filter(None, text_parts))

        return JSONResponse(content={"text": text})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        if temp_input_path and os.path.exists(temp_input_path):
            os.unlink(temp_input_path)
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.unlink(temp_wav_path)


__all__ = ["app"]
