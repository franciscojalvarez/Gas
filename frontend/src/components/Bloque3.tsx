import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { Proveedor, Material, PresupuestoMaterial } from '../types';
import './Bloque3.css';

// Fix default marker icons for CRA
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MaterialWithQuantity extends Material {
  cantidad: number;
  precio_unitario: number;
}

interface Ferreteria {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  horarios?: string;
  lat?: number;
  lng?: number;
  distancia?: number;
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Component to fly map to a position
function FlyTo({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

const Bloque3: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'materiales' | 'ferreterias'>('materiales');

  // ── Materiales state ──────────────────────────────────────────────────────
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [materiales, setMateriales] = useState<MaterialWithQuantity[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoMaterial[]>([]);
  const [loadingMat, setLoadingMat] = useState(false);
  const [total, setTotal] = useState(0);
  const [messageMat, setMessageMat] = useState('');

  // ── Ferreterías state ─────────────────────────────────────────────────────
  const [ferreterias, setFerreterias] = useState<Ferreteria[]>([]);
  const [loadingFer, setLoadingFer] = useState(false);
  const [messageFer, setMessageFer] = useState('');
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.603722, -58.381592]); // Buenos Aires
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedFer, setSelectedFer] = useState<number | null>(null);
  const [busquedaFer, setBusquedaFer] = useState('');

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadProveedores();
    loadMateriales();
    loadPresupuestos();
    loadFerreterias();
  }, []);

  useEffect(() => {
    if (selectedProveedor) loadPrecios();
  }, [selectedProveedor]);

  const loadProveedores = async () => {
    try {
      const res = await api.get<Proveedor[]>('/bloque3/proveedores');
      setProveedores(res.data);
      if (res.data.length > 0) setSelectedProveedor(res.data[0].id);
    } catch {}
  };

  const loadMateriales = async () => {
    try {
      const res = await api.get<Material[]>('/bloque3/materiales');
      setMateriales(res.data.map(item => ({ ...item, cantidad: 0, precio_unitario: 0 })));
    } catch {}
  };

  const loadPrecios = async () => {
    try {
      const res = await api.get<Material[]>('/bloque3/precios/' + selectedProveedor);
      setMateriales(res.data.map(item => ({
        ...item,
        precio_unitario: item.precio_unitario || (item as any).precioUnitario || 0,
        cantidad: materiales.find(m => m.id === item.id)?.cantidad || 0
      })));
    } catch {}
  };

  const loadPresupuestos = async () => {
    try {
      const res = await api.get<PresupuestoMaterial[]>('/bloque3/presupuestos');
      setPresupuestos(res.data);
    } catch {}
  };

  const loadFerreterias = async () => {
    setLoadingFer(true);
    try {
      const res = await api.get<Ferreteria[]>('/bloque3/ferreterias');
      setFerreterias(res.data);
    } catch {
      setMessageFer('Error al cargar ferreterías');
    } finally {
      setLoadingFer(false);
    }
  };

  // ── Materiales handlers ───────────────────────────────────────────────────
  const handleQuantityChange = (id: number, value: string) => {
    const updated = materiales.map(item =>
      item.id === id ? { ...item, cantidad: parseFloat(value) || 0 } : item
    );
    setMateriales(updated);
    setTotal(updated.reduce((acc, item) => {
      const precio = item.precioUnitario || item.precio_unitario || 0;
      return acc + item.cantidad * precio;
    }, 0));
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProveedor) { setMessageMat('Seleccione un proveedor primero'); return; }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (typeof bstr === 'string') {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        try {
          await api.post(`/bloque3/precios/${selectedProveedor}`, {
            items: data.map(row => ({
              nombre: row.Nombre || row.nombre,
              codigo: row.Codigo || row.codigo || '',
              precio_unitario: parseFloat(row['Precio Unitario'] || row.precio_unitario || 0)
            }))
          });
          setMessageMat('Precios actualizados correctamente');
          loadPrecios();
        } catch { setMessageMat('Error al importar Excel'); }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSavePresupuesto = async () => {
    const items = materiales.filter(i => i.cantidad > 0);
    if (!items.length) { setMessageMat('Agregue al menos un material con cantidad'); return; }
    if (!selectedProveedor) { setMessageMat('Seleccione un proveedor'); return; }
    try {
      setLoadingMat(true);
      await api.post('/bloque3/presupuesto', {
        proveedor_id: selectedProveedor,
        items: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || item.precio_unitario || 0
        }))
      });
      setMessageMat('Presupuesto guardado correctamente');
      loadPresupuestos();
      setMateriales(materiales.map(i => ({ ...i, cantidad: 0 })));
      setTotal(0);
    } catch { setMessageMat('Error al guardar presupuesto'); }
    finally { setLoadingMat(false); }
  };

  // ── Ferreterías handlers ──────────────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setMessageFer('Tu navegador no soporta geolocalización'); return; }
    setMessageFer('Buscando tu ubicación...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(13);
        setMessageFer('Ferreterías ordenadas por distancia');
        setFerreterias(prev =>
          [...prev].map(f => ({
            ...f,
            distancia: f.lat && f.lng ? haversine(latitude, longitude, Number(f.lat), Number(f.lng)) : undefined
          })).sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999))
        );
      },
      () => setMessageFer('No se pudo obtener tu ubicación')
    );
  }, []);

  const ferFiltered = ferreterias.filter(f =>
    !busquedaFer || f.nombre.toLowerCase().includes(busquedaFer.toLowerCase()) || f.direccion.toLowerCase().includes(busquedaFer.toLowerCase())
  );

  const userIcon = L.divIcon({
    className: '',
    html: '<div style="width:16px;height:16px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="bloque3">
      <div className="module-header module-b3">
        <span className="module-icon">📦</span>
        <div>
          <h1>Módulo 3 — Materiales y Ferreterías</h1>
          <p>Presupuesto por materiales · Mapa de ferreterías cercanas</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab-btn${activeTab === 'materiales' ? ' active' : ''}`}
          onClick={() => setActiveTab('materiales')}
        >
          📋 Presupuesto Materiales
        </button>
        <button
          className={`tab-btn${activeTab === 'ferreterias' ? ' active' : ''}`}
          onClick={() => setActiveTab('ferreterias')}
        >
          🗺️ Ferreterías Cercanas
        </button>
      </div>

      {/* ── MATERIALES TAB ── */}
      {activeTab === 'materiales' && (
        <>
          {messageMat && (
            <div className={`alert ${messageMat.includes('Error') ? 'alert-error' : 'alert-success'}`}>
              {messageMat}
              <button onClick={() => setMessageMat('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div className="card">
            <div className="section-header">
              <h2 className="section-title">Seleccionar Proveedor</h2>
              <div className="proveedor-selector">
                {proveedores.map(prov => (
                  <button
                    key={prov.id}
                    className={`btn ${selectedProveedor === prov.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setSelectedProveedor(prov.id);
                      setMateriales(materiales.map(i => ({ ...i, cantidad: 0 })));
                      setTotal(0);
                    }}
                  >
                    {prov.nombre}
                  </button>
                ))}
              </div>
            </div>

            {selectedProveedor && (
              <>
                <div className="section-header" style={{ marginTop: '16px' }}>
                  <h2 className="section-title">
                    Materiales — {proveedores.find(p => p.id === selectedProveedor)?.nombre}
                  </h2>
                  <label className="btn btn-primary">
                    Importar Excel
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Material</th>
                        <th>Precio Unitario</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiales.map(item => (
                        <tr key={item.id}>
                          <td>{item.codigo || '-'}</td>
                          <td>{item.nombre}</td>
                          <td>${(item.precioUnitario || item.precio_unitario || 0).toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              className="quantity-input"
                              value={item.cantidad || ''}
                              onChange={e => handleQuantityChange(item.id, e.target.value)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td>${(item.cantidad * (item.precioUnitario || item.precio_unitario || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="total-display">Total: ${total.toFixed(2)}</div>

                <button
                  className="btn btn-primary btn-large"
                  onClick={handleSavePresupuesto}
                  disabled={loadingMat || total === 0}
                >
                  {loadingMat ? 'Guardando...' : 'Guardar Presupuesto'}
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h2 className="section-title">Presupuestos Guardados</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th><th>Proveedor</th><th>Total</th><th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestos.map(pres => {
                    const items = typeof pres.items === 'string' ? JSON.parse(pres.items) : pres.items;
                    return (
                      <tr key={pres.id}>
                        <td>{new Date(pres.fecha_creacion).toLocaleDateString('es-AR')}</td>
                        <td>{pres.proveedor_nombre}</td>
                        <td>${parseFloat(pres.total.toString()).toFixed(2)}</td>
                        <td>{Array.isArray(items) ? items.length : 0} items</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── FERRETERÍAS TAB ── */}
      {activeTab === 'ferreterias' && (
        <>
          {messageFer && (
            <div className={`alert ${messageFer.includes('Error') || messageFer.includes('no se pudo') ? 'alert-error' : 'alert-success'}`} style={{ textTransform: 'capitalize' }}>
              {messageFer}
              <button onClick={() => setMessageFer('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleGeolocate}>
              📍 ¿Dónde estoy? — Mostrar más cercanas
            </button>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar ferretería o dirección..."
              value={busquedaFer}
              onChange={e => setBusquedaFer(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
            />
          </div>

          {/* Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo center={mapCenter} zoom={mapZoom} />

              {/* User marker */}
              {userPos && (
                <Marker position={userPos} icon={userIcon}>
                  <Popup><strong>Tu ubicación</strong></Popup>
                </Marker>
              )}

              {/* Ferretería markers */}
              {ferFiltered
                .filter(f => f.lat && f.lng)
                .map(f => (
                  <Marker
                    key={f.id}
                    position={[Number(f.lat), Number(f.lng)]}
                    eventHandlers={{ click: () => setSelectedFer(f.id) }}
                  >
                    <Popup>
                      <strong>{f.nombre}</strong><br />
                      {f.direccion}<br />
                      {f.telefono && <>{f.telefono}<br /></>}
                      {f.horarios && <em>{f.horarios}</em>}
                      {f.distancia !== undefined && (
                        <><br /><span style={{ color: '#2563eb' }}>📍 {f.distancia.toFixed(1)} km</span></>
                      )}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>

          {/* Ferretería cards */}
          {loadingFer ? (
            <div className="loading">Cargando ferreterías...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {ferFiltered.map(f => (
                <div
                  key={f.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: selectedFer === f.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    padding: '14px',
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => {
                    setSelectedFer(f.id);
                    if (f.lat && f.lng) {
                      setMapCenter([Number(f.lat), Number(f.lng)]);
                      setMapZoom(16);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>🔩 {f.nombre}</strong>
                    {f.distancia !== undefined && (
                      <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: '12px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '8px' }}>
                        {f.distancia.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                    <div>📍 {f.direccion}</div>
                    {f.telefono && <div>📞 {f.telefono}</div>}
                    {f.horarios && <div>🕐 {f.horarios}</div>}
                  </div>
                </div>
              ))}
              {ferFiltered.length === 0 && (
                <p style={{ color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: '24px' }}>
                  No se encontraron ferreterías
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bloque3;
