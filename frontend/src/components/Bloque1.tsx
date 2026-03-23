import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

interface Item {
  id: number;
  nombre: string;
  precioUnitario: number;
  precio_unitario?: number;
  categoria: string;
  activo: boolean;
}

interface ItemConCantidad extends Item {
  cantidad: number;
}

interface AccesorioConCantidad {
  id: number;
  nombre: string;
  codigo?: string;
  precioUnitario: number;
  precio_unitario?: number;
  cantidad: number;
}

interface Presupuesto {
  id: number;
  total: number;
  items: any;
  fechaCreacion: string;
  fecha_creacion?: string;
}

const COLORES_CATEGORIA: Record<string, string> = {
  'Instalación Gas': '#2563eb',
  'Instalación Sanitaria': '#0891b2',
  'Reparación y Mantenimiento': '#d97706',
};

const colorCategoria = (cat: string) => COLORES_CATEGORIA[cat] || '#6366f1';

const Bloque1: React.FC = () => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [items, setItems] = useState<ItemConCantidad[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Gestión de ítems
  const [showGestion, setShowGestion] = useState(false);
  const [newItem, setNewItem] = useState({ nombre: '', precio: '', categoria: '' });
  const [editItem, setEditItem] = useState<{ id: number; nombre: string; precio: string } | null>(null);

  // Presupuesto combinado
  const [showCombinado, setShowCombinado] = useState(false);
  const [accesorios, setAccesorios] = useState<AccesorioConCantidad[]>([]);

  const total = items.reduce((s, i) => s + i.cantidad * (Number(i.precioUnitario) || Number(i.precio_unitario) || 0), 0);
  const totalAccesorios = accesorios.reduce((s, a) => s + a.cantidad * (Number(a.precioUnitario) || Number(a.precio_unitario) || 0), 0);

  const loadCategorias = useCallback(async () => {
    const res = await api.get<string[]>('/bloque1/categorias');
    setCategorias(res.data);
    if (res.data.length > 0 && (!selectedCategoria || !res.data.includes(selectedCategoria))) {
      setSelectedCategoria(res.data[0]);
    }
  }, [selectedCategoria]);

  const loadItems = useCallback(async (cat: string) => {
    const res = await api.get<Item[]>(`/bloque1/items?categoria=${encodeURIComponent(cat)}`);
    setItems(res.data.map(i => ({ ...i, cantidad: 0 })));
  }, []);

  const loadPresupuestos = useCallback(async () => {
    const res = await api.get<Presupuesto[]>('/bloque1/presupuestos');
    setPresupuestos(res.data);
  }, []);

  const loadAccesorios = useCallback(async () => {
    const res = await api.get<any[]>('/bloque2/accesorios');
    setAccesorios(res.data.map((a: any) => ({ ...a, cantidad: 0 })));
  }, []);

  useEffect(() => {
    loadCategorias();
    loadPresupuestos();
  }, []);

  useEffect(() => {
    if (selectedCategoria) {
      loadItems(selectedCategoria);
      setNewItem(n => ({ ...n, categoria: selectedCategoria }));
    }
  }, [selectedCategoria]);

  useEffect(() => {
    if (showCombinado && accesorios.length === 0) loadAccesorios();
  }, [showCombinado]);

  const handleQty = (id: number, val: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, cantidad: parseFloat(val) || 0 } : i));

  const handleQtyAcc = (id: number, delta: number) =>
    setAccesorios(prev => prev.map(a => a.id === id ? { ...a, cantidad: Math.max(0, a.cantidad + delta) } : a));

  const handleSavePresupuesto = async () => {
    const activos = items.filter(i => i.cantidad > 0);
    if (!activos.length) { setMessage('Agregá al menos un ítem con cantidad'); return; }
    setLoading(true);
    try {
      await api.post('/bloque1/presupuesto', {
        categoria: selectedCategoria,
        items: activos.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, precio_unitario: Number(i.precioUnitario) || Number(i.precio_unitario) || 0 }))
      });
      setMessage('✓ Presupuesto guardado correctamente');
      loadPresupuestos();
      setItems(prev => prev.map(i => ({ ...i, cantidad: 0 })));
    } catch { setMessage('Error al guardar presupuesto'); }
    setLoading(false);
  };

  const handleExportExcel = () => {
    const activos = items.filter(i => i.cantidad > 0);
    if (!activos.length) { setMessage('Ingresá cantidades antes de exportar'); return; }
    const ws = XLSX.utils.aoa_to_sheet([
      [`PRESUPUESTO DE MANO DE OBRA — ${selectedCategoria.toUpperCase()}`],
      [`Fecha: ${new Date().toLocaleDateString('es-AR')}`],
      [],
      ['Ítem', 'Precio Unitario', 'Cantidad', 'Subtotal'],
      ...activos.map(i => {
        const p = Number(i.precioUnitario) || Number(i.precio_unitario) || 0;
        return [i.nombre, p, i.cantidad, i.cantidad * p];
      }),
      [],
      ['', '', 'TOTAL:', total],
    ]);
    ws['!cols'] = [{ wch: 45 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mano de Obra');
    XLSX.writeFile(wb, `presupuesto_mo_${selectedCategoria.replace(/\s/g, '_')}.xlsx`);
  };

  const handleExportCombinado = () => {
    const moActivos = items.filter(i => i.cantidad > 0);
    const accActivos = accesorios.filter(a => a.cantidad > 0);
    if (!moActivos.length && !accActivos.length) { setMessage('Ingresá cantidades antes de exportar'); return; }

    const rows: any[][] = [
      [`PRESUPUESTO COMPLETO — ${selectedCategoria.toUpperCase()}`],
      [`Fecha: ${new Date().toLocaleDateString('es-AR')}`],
      [],
    ];

    if (moActivos.length) {
      rows.push(['── MANO DE OBRA ──', '', '', '']);
      rows.push(['Ítem', 'Precio Unitario', 'Cantidad', 'Subtotal']);
      moActivos.forEach(i => {
        const p = Number(i.precioUnitario) || Number(i.precio_unitario) || 0;
        rows.push([i.nombre, p, i.cantidad, i.cantidad * p]);
      });
      rows.push(['', '', 'Subtotal MO:', total]);
      rows.push([]);
    }

    if (accActivos.length) {
      rows.push(['── ACCESORIOS GASNET ──', '', '', '']);
      rows.push(['Código', 'Ítem', 'Precio Unitario', 'Cantidad', 'Subtotal']);
      accActivos.forEach(a => {
        const p = Number(a.precioUnitario) || Number(a.precio_unitario) || 0;
        rows.push([a.codigo || '-', a.nombre, p, a.cantidad, a.cantidad * p]);
      });
      rows.push(['', '', '', 'Subtotal Accesorios:', totalAccesorios]);
      rows.push([]);
    }

    rows.push(['', '', '', 'TOTAL GENERAL:', total + totalAccesorios]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 42 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto Completo');
    XLSX.writeFile(wb, `presupuesto_completo_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
        await api.post('/bloque1/items', {
          categoria: selectedCategoria,
          items: data.map(r => ({ nombre: r.Nombre || r.nombre, precio_unitario: parseFloat(r['Precio Unitario'] || r.precio_unitario || 0), categoria: selectedCategoria }))
        });
        setMessage('✓ Ítems importados correctamente');
        loadItems(selectedCategoria);
      } catch { setMessage('Error al importar Excel'); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleAddItem = async () => {
    if (!newItem.nombre || !newItem.precio) { setMessage('Completá nombre y precio'); return; }
    try {
      await api.post('/bloque1/item', { nombre: newItem.nombre, precio_unitario: Number(newItem.precio), categoria: newItem.categoria || selectedCategoria });
      setMessage('✓ Ítem agregado');
      setNewItem({ nombre: '', precio: '', categoria: selectedCategoria });
      loadItems(selectedCategoria);
      loadCategorias();
    } catch { setMessage('Error al agregar ítem'); }
  };

  const handleUpdateItem = async () => {
    if (!editItem) return;
    try {
      await api.put(`/bloque1/items/${editItem.id}`, { nombre: editItem.nombre, precio_unitario: Number(editItem.precio) });
      setMessage('✓ Ítem actualizado');
      setEditItem(null);
      loadItems(selectedCategoria);
    } catch { setMessage('Error al actualizar ítem'); }
  };

  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('¿Eliminar este ítem?')) return;
    try {
      await api.delete(`/bloque1/items/${id}`);
      setMessage('✓ Ítem eliminado');
      loadItems(selectedCategoria);
    } catch { setMessage('Error al eliminar ítem'); }
  };

  return (
    <div>
      <div className="module-header module-b1">
        <span className="module-icon">🔧</span>
        <div><h1>Presupuesto Mano de Obra</h1><p>Seleccioná el tipo de trabajo y completá las cantidades</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 16 }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Selector de categorías */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategoria(cat)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: selectedCategoria === cat ? colorCategoria(cat) : '#f1f5f9',
              color: selectedCategoria === cat ? '#fff' : '#475569',
              transition: 'all 0.15s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Estado vacío: sin categorías/ítems cargados */}
      {categorias.length === 0 && (
        <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <h3 style={{ color: '#374151', marginBottom: 8 }}>No hay ítems cargados aún</h3>
          <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>
            Para crear presupuestos de mano de obra primero necesitás cargar los ítems.<br />
            Podés importar desde un archivo Excel o agregarlos manualmente.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              📥 Importar Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-secondary" onClick={() => { setShowGestion(true); setSelectedCategoria('__nueva__'); setNewItem(n => ({ ...n, categoria: '' })); }}>
              + Agregar ítem manualmente
            </button>
          </div>
          {showGestion && (
            <div style={{ marginTop: 20, textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#475569' }}>NUEVO ÍTEM</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  placeholder="Nombre del ítem"
                  value={newItem.nombre}
                  onChange={e => setNewItem(n => ({ ...n, nombre: e.target.value }))}
                  style={{ flex: 3, minWidth: 200, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                />
                <input
                  type="number" placeholder="Precio unitario $"
                  value={newItem.precio}
                  onChange={e => setNewItem(n => ({ ...n, precio: e.target.value }))}
                  style={{ flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                />
                <input
                  placeholder="Categoría (ej: Instalación Gas)"
                  value={newItem.categoria === '__nueva__' ? '' : newItem.categoria}
                  onChange={e => setNewItem(n => ({ ...n, categoria: e.target.value }))}
                  style={{ flex: 2, minWidth: 180, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => {
                  if (!newItem.nombre || !newItem.precio || !newItem.categoria || newItem.categoria === '__nueva__') {
                    setMessage('Completá nombre, precio y categoría');
                    return;
                  }
                  handleAddItem();
                }}>+ Agregar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCategoria && selectedCategoria !== '__nueva__' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: colorCategoria(selectedCategoria) }}>{selectedCategoria}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                📥 Importar Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
              </label>
              <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>📤 Exportar MO</button>
              <button
                className="btn btn-sm"
                style={{ background: showGestion ? '#e2e8f0' : '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                onClick={() => setShowGestion(v => !v)}
              >
                ⚙ {showGestion ? 'Cerrar Gestión' : 'Gestionar Ítems'}
              </button>
            </div>
          </div>

          {/* Gestión de ítems */}
          {showGestion && (
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#475569' }}>AGREGAR ÍTEM</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <input
                  placeholder="Nombre del ítem"
                  value={newItem.nombre}
                  onChange={e => setNewItem(n => ({ ...n, nombre: e.target.value }))}
                  style={{ flex: 3, minWidth: 200, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                />
                <input
                  type="number" placeholder="Precio unitario $"
                  value={newItem.precio}
                  onChange={e => setNewItem(n => ({ ...n, precio: e.target.value }))}
                  style={{ flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                />
                <select
                  value={newItem.categoria || selectedCategoria}
                  onChange={e => setNewItem(n => ({ ...n, categoria: e.target.value }))}
                  style={{ flex: 2, minWidth: 160, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__nueva__">+ Nueva categoría...</option>
                </select>
                {newItem.categoria === '__nueva__' && (
                  <input
                    placeholder="Nombre de la nueva categoría"
                    onChange={e => setNewItem(n => ({ ...n, categoria: e.target.value }))}
                    style={{ flex: 2, minWidth: 180, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #d1d5db', fontSize: 14 }}
                  />
                )}
                <button className="btn btn-primary btn-sm" onClick={handleAddItem}>+ Agregar</button>
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#475569' }}>ÍTEMS EN {selectedCategoria.toUpperCase()}</h3>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    {editItem?.id === item.id ? (
                      <>
                        <input value={editItem.nombre} onChange={e => setEditItem(ei => ei ? { ...ei, nombre: e.target.value } : ei)}
                          style={{ flex: 3, padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', fontSize: 13 }} />
                        <input type="number" value={editItem.precio} onChange={e => setEditItem(ei => ei ? { ...ei, precio: e.target.value } : ei)}
                          style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1.5px solid #2563eb', fontSize: 13 }} />
                        <button className="btn btn-success btn-sm" onClick={handleUpdateItem}>✓</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditItem(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 3, fontSize: 13, color: '#374151' }}>{item.nombre}</span>
                        <span style={{ flex: 1, fontSize: 13, color: '#64748b' }}>${Number(item.precioUnitario || item.precio_unitario || 0).toLocaleString('es-AR')}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditItem({ id: item.id, nombre: item.nombre, precio: String(item.precioUnitario || item.precio_unitario || 0) })}>✏</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)}>🗑</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de presupuesto */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Ítem</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Precio Unit.</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Cantidad</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const p = Number(item.precioUnitario) || Number(item.precio_unitario) || 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 14px', color: '#374151' }}>{item.nombre}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', color: '#64748b' }}>${p.toLocaleString('es-AR')}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.cantidad || ''}
                          onChange={e => handleQty(item.id, e.target.value)}
                          style={{ width: 80, textAlign: 'center', padding: '5px 8px', borderRadius: 6, border: '1.5px solid #d1d5db', fontSize: 14 }}
                        />
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: item.cantidad > 0 ? 600 : 400, color: item.cantidad > 0 ? '#0f172a' : '#94a3b8' }}>
                        {item.cantidad > 0 ? `$${(item.cantidad * p).toLocaleString('es-AR')}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total y acciones */}
          <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8fafc', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
              Total Mano de Obra: <span style={{ color: colorCategoria(selectedCategoria) }}>${total.toLocaleString('es-AR')}</span>
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={handleExportExcel}>📤 Excel MO</button>
              <button
                className="btn"
                style={{ background: showCombinado ? '#7c3aed' : '#ede9fe', color: showCombinado ? '#fff' : '#6d28d9', border: 'none' }}
                onClick={() => setShowCombinado(v => !v)}
              >
                📋 {showCombinado ? 'Cerrar Combinado' : 'Presupuesto Completo'}
              </button>
              <button className="btn btn-primary" onClick={handleSavePresupuesto} disabled={loading || total === 0}>
                {loading ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>

          {/* Panel de Presupuesto Combinado */}
          {showCombinado && (
            <div style={{ marginTop: 16, border: '2px solid #ede9fe', borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', marginBottom: 12 }}>Accesorios Gasnet a incluir</h3>
              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#faf5ff' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#6d28d9', borderBottom: '1px solid #e2e8f0' }}>Accesorio</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#6d28d9', borderBottom: '1px solid #e2e8f0' }}>Precio</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', color: '#6d28d9', borderBottom: '1px solid #e2e8f0' }}>Cantidad</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#6d28d9', borderBottom: '1px solid #e2e8f0' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accesorios.map(acc => {
                      const p = Number(acc.precioUnitario) || Number(acc.precio_unitario) || 0;
                      return (
                        <tr key={acc.id} style={{ borderBottom: '1px solid #f5f3ff' }}>
                          <td style={{ padding: '7px 12px' }}>{acc.nombre}</td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: '#64748b' }}>${p.toLocaleString('es-AR')}</td>
                          <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <button onClick={() => handleQtyAcc(acc.id, -1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #e2e8f0', background: '#f1f5f9', cursor: 'pointer' }}>−</button>
                              <span style={{ minWidth: 28, textAlign: 'center' }}>{acc.cantidad}</span>
                              <button onClick={() => handleQtyAcc(acc.id, 1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #e2e8f0', background: '#f1f5f9', cursor: 'pointer' }}>+</button>
                            </div>
                          </td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: acc.cantidad > 0 ? 600 : 400, color: acc.cantidad > 0 ? '#6d28d9' : '#94a3b8' }}>
                            {acc.cantidad > 0 ? `$${(acc.cantidad * p).toLocaleString('es-AR')}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>
                  MO: <strong>${total.toLocaleString('es-AR')}</strong>
                  {' + '}
                  Accesorios: <strong>${totalAccesorios.toLocaleString('es-AR')}</strong>
                  {' = '}
                  <span style={{ color: '#7c3aed', fontSize: 17 }}>Total: <strong>${(total + totalAccesorios).toLocaleString('es-AR')}</strong></span>
                </div>
                <button
                  className="btn"
                  style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
                  onClick={handleExportCombinado}
                >
                  📥 Generar Excel Combinado
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Presupuestos Guardados</h2>
        {presupuestos.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>No hay presupuestos guardados aún.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Categoría</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Ítems</th>
                </tr>
              </thead>
              <tbody>
                {presupuestos.map(p => {
                  const itemsData = typeof p.items === 'string' ? JSON.parse(p.items) : p.items;
                  const detalles = itemsData?.detalle || itemsData || [];
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 14px' }}>{new Date(p.fechaCreacion || p.fecha_creacion || '').toLocaleDateString('es-AR')}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, background: '#f1f5f9', color: '#475569' }}>{itemsData?.categoria || '-'}</span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600 }}>${Number(p.total).toLocaleString('es-AR')}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'center', color: '#64748b' }}>{Array.isArray(detalles) ? detalles.length : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bloque1;
