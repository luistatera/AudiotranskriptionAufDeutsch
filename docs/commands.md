## First Time Setup (Backend)
```bash
cd /Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```


## BE
cd /Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000


## FE
cd /Users/luis.guimaraes/AudiotranskriptionAufDeutsch/app/frontend
python -m http.server 5173


## Environment Variables
Make sure to set your Gemini API key:
```bash
export GEMINI_API_KEY=your_api_key_here
```

## Health Check
Once running, you can check if the backend is working:
```bash
curl http://localhost:8000/health
```


