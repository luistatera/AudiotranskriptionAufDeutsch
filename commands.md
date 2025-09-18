
1st time:
cd app/backend && python3.10 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

2nd time:
cd app/backend && source .venv/bin/activate
cd app/frondend && source .venv/bin/activate


export WHISPER_MODEL=small && uvicorn main:app --reload --host 0.0.0.0 --port 8000


cd app/backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export WHISPER_MODEL=small
uvicorn main:app --reload --host 0.0.0.0 --port 8000



cd app/frontend
python -m http.server 5173


