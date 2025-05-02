IMPORTANT: vercel uses github to redeploy, so change "https://simp-production.up.railway.app" (which is my backend url) to "http://localhost:8000" before doing the following

To run the backend:
- cd backend
- python -m venv .venv && source .venv/bin/activate (ON MAC)
- pip install -r requirements.txt
- uvicorn main:app --reload

To run unit tests:
- cd backend

- python -m venv .venv && source .venv/bin/activate (ON MAC)
- pip install -r requirements.txt
^ if not already done, otherwise you just need source command

- python -m pytest tests/ -v


To run the frontend:
- cd frontend
- npm i
- npm run dev
