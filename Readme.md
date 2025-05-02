To run the backend:
- cd backend
- python -m venv .venv && source .venv/bin/activate (ON MAC)
- pip install -r requirements.txt
- uvicorn main:app --reload


To run the frontend:
- cd frontend
- npm i
- npm run dev  # localhost:5173 with Vite proxy -> 8000