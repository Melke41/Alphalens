# AlphaLens

Institutional-grade AI-powered quantitative research platform.

## Structure

- **frontend/** — React + Vite dashboard (charts, research UI)
- **backend/** — FastAPI API (data, quant math, AI, reports)

## Quick start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
