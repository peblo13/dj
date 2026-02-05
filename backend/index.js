const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure pdfs directory exists
const pdfDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

// Database setup
const db = new sqlite3.Database('./faktury.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS faktury (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      numer TEXT,
      data_wystawienia TEXT,
      data_sprzedazy TEXT,
      nabywca TEXT,
      kwota_netto REAL,
      vat REAL,
      kwota_brutto REAL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Extended invoices table with full items and PDF path
    db.run(`CREATE TABLE IF NOT EXISTS faktury_full (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      numer TEXT,
      data_wystawienia TEXT,
      data_sprzedazy TEXT,
      nabywca TEXT,
      sprzedawca TEXT,
      items TEXT,
      kwota_netto REAL,
      vat REAL,
      kwota_brutto REAL,
      pdf_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  }
});

// Routes
app.get('/api/faktury', (req, res) => {
  db.all('SELECT * FROM faktury', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ faktury: rows });
  });
});

app.post('/api/faktury', (req, res) => {
  const { numer, data_wystawienia, data_sprzedazy, nabywca, kwota_netto, vat } = req.body;
  const kwota_brutto = kwota_netto * (1 + vat / 100);
  db.run(`INSERT INTO faktury (numer, data_wystawienia, data_sprzedazy, nabywca, kwota_netto, vat, kwota_brutto) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [numer, data_wystawienia, data_sprzedazy, nabywca, kwota_netto, vat, kwota_brutto], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    });
});

// Save full invoice with items and optional PDF (base64)
app.post('/api/faktury-full', (req, res) => {
  const { numer, data_wystawienia, data_sprzedazy, nabywca, sprzedawca, items, totals, pdfBase64 } = req.body;
  const kwota_netto = totals?.netto || 0;
  const vat = totals?.vat || 0;
  const kwota_brutto = totals?.brutto || (kwota_netto + vat);

  db.run(`INSERT INTO faktury_full (numer, data_wystawienia, data_sprzedazy, nabywca, sprzedawca, items, kwota_netto, vat, kwota_brutto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [numer, data_wystawienia, data_sprzedazy, nabywca, sprzedawca, JSON.stringify(items), kwota_netto, vat, kwota_brutto], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const id = this.lastID;

      if (pdfBase64) {
        const filePath = path.join(pdfDir, `${id}.pdf`);
        fs.writeFile(filePath, pdfBase64, 'base64', (err) => {
          if (err) {
            res.status(500).json({ error: 'Nie udało się zapisać pliku PDF' });
            return;
          }
          db.run(`UPDATE faktury_full SET pdf_path = ? WHERE id = ?`, [filePath, id], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ id });
          });
        });
      } else {
        res.json({ id });
      }
    });
});

// Serve PDF by invoice id
app.get('/api/faktury/:id/pdf', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(pdfDir, `${id}.pdf`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'PDF not found' });
  }
});

// List full invoices
app.get('/api/faktury-full', (req, res) => {
  db.all('SELECT id, numer, nabywca, sprzedawca, kwota_netto, vat, kwota_brutto, pdf_path, created_at FROM faktury_full ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ faktury: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});