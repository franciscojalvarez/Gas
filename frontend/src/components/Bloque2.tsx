import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

interface Accesorio {
  id: number;
  nombre: string;
  codigo?: string;
  precioUnitario: number;
  precio_unitario?: number;
  activo: boolean;
}

interface AccesorioConCantidad extends Accesorio {
  cantidad: number;
}

interface Compra {
  id: number;
  total: number;
  items: any;
  estado: string;
  metodoPago?: string;
  metodo_pago?: string;
  referenciaPago?: string;
  referencia_pago?: string;
  fechaCreacion?: string;
  fecha_creacion?: string;
  puntos_obtenidos?: number;
}

const Bloque2: React.FC = () => {
  const [accesorios, setAccesorios] = useState<AccesorioConCantidad[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({ referencia: '', metodo: 'transferencia' });

  useEffect(() => {
    loadAccesorios();
    loadCompras();
  }, []);

  const loadAccesorios = async () => {
    try {
      const res = await api.get<Accesorio[]>('/bloque2/accesorios');
      setAccesorios(res.data.map(a => ({ ...a, cantidad: 0 })));
    } catch { setMessage('Error al cargar accesorios'); }
  };

  const loadCompras = async () => {
    try {
      const res = await api.get<Compra[]>('/bloque2/compras');
      setCompras(res.data);
    } catch {}
  };

  const precio = (a: Accesorio) => Number(a.precioUnitario) || Number(a.precio_unitario) || 0;

  const accesoriosFiltrados = accesorios.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (a.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = accesorios.reduce((s, a) => s + a.cantidad * precio(a), 0);
  const puntosPreview = Math.floor(total / 1000);
  const itemsEnCarrito = accesorios.filter(a => a.cantidad > 0);

  const handleQty = (id: number, delta: number) =>
    setAccesorios(prev => prev.map(a => a.id === id ? { ...a, cantidad: Math.max(0, a.cantidad + delta) } : a));

  const handleQtyInput = (id: number, val: string) =>
    setAccesorios(prev => prev.map(a => a.id === id ? { ...a, cantidad: Math.max(0, parseInt(val) || 0) } : a));

  const handleComprar = () => {
    if (total === 0) { setMessage('Agregá al menos un accesorio'); return; }
    setShowPayment(true);
  };

  const handleConfirmPurchase = async () => {
    setLoading(true);
    try {
      const res = await api.post('/bloque2/compra', {
        items: itemsEnCarrito.map(a => ({ id: a.id, nombre: a.nombre, cantidad: a.cantidad, precio_unitario: precio(a) })),
        metodo_pago: paymentData.metodo,
        referencia_pago: paymentData.referencia
      });
      const puntos = (res.data as any).puntos_obtenidos || 0;
      setMessage(`✓ Compra realizada — Total: $${total.toLocaleString('es-AR')} — Puntos ganados: ${puntos} ⭐`);
      setShowPayment(false);
      setAccesorios(prev => prev.map(a => ({ ...a, cantidad: 0 })));
      setPaymentData({ referencia: '', metodo: 'transferencia' });
      loadCompras();
    } catch { setMessage('Error al realizar la compra'); }
    setLoading(false);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target?.result as string, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      try {
        await api.post('/bloque2/accesorios', {
          items: data.map(r => ({ nombre: r.Nombre || r.nombre, codigo: r.Codigo || r.codigo || '', precio_unitario: parseFloat(r['Precio Unitario'] || r.precio_unitario || 0) }))
        });
        setMessage('✓ Accesorios importados correctamente');
        loadAccesorios();
      } catch { setMessage('Error al importar Excel'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (!itemsEnCarrito.length) { setMessage('Agregá ítems antes de exportar'); return; }
    const ws = XLSX.utils.aoa_to_sheet([
      ['LISTA DE ACCESORIOS GASNET'],
      [`Fecha: ${new Date().toLocaleDateString('es-AR')}`],
      [],
      ['Código', 'Nombre', 'Precio Unitario', 'Cantidad', 'Subtotal'],
      ...itemsEnCarrito.map(a => [a.codigo || '-', a.nombre, precio(a), a.cantidad, a.cantidad * precio(a)]),
      [],
      ['', '', '', 'TOTAL:', total],
      ['', '', '', `Puntos a ganar (est.):`, puntosPreview],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 16 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accesorios Gasnet');
    XLSX.writeFile(wb, `accesorios_gasnet_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = { pendiente: 'badge-amber', aprobado: 'badge-green', rechazado: 'badge-red' };
    return map[estado] || 'badge-blue';
  };

  return (
    <div>
      <div className="module-header module-b2">
        <span className="module-icon">🛒</span>
        <div><h1>Compra de Accesorios Gasnet</h1><p>Catálogo oficial · Pagá por transferencia y acumulá puntos</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Catálogo */}
        <div style={{ flex: '1 1 560px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#16a34a' }}>Catálogo</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  📥 Importar Excel
                  <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <input
              type="text"
              placeholder="🔍  Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14, marginBottom: 14 }}
            />

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f0fdf4' }}>
                    <th style={{ padding: '9px 12px', textAlign: 'left', color: '#15803d', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #bbf7d0' }}>Cód.</th>
                    <th style={{ padding: '9px 12px', textAlign: 'left', color: '#15803d', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #bbf7d0' }}>Nombre</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', color: '#15803d', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #bbf7d0' }}>Precio</th>
                    <th style={{ padding: '9px 12px', textAlign: 'center', color: '#15803d', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #bbf7d0' }}>Cantidad</th>
                    <th style={{ padding: '9px 12px', textAlign: 'right', color: '#15803d', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #bbf7d0' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {accesoriosFiltrados.map(a => {
                    const p = precio(a);
                    return (
                      <tr key={a.id} style={{ borderBottom: '1px solid #f0fdf4', background: a.cantidad > 0 ? '#f0fdf4' : 'white' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12 }}>{a.codigo || '-'}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{a.nombre}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>${p.toLocaleString('es-AR')}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => handleQty(a.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>−</button>
                            <input
                              type="number" min="0"
                              value={a.cantidad || ''}
                              onChange={e => handleQtyInput(a.id, e.target.value)}
                              style={{ width: 48, textAlign: 'center', padding: '4px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 14 }}
                            />
                            <button onClick={() => handleQty(a.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: '#f1f5f9', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: a.cantidad > 0 ? 600 : 400, color: a.cantidad > 0 ? '#15803d' : '#94a3b8' }}>
                          {a.cantidad > 0 ? `$${(a.cantidad * p).toLocaleString('es-AR')}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {accesoriosFiltrados.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Sin resultados para "{busqueda}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel carrito / resumen */}
        <div style={{ flex: '0 0 280px', minWidth: 260 }}>
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#16a34a' }}>🛒 Resumen</h3>

            {itemsEnCarrito.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Agregá accesorios del catálogo.</p>
            ) : (
              <div style={{ marginBottom: 14 }}>
                {itemsEnCarrito.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0fdf4', fontSize: 13 }}>
                    <span style={{ color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.cantidad}× {a.nombre}</span>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>${(a.cantidad * precio(a)).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#374151' }}>Total</span>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#15803d' }}>${total.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Puntos a ganar</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#d97706' }}>⭐ {puntosPreview} pts</span>
              </div>
              {puntosPreview === 0 && total > 0 && (
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Necesitás ${(1000 - total).toLocaleString('es-AR')} más para ganar 1 punto</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-success" style={{ width: '100%' }} onClick={handleComprar} disabled={total === 0}>
                💳 Realizar Compra
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExportExcel} disabled={total === 0}>
                📤 Exportar Lista
              </button>
              {total > 0 && (
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setAccesorios(prev => prev.map(a => ({ ...a, cantidad: 0 })))}>
                  Limpiar selección
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 32, width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>Confirmar Compra</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Total: <strong>${total.toLocaleString('es-AR')}</strong> · Puntos a ganar: <strong>{puntosPreview} ⭐</strong></p>

            <div className="form-group">
              <label>Método de Pago</label>
              <select value={paymentData.metodo} onChange={e => setPaymentData(p => ({ ...p, metodo: e.target.value }))}>
                <option value="transferencia">Transferencia Bancaria</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de referencia / comprobante</label>
              <input
                type="text" placeholder="Ej: 123456789"
                value={paymentData.referencia}
                onChange={e => setPaymentData(p => ({ ...p, referencia: e.target.value }))}
              />
            </div>

            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#2563eb' }}>
              ℹ Datos bancarios: Gasnet S.A. · CBU 0070999720000000123456 · CUIT 30-12345678-9
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayment(false)}>Cancelar</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleConfirmPurchase} disabled={loading}>
                {loading ? 'Procesando...' : '✓ Confirmar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de compras */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Compras Realizadas</h2>
        {compras.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No hay compras registradas aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Fecha', 'Total', 'Método', 'Referencia', 'Estado', 'Puntos'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 14px' }}>{new Date(c.fechaCreacion || c.fecha_creacion || '').toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 600 }}>${Number(c.total).toLocaleString('es-AR')}</td>
                    <td style={{ padding: '9px 14px', color: '#64748b' }}>{c.metodoPago || c.metodo_pago || '-'}</td>
                    <td style={{ padding: '9px 14px', color: '#64748b' }}>{c.referenciaPago || c.referencia_pago || '-'}</td>
                    <td style={{ padding: '9px 14px' }}><span className={`badge ${estadoBadge(c.estado)}`}>{c.estado}</span></td>
                    <td style={{ padding: '9px 14px', color: '#d97706', fontWeight: 600 }}>{Math.floor(Number(c.total) / 1000)} ⭐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bloque2;
