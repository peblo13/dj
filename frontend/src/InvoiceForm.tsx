import React, { useMemo, useRef, useState } from 'react';
import './InvoiceForm.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';

type Item = {
  name: string;
  quantity: number;
  price: number;
  vat: number;
};

const initialState = {
  seller: '',
  buyer: '',
  items: [{ name: '', quantity: 1, price: 0, vat: 23 }] as Item[],
  invoiceNumber: '',
  issueDate: '',
};

export default function InvoiceForm() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (idx: number, field: keyof Item, value: any) => {
    const items = form.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { name: '', quantity: 1, price: 0, vat: 23 }] });
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const totals = useMemo(() => {
    const netto = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.price), 0);
    const vat = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.price) * (Number(it.vat) / 100), 0);
    const brutto = netto + vat;
    return { netto, vat, brutto };
  }, [form.items]);

  const validate = () => {
    if (!form.seller || !String(form.seller).trim()) return 'Brak danych sprzedawcy';
    if (!form.buyer || !String(form.buyer).trim()) return 'Brak danych nabywcy';
    if (!form.invoiceNumber || !String(form.invoiceNumber).trim()) return 'Brak numeru faktury';
    if (!form.issueDate) return 'Brak daty wystawienia';
    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      if (!it.name || !String(it.name).trim()) return `Brak nazwy w pozycji ${i + 1}`;
      if (!Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0) return `Nieprawidłowa ilość w pozycji ${i + 1}`;
      if (!Number.isFinite(Number(it.price)) || Number(it.price) < 0) return `Nieprawidłowa cena w pozycji ${i + 1}`;
      if (!Number.isFinite(Number(it.vat)) || Number(it.vat) < 0) return `Nieprawidłowy VAT w pozycji ${i + 1}`;
    }
    return null;
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    if (!previewRef.current) throw new Error('Brak podglądu');
    const node = previewRef.current;
    const canvas = await html2canvas(node, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'px', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    return blob as Blob;
  };

  const downloadPDF = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.invoiceNumber || 'faktura'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrors(String(err.message || err));
    }
  };

  const saveToServer = async (alsoUploadPdf = true) => {
    const err = validate();
    if (err) {
      setErrors(err);
      return;
    }
    setErrors(null);
    setSaving(true);
    try {
      let pdfBase64: string | null = null;
      if (alsoUploadPdf) {
        const blob = await generatePDFBlob();
        const b64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(String(reader.result).split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
        pdfBase64 = b64;
      }

      const payload = {
        numer: form.invoiceNumber,
        data_wystawienia: form.issueDate,
        nabywca: form.buyer,
        sprzedawca: form.seller,
        items: form.items,
        totals,
        pdfBase64,
      };

      const res = await axios.post('http://localhost:3001/api/faktury-full', payload);
      if (res.data && res.data.id) {
        alert('Faktura zapisana (id: ' + res.data.id + ')');
        setForm(initialState);
      }
    } catch (e: any) {
      console.error(e);
      setErrors(e?.response?.data?.error || e.message || 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <form className="invoice-form" onSubmit={(e) => e.preventDefault()}>
        <h2>Wystaw fakturę VAT</h2>

        {errors && <div style={{ color: 'crimson', fontWeight: 700 }}>{errors}</div>}

        <label>
          Sprzedawca (firma):
          <input name="seller" value={form.seller} onChange={handleChange} required />
        </label>
        <label>
          Nabywca (firma):
          <input name="buyer" value={form.buyer} onChange={handleChange} required />
        </label>
        <label>
          Numer faktury:
          <input name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} required />
        </label>
        <label>
          Data wystawienia:
          <input name="issueDate" type="date" value={form.issueDate} onChange={handleChange} required />
        </label>

        <h3>Pozycje faktury</h3>

        <div className="item-row-head">
          <div>Nazwa</div>
          <div>Ilość</div>
          <div>Cena netto</div>
          <div>VAT %</div>
          <div>Wartość brutto</div>
        </div>

        <div className="invoice-items">
          {form.items.map((item, idx) => {
            const lineTotal = (Number(item.quantity) * Number(item.price) * (1 + Number(item.vat) / 100)).toFixed(2);
            return (
              <div key={idx} className="invoice-item">
                <input
                  className="item-name"
                  placeholder="Nazwa towaru/usługi"
                  value={item.name}
                  onChange={e => handleItemChange(idx, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Ilość"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Cena netto"
                  value={item.price}
                  onChange={e => handleItemChange(idx, 'price', Number(e.target.value))}
                  required
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="VAT %"
                  value={item.vat}
                  onChange={e => handleItemChange(idx, 'vat', Number(e.target.value))}
                  required
                />
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{lineTotal} zł</div>
                <button type="button" className="btn btn-secondary" onClick={() => removeItem(idx)} style={{ marginLeft: 8 }}>Usuń</button>
              </div>
            );
          })}
        </div>

        <div className="invoice-actions">
          <button type="button" className="btn btn-secondary" onClick={addItem}>Dodaj pozycję</button>
          <button type="button" className="btn btn-primary" onClick={() => downloadPDF()}>Pobierz PDF</button>
          <button type="button" className="btn btn-primary" onClick={() => saveToServer(true)} disabled={saving}>{saving ? 'Zapisuję...' : 'Zapisz fakturę + PDF'}</button>
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div><strong>Suma netto:</strong> {totals.netto.toFixed(2)} zł</div>
            <div><strong>VAT:</strong> {totals.vat.toFixed(2)} zł</div>
            <div><strong>Razem (brutto):</strong> {totals.brutto.toFixed(2)} zł</div>
          </div>
        </div>
      </form>

      <div style={{ maxWidth: 920, margin: '1.5rem auto' }}>
        <h3>Podgląd faktury (to, co trafi do PDF)</h3>
        <div ref={previewRef as any} id="invoice-preview" style={{ background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 8px 30px rgba(16,24,40,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800 }}>{form.seller || 'Sprzedawca'}</div>
              <div style={{ color: '#6b7280' }}>{form.issueDate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800 }}>Faktura nr {form.invoiceNumber || '---'}</div>
              <div style={{ color: '#6b7280' }}>Do: {form.buyer || 'Nabywca'}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead style={{ color: '#6b7280', fontSize: 12 }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Nazwa</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Ilość</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Cena netto</th>
                <th style={{ textAlign: 'right', padding: 8 }}>VAT</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Wartość</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((it, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eef2f7' }}>
                  <td style={{ padding: 8 }}>{it.name}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{Number(it.price).toFixed(2)} zł</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{it.vat}%</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{(Number(it.quantity) * Number(it.price) * (1 + it.vat / 100)).toFixed(2)} zł</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12 }}>
            <div><strong>Netto:</strong> {totals.netto.toFixed(2)} zł</div>
            <div><strong>VAT:</strong> {totals.vat.toFixed(2)} zł</div>
            <div><strong>Brutto:</strong> {totals.brutto.toFixed(2)} zł</div>
          </div>
        </div>
      </div>
    </div>
  );
}
