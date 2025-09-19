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


-------

LA2.1.1:

Prompt 1:

The focus of this page is to help the German student to see the picture and understand the context. The student is learning german by listening to the audio and reading the text.

Prepare this page with the following content:

Show this picture of a group of people cooking together.
/Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/frontend/A2.1/img/people_cooking.png

On top of the text, add a button called "Play". 
When the student clicks on the button, the audio will play this file:
/Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/frontend/audio/LA2.1.1.mp3

Show this text:
---
James: Hallo Anna, schön, dass du heute mitkochst. Ich koche gerade eine Gemüsesuppe.
Frida: Oh, das riecht lecker, Markus! Welche Gemüse benutzt du?
James: Ich habe Karotten, Kartoffeln, Zwiebeln und ein bisschen Sellerie. Und am Ende gebe ich frische Petersilie dazu.
Frida: Sehr gesund! Ich mag Suppen besonders im Herbst, wenn es draußen kalt wird.
James: Ja, genau. Und Suppe ist einfach zu kochen. Was bereitest du da gerade vor?
Frida: Ich schneide Brot und mache kleine Bruschetta mit Tomaten und Basilikum.
James: Mmmh, das klingt köstlich. Magst du italienisches Essen?
Frida: Ja, sehr! Pasta, Pizza und frisches Brot sind meine Favoriten. Aber ich esse auch gern leichte Gerichte mit viel Gemüse.
James: Ich auch. Am liebsten esse ich abends etwas Warmes. Zum Beispiel eine Suppe oder gebratene Nudeln mit Gemüse.
Frida: Und isst du auch gern Fleisch?
James: Nicht so oft. Lieber Fisch oder vegetarische Gerichte. Und du?
Frida: Ähnlich. Ich mag Huhn, aber meistens esse ich Salate oder Nudeln.
James: Super! Dann passt unser Menü heute perfekt zusammen: eine Suppe, Bruschetta und vielleicht ein Glas Wein.
Frida: Ja, das wird ein richtig schöner Abend!
---


Prompt 2:
1) After the picture there will be 5 phrases with options and the student needs to select the correct option to complete the phrase.
---
Aufgaben

Markus kocht heute eine ______.
a) Pizza
b) Suppe ✅
c) Salat

Anna macht kleine Bruschetta mit ______.
a) Tomaten und Basilikum ✅
b) Käse und Schinken
c) Kartoffeln und Zwiebeln

Markus isst nicht so oft ______.
a) Gemüse
b) Fleisch ✅
c) Brot

Anna mag besonders gern ______.
a) Pasta und frisches Brot ✅
b) Fisch und Suppe
c) Käse und Wurst

Am Ende freuen sich beide auf ______.
a) einen schönen Abend ✅
b) einen Spaziergang im Park
c) einen Besuch im Kino
---

After this step comes the last one:

Prompt 3:

Add to the page a "Answer/Listen" button. When the student clicks on the button, the page will show a microphone icon and the student 
needs to record his voice answering the question:

- Was machen sie?
- Was kochen sie?
- Was essen sie?
- Was trinken sie?
- Wie viele Leute sind da?
- Was gefällt dir an diesem Bild am besten?
- Was denkst du über dieses Bild?

When the student is done, they need to click on the button "Stop". When it happens, do the same as this page is doing:
/Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/frontend/index.html
Recording the audio, sending the Gemini for transcription and showing the result in the textarea.


