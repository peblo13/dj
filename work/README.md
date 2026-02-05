# work

Projekt "work" — prosty frontend (Vite + React + Tailwind) i backend (Express) proxy do Jooble API.

Szybki start:

1. Backend
   - cd work/backend
   - npm install
   - copy .env.example .env and fill JOOBLE_API_KEY
   - npm run dev

2. Frontend
   - cd work/frontend
   - npm install
   - npm run dev

Frontend ma ustawione proxy na http://localhost:4000/api — wszystkie zapytania do `/api` będą przekazywane do backendu.


Uwagi:
- Nie dodawaj swojego prawdziwego klucza do publicznych repo; `.env` jest ignorowany przez git.
