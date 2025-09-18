# Lokale Whisper-Transkription (Deutsch)

Minimaler Stack, um deutsche Sprache lokal per Whisper (`faster-whisper`) zu transkribieren – ganz ohne Cloud.

## Voraussetzungen

- macOS/Linux/Windows mit **Python 3.10+**
- `ffmpeg` ist installiert und im `PATH` verfügbar (`ffmpeg -version` testen)
- Mikrofonzugriff im Browser erlaubt (Chrome/Edge empfohlen)

## Installation & Backend starten

```bash
cd app/backend
python3.10 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Optional: Modell verkleinern (tiny, base, medium, …)
export WHISPER_MODEL=small
uvicorn main:app --reload --port 8000
```

## Frontend starten

Einfachste Variante: `app/frontend/index.html` direkt im Browser öffnen.

Oder statisch servieren (empfohlen für CORS):

```bash
cd app/frontend
python -m http.server 5173
```

Danach im Browser `http://localhost:5173` öffnen. Falls du einen anderen Port verwendest, passe die erlaubten Origins in `app/backend/main.py` an.

## Nutzung

1. Backend (`uvicorn`) muss laufen.
2. Frontend im Browser öffnen.
3. **Start** klicken → Mikrofon erlauben → deutsch sprechen. Alle 5 Sekunden wird transkribierter Text an das Textfeld angehängt.
4. **Stop** beendet Aufnahme und Upload sofort. Den Text kannst du direkt markieren und kopieren.

## Hinweise

- Standardmodell ist `small` (gute Qualität bei akzeptabler CPU-Last). Für schwächere Hardware: `WHISPER_MODEL=base` oder `tiny` setzen.
- Die Verarbeitung läuft komplett lokal über `faster-whisper`. Es werden keine Daten an externe Dienste gesendet.
- Fehlermeldungen wie fehlender Mikrofonzugriff, nicht unterstützte Codecs oder fehlendes `ffmpeg` werden im Frontend-Status angezeigt.
- Für Tests ohne Browser kannst du die FastAPI-Endpunkte via `curl` oder `httpie` ansprechen (`/health`, `/transcribe`).
