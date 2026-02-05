# vatfaktura.pl

Nowoczesna aplikacja webowa do wystawiania i zarządzania fakturami VAT online.

## Technologie
- Frontend: React (TypeScript, Vite)
- Backend: Node.js (Express)
- Baza danych: SQLite
- Generowanie PDF: jsPDF, html2canvas

## Funkcje
- Panel klienta i admina
- Rejestracja/logowanie
- Zarządzanie fakturami
- Generowanie PDF
- Raporty
- Przygotowana pod integracje API i płatności online

## Instalacja

1. Sklonuj repozytorium:
   ```
   git clone <repo-url>
   cd vatfaktura.pl
   ```

2. Zainstaluj zależności backend:
   ```
   cd backend
   npm install
   ```

3. Zainstaluj zależności frontend:
   ```
   cd ../frontend
   npm install
   ```

4. Uruchom backend:
   ```
   cd ../backend
   npm start
   ```

5. Uruchom frontend (w nowej konsoli):
   ```
   cd ../frontend
   npm run dev
   ```

Aplikacja będzie dostępna na http://localhost:5173/

## Użycie

- Otwórz przeglądarkę i przejdź do http://localhost:5173/
- Użyj formularza do tworzenia faktur
- Faktury są zapisywane w bazie danych SQLite
- PDF można generować i pobierać
