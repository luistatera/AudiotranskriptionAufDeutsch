import base64
import logging
import os
import shutil
import subprocess
import tempfile
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google.api_core import exceptions as google_api_exceptions
import google.generativeai as genai
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

FFMPEG_PATH = shutil.which("ffmpeg")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0"))
GEMINI_API_BASE = os.getenv("GENERATIVE_API_BASE")

_DEFAULT_PROMPT = (
    "WICHTIG: Diese Audiotranskription erfolgt ausschließlich für private Bildungszwecke und persönliches Lernen. "
    "Alle Inhalte werden nur für Studienzwecke verwendet und nicht kommerziell verwertet.\n\n"
    "Sie sind ein hochpräziser Spracherkennungsassistent für deutsche Sprache. "
    "Transkribieren Sie die folgende deutsche Audioaufnahme vollständig und wortgetreu für Lernzwecke. "
    "Dies ist eine private Sprachübung/Lernsession.\n\n"
    "Achten Sie auf:\n"
    "- Jedes einzelne Wort genau wiedergeben\n"
    "- Richtige deutsche Rechtschreibung und Grammatik\n"
    "- Natürliche Satzzeichen setzen\n"
    "- Keine Auslassungen oder Ergänzungen\n"
    "- Dialekte und umgangssprachliche Ausdrücke beibehalten\n\n"
    "Antworten Sie nur mit dem exakten deutschen Transkript ohne zusätzliche Kommentare:"
)

app = FastAPI(title="Gemini Speech Transcription")

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

_gemini_model: Optional[genai.GenerativeModel] = None
_client_error: Optional[str] = None
_generation_config = {
    "temperature": GEMINI_TEMPERATURE,
    "response_mime_type": "text/plain",
}


def _init_gemini_model() -> None:
    global _gemini_model, _client_error
    if _gemini_model or _client_error:
        return

    if not GEMINI_API_KEY:
        _client_error = "GEMINI_API_KEY environment variable is not set"
        return

    configure_kwargs = {"api_key": GEMINI_API_KEY}
    if GEMINI_API_BASE:
        configure_kwargs["client_options"] = {"api_endpoint": GEMINI_API_BASE}

    try:
        genai.configure(**configure_kwargs)
        _gemini_model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=_generation_config,
        )
    except Exception as exc:  # pragma: no cover - startup failure only
        _client_error = f"Failed to initialize Gemini client: {exc}"


_init_gemini_model()


@app.get("/")
async def root() -> JSONResponse:
    """Root endpoint with API information"""
    return JSONResponse(content={
        "message": "German Audio Transcription API with Gemini 2.5 Flash",
        "version": "1.0.0",
        "endpoints": {
            "/health": "Health check",
            "/test-gemini": "Test Gemini API connection",
            "/transcribe": "POST - Upload audio for transcription",
            "/transcribe-educational": "POST - Educational transcription with fair use emphasis",
            "/docs": "API documentation (Swagger UI)",
            "/redoc": "API documentation (ReDoc)"
        },
        "model": GEMINI_MODEL,
        "status": "running"
    })

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

@app.get("/test-gemini")
async def test_gemini() -> JSONResponse:
    """Test Gemini API with a simple text request"""
    logger.info("Testing Gemini API with simple text...")
    try:
        model = _ensure_model()
        
        # Simple text test (much faster than audio)
        import concurrent.futures
        
        def call_gemini():
            return model.generate_content("Say 'Hello, I am working!'")
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(call_gemini)
            try:
                response = future.result(timeout=10)
                text = (response.text or "").strip()
                logger.info(f"Gemini test response: {text}")
                return JSONResponse(content={"status": "ok", "test_response": text})
            except concurrent.futures.TimeoutError:
                logger.error("Gemini test timed out")
                return JSONResponse(status_code=504, content={"status": "timeout", "detail": "Gemini API timed out"})
    except Exception as e:
        logger.error(f"Gemini test failed: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})


def _ensure_model() -> genai.GenerativeModel:
    if _client_error:
        raise HTTPException(status_code=500, detail=_client_error)
    if not _gemini_model:
        raise HTTPException(status_code=500, detail="Gemini model is not initialized")
    return _gemini_model


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
        "48000",  # Higher sample rate for better quality
        "-ac",
        "1",      # Mono
        "-f",
        "wav",
        "-acodec",
        "pcm_s16le",  # 16-bit PCM for best quality
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


@app.post("/transcribe-educational")
async def transcribe_educational(audio: UploadFile = File(...)) -> JSONResponse:
    """Educational transcription endpoint with stronger fair use emphasis"""
    educational_prompt = (
        "EDUCATIONAL USE ONLY - FAIR USE DOCTRINE:\n"
        "This transcription is being performed under fair use provisions for educational purposes only. "
        "This is a private learning exercise and no commercial use is intended.\n\n"
        "Please transcribe this German language learning audio accurately. "
        "Focus on educational value and language learning support.\n\n"
        "Provide only the accurate German transcription:"
    )
    return await _transcribe_with_prompt(audio, educational_prompt)

async def _transcribe_with_prompt(audio: UploadFile, custom_prompt: str) -> JSONResponse:
    """Core transcription logic that can be used with different prompts"""
    logger.info("=== TRANSCRIPTION REQUEST STARTED ===")
    logger.info(f"Received audio file: {audio.filename}")
    logger.info(f"Content type: {audio.content_type}")
    logger.info(f"File size: {audio.size if hasattr(audio, 'size') else 'unknown'}")
    
    if not audio:
        logger.error("No audio file provided")
        raise HTTPException(status_code=400, detail="Missing audio file")

    if audio.content_type and not audio.content_type.startswith("audio"):
        allowed_types = ["audio/", "video/mp4", "video/webm"]
        if not any(audio.content_type.startswith(t) for t in allowed_types):
            logger.error(f"Unsupported content type: {audio.content_type}")
            raise HTTPException(status_code=400, detail="Unsupported content type. Expected audio file.")

    logger.info("Ensuring Gemini model is ready...")
    model = _ensure_model()
    logger.info("Gemini model ready")

    temp_input_path: Optional[str] = None
    temp_wav_path: Optional[str] = None

    try:
        logger.info("Saving uploaded file to temporary location...")
        temp_input_path = await _save_upload_to_temp(audio)
        logger.info(f"Saved to: {temp_input_path}")
        
        logger.info("Converting audio to WAV format...")
        temp_wav_path = _convert_audio_to_wav(temp_input_path)
        logger.info(f"Converted to: {temp_wav_path}")

        with open(temp_wav_path, "rb") as wav_file:
            wav_bytes = wav_file.read()
        
        logger.info(f"Read WAV file: {len(wav_bytes)} bytes")
        if not wav_bytes:
            logger.error("Converted audio is empty")
            raise HTTPException(status_code=400, detail="Converted audio is empty")

        logger.info("Encoding audio as base64...")
        encoded_audio = base64.b64encode(wav_bytes).decode("utf-8")
        logger.info(f"Base64 encoded length: {len(encoded_audio)} characters")

        contents = [
            {"text": custom_prompt},
            {
                "inline_data": {
                    "mime_type": "audio/wav",
                    "data": encoded_audio,
                }
            },
        ]

        try:
            logger.info("Sending request to Gemini API...")
            # Add timeout to prevent hanging
            import asyncio
            import concurrent.futures
            
            def call_gemini():
                return model.generate_content(contents=contents)
            
            # Use ThreadPoolExecutor with timeout
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(call_gemini)
                try:
                    response = future.result(timeout=30)  # Increased timeout for longer audio
                    logger.info("Received response from Gemini API")
                except concurrent.futures.TimeoutError:
                    logger.error("Gemini API call timed out after 30 seconds")
                    raise HTTPException(status_code=504, detail="Transcription service timed out after 30 seconds")
        except google_api_exceptions.GoogleAPIError as exc:
            logger.error(f"Gemini API error: {exc}")
            raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc
        except Exception as exc:  # pragma: no cover - unexpected SDK failure
            logger.error(f"Unexpected Gemini request failure: {exc}")
            raise HTTPException(status_code=502, detail=f"Gemini request failed: {exc}") from exc

        # Check for prompt-level blocking
        if getattr(response, "prompt_feedback", None) and response.prompt_feedback.block_reason:
            reason = response.prompt_feedback.block_reason.name
            logger.error(f"Gemini blocked the request: {reason}")
            raise HTTPException(status_code=502, detail=f"Gemini blocked the request: {reason}")

        # Check for finish reasons that indicate content issues
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason') and candidate.finish_reason:
                finish_reason = candidate.finish_reason
                logger.info(f"Gemini finish reason: {finish_reason}")
                
                # Handle copyright/recitation detection
                if finish_reason == 4:  # RECITATION
                    logger.warning("Gemini detected potential copyrighted content")
                    error_msg = (
                        "Transcription blocked: Gemini detected potential copyrighted material. "
                        "For personal study purposes, try:\n"
                        "1. Record your own voice reading the text\n"
                        "2. Use shorter audio segments\n"
                        "3. Paraphrase the content in your own words\n"
                        "4. Use the /transcribe-educational endpoint for fair use cases"
                    )
                    raise HTTPException(status_code=422, detail=error_msg)
                elif finish_reason in [2, 3]:  # SAFETY, MAX_TOKENS
                    reason_names = {2: "SAFETY", 3: "MAX_TOKENS", 4: "RECITATION"}
                    reason_name = reason_names.get(finish_reason, f"UNKNOWN({finish_reason})")
                    logger.warning(f"Gemini stopped generation due to: {reason_name}")
                    raise HTTPException(status_code=422, detail=f"Transcription incomplete: {reason_name}")

        # Try to get the text, handling the case where response.text might fail
        try:
            text = (response.text or "").strip()
        except ValueError as e:
            # This happens when response.text is called but no valid parts exist
            logger.error(f"Failed to get response text: {e}")
            if "copyrighted material" in str(e).lower() or "finish_reason" in str(e).lower():
                error_msg = (
                    "Transcription blocked: Content may contain copyrighted material. "
                    "For personal study, try recording your own voice or using shorter segments."
                )
                raise HTTPException(status_code=422, detail=error_msg)
            else:
                raise HTTPException(status_code=502, detail=f"Failed to extract transcription: {e}")
        
        logger.info(f"Gemini response text: '{text}' (length: {len(text)})")
        
        if not text:
            logger.error("Gemini returned an empty transcription")
            raise HTTPException(status_code=502, detail="Gemini returned an empty transcription")

        logger.info("=== TRANSCRIPTION REQUEST COMPLETED SUCCESSFULLY ===")
        return JSONResponse(content={"text": text})
    except HTTPException:
        logger.error("HTTP exception occurred during transcription")
        raise
    except Exception as exc:
        logger.error(f"Unexpected exception during transcription: {exc}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
    finally:
        logger.info("Cleaning up temporary files...")
        if temp_input_path and os.path.exists(temp_input_path):
            os.unlink(temp_input_path)
            logger.info(f"Deleted temp input file: {temp_input_path}")
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.unlink(temp_wav_path)
            logger.info(f"Deleted temp WAV file: {temp_wav_path}")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> JSONResponse:
    """Standard transcription endpoint"""
    return await _transcribe_with_prompt(audio, _DEFAULT_PROMPT)


__all__ = ["app"]
