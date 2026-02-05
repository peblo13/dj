import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import InvoiceForm from './InvoiceForm';

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>vatfaktura.pl</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/faktury">Faktury</Link>
            <Link to="/wystaw">Wystaw fakturę</Link>
            <Link to="/login">Login</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/faktury" element={<Faktury />} />
            <Route path="/wystaw" element={<InvoiceForm />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h2>Witaj w systemie faktur VAT</h2>
      <p>Zarządzaj swoimi fakturami online szybko i bezpiecznie.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Link to="/faktury" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', color: 'white', textDecoration: 'none', borderRadius: '25px', fontWeight: '600' }}>
          Zobacz faktury
        </Link>
        <Link to="/login" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(45deg, #4ecdc4, #ff6b6b)', color: 'white', textDecoration: 'none', borderRadius: '25px', fontWeight: '600' }}>
          Zaloguj się
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';

function Faktury() {
  const [faktury, setFaktury] = useState<any[]>([]);
  useEffect(() => {
    axios.get('http://localhost:3001/api/faktury-full')
      .then(r => setFaktury(r.data.faktury || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Lista faktur</h2>
      <div style={{ marginTop: 16 }}>
        {faktury.length === 0 && <div>Brak faktur</div>}
        {faktury.map(f => (
          <div key={f.id} style={{ padding: 12, borderRadius: 10, background: 'white', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{f.numer}</div>
              <div style={{ color: '#6b7280' }}>{f.sprzedawca} → {f.nabywca}</div>
              <div style={{ color: '#6b7280' }}>Brutto: {Number(f.kwota_brutto).toFixed(2)} zł</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {f.pdf_path ? (
                <a href={`http://localhost:3001/api/faktury/${f.id}/pdf`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary">Pobierz PDF</button>
                </a>
              ) : (
                <button className="btn btn-secondary" disabled>Brak PDF</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Login() {
  return (
    <div>
      <h2>Logowanie</h2>
      <form style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="email" placeholder="Email" required style={{ padding: '0.75rem', borderRadius: '5px', border: '1px solid #ccc' }} />
        <input type="password" placeholder="Hasło" required style={{ padding: '0.75rem', borderRadius: '5px', border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: '0.75rem', background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)', color: 'white', border: 'none', borderRadius: '25px', fontWeight: '600', cursor: 'pointer' }}>
          Zaloguj się
        </button>
        <p style={{ textAlign: 'center' }}>
          Nie masz konta? <Link to="/register" style={{ color: '#4ecdc4', textDecoration: 'none' }}>Zarejestruj się</Link>
        </p>
      </form>
    </div>
  );
}

export default App;