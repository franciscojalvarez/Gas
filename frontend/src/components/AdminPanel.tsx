import React, { useState, useEffect } from 'react';
import api from '../api/axios';

interface UsuarioAdmin {
  id: number;
  username: string;
  nombre: string;
  apellido?: string;
  email: string;
  puntos_acumulados: number;
  fecha_registro: string;
  role_id: number;
  role_nombre?: string;
}

interface Ferreteria {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  horarios?: string;
  lat?: number;
  lng?: number;
  activa: boolean;
}

const emptyFer: Omit<Ferreteria, 'id' | 'activa'> = {
  nombre: '', direccion: '', telefono: '', horarios: '', lat: undefined, lng: undefined
};

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'ranking' | 'ferreterias'>('usuarios');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [puntosAgregar, setPuntosAgregar] = useState<number>(0);
  const [descripcionPuntos, setDescripcionPuntos] = useState('');

  // ── Ferreterías ───────────────────────────────────────────────────────────
  const [ferreterias, setFerreterias] = useState<Ferreteria[]>([]);
  const [loadingFer, setLoadingFer] = useState(false);
  const [editingFer, setEditingFer] = useState<Ferreteria | null>(null);
  const [newFer, setNewFer] = useState<typeof emptyFer>({ ...emptyFer });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (activeTab === 'ferreterias') loadFerreterias();
  }, [activeTab]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bloque4/usuarios');
      setUsuarios(res.data);
    } catch {
      setMessage('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadFerreterias = async () => {
    setLoadingFer(true);
    try {
      const res = await api.get<Ferreteria[]>('/bloque3/ferreterias/todas');
      setFerreterias(res.data);
    } catch {
      setMessage('Error al cargar ferreterías');
    } finally {
      setLoadingFer(false);
    }
  };

  const handleAgregarPuntos = async () => {
    if (!selectedUsuario || puntosAgregar <= 0) {
      setMessage('Seleccione un usuario e ingrese puntos válidos');
      return;
    }
    try {
      await api.post('/bloque4/agregar-puntos', {
        usuario_id: selectedUsuario,
        puntos: puntosAgregar,
        descripcion: descripcionPuntos || 'Puntos agregados manualmente'
      });
      setMessage(`✓ ${puntosAgregar} puntos agregados correctamente`);
      setPuntosAgregar(0);
      setDescripcionPuntos('');
      setSelectedUsuario(null);
      loadUsuarios();
    } catch {
      setMessage('Error al agregar puntos');
    }
  };

  // ── Ferreterías CRUD ──────────────────────────────────────────────────────
  const handleAddFer = async () => {
    if (!newFer.nombre || !newFer.direccion) {
      setMessage('Nombre y dirección son obligatorios');
      return;
    }
    try {
      await api.post('/bloque3/ferreterias', newFer);
      setMessage('Ferretería creada correctamente');
      setNewFer({ ...emptyFer });
      setShowAddForm(false);
      loadFerreterias();
    } catch {
      setMessage('Error al crear ferretería');
    }
  };

  const handleUpdateFer = async () => {
    if (!editingFer) return;
    try {
      await api.put(`/bloque3/ferreterias/${editingFer.id}`, editingFer);
      setMessage('Ferretería actualizada correctamente');
      setEditingFer(null);
      loadFerreterias();
    } catch {
      setMessage('Error al actualizar ferretería');
    }
  };

  const handleToggleActiva = async (fer: Ferreteria) => {
    try {
      await api.put(`/bloque3/ferreterias/${fer.id}`, { activa: !fer.activa });
      setMessage(`Ferretería ${fer.activa ? 'desactivada' : 'activada'} correctamente`);
      loadFerreterias();
    } catch {
      setMessage('Error al cambiar estado');
    }
  };

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', width: '100%' };

  if (loading) return <div className="loading">Cargando panel de administración...</div>;

  return (
    <div className="admin-panel">
      <h1 className="page-title">Panel de Administración</h1>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button className={`tab-btn${activeTab === 'usuarios' ? ' active' : ''}`} onClick={() => setActiveTab('usuarios')}>
          👥 Usuarios ({usuarios.length})
        </button>
        <button className={`tab-btn${activeTab === 'ranking' ? ' active' : ''}`} onClick={() => setActiveTab('ranking')}>
          🏆 Ranking de Puntos
        </button>
        <button className={`tab-btn${activeTab === 'ferreterias' ? ' active' : ''}`} onClick={() => setActiveTab('ferreterias')}>
          🔩 Ferreterías
        </button>
      </div>

      {/* ── Usuarios tab ── */}
      {activeTab === 'usuarios' && (
        <>
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <h3>Agregar Puntos a Usuario</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              <select
                value={selectedUsuario || ''}
                onChange={e => setSelectedUsuario(Number(e.target.value))}
                style={{ flex: '2', minWidth: '200px', padding: '8px' }}
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} {u.apellido || ''} — {u.puntos_acumulados} pts
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Puntos"
                value={puntosAgregar || ''}
                onChange={e => setPuntosAgregar(Number(e.target.value))}
                style={{ flex: '1', minWidth: '100px', padding: '8px' }}
                min="1"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={descripcionPuntos}
                onChange={e => setDescripcionPuntos(e.target.value)}
                style={{ flex: '3', minWidth: '200px', padding: '8px' }}
              />
              <button onClick={handleAgregarPuntos} className="btn btn-primary">
                Agregar Puntos
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Puntos</th><th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.nombre} {u.apellido || ''}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${u.role_id === 1 ? 'admin' : 'user'}`}>{u.role_nombre || `Rol ${u.role_id}`}</span></td>
                    <td><strong>{u.puntos_acumulados}</strong></td>
                    <td>{u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-AR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Ranking tab ── */}
      {activeTab === 'ranking' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Nombre</th><th>Puntos Acumulados</th></tr>
            </thead>
            <tbody>
              {[...usuarios]
                .sort((a, b) => b.puntos_acumulados - a.puntos_acumulados)
                .map((u, idx) => (
                  <tr key={u.id} style={idx < 3 ? { background: idx === 0 ? '#fff9e6' : idx === 1 ? '#f5f5f5' : '#fdf3e7' } : {}}>
                    <td><strong>{idx + 1}</strong></td>
                    <td>{u.nombre} {u.apellido || ''}</td>
                    <td><strong>{u.puntos_acumulados} pts</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ferreterías tab ── */}
      {activeTab === 'ferreterias' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#64748b', margin: 0 }}>{ferreterias.length} ferreterías registradas</p>
            <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingFer(null); }}>
              {showAddForm ? 'Cancelar' : '+ Nueva Ferretería'}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Nueva Ferretería</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                  <input style={inputStyle} value={newFer.nombre} onChange={e => setNewFer({ ...newFer, nombre: e.target.value })} placeholder="Ej: Ferretería El Tornillo" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Dirección *</label>
                  <input style={inputStyle} value={newFer.direccion} onChange={e => setNewFer({ ...newFer, direccion: e.target.value })} placeholder="Ej: Av. Corrientes 1234" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input style={inputStyle} value={newFer.telefono || ''} onChange={e => setNewFer({ ...newFer, telefono: e.target.value })} placeholder="Ej: 011-4321-1234" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horarios</label>
                  <input style={inputStyle} value={newFer.horarios || ''} onChange={e => setNewFer({ ...newFer, horarios: e.target.value })} placeholder="Ej: Lun–Vie 8–18hs" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Latitud</label>
                  <input style={inputStyle} type="number" step="any" value={newFer.lat ?? ''} onChange={e => setNewFer({ ...newFer, lat: e.target.value ? Number(e.target.value) : undefined })} placeholder="-34.603722" />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Longitud</label>
                  <input style={inputStyle} type="number" step="any" value={newFer.lng ?? ''} onChange={e => setNewFer({ ...newFer, lng: e.target.value ? Number(e.target.value) : undefined })} placeholder="-58.381592" />
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleAddFer}>Guardar</button>
                <button className="btn btn-secondary" onClick={() => { setShowAddForm(false); setNewFer({ ...emptyFer }); }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Edit form */}
          {editingFer && (
            <div className="card" style={{ marginBottom: '20px', padding: '16px', borderLeft: '4px solid #2563eb' }}>
              <h3 style={{ marginBottom: '12px' }}>Editar — {editingFer.nombre}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Nombre</label>
                  <input style={inputStyle} value={editingFer.nombre} onChange={e => setEditingFer({ ...editingFer, nombre: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Dirección</label>
                  <input style={inputStyle} value={editingFer.direccion} onChange={e => setEditingFer({ ...editingFer, direccion: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input style={inputStyle} value={editingFer.telefono || ''} onChange={e => setEditingFer({ ...editingFer, telefono: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Horarios</label>
                  <input style={inputStyle} value={editingFer.horarios || ''} onChange={e => setEditingFer({ ...editingFer, horarios: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Latitud</label>
                  <input style={inputStyle} type="number" step="any" value={editingFer.lat ?? ''} onChange={e => setEditingFer({ ...editingFer, lat: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Longitud</label>
                  <input style={inputStyle} type="number" step="any" value={editingFer.lng ?? ''} onChange={e => setEditingFer({ ...editingFer, lng: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary" onClick={handleUpdateFer}>Actualizar</button>
                <button className="btn btn-secondary" onClick={() => setEditingFer(null)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Ferreterías table */}
          {loadingFer ? (
            <div className="loading">Cargando ferreterías...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Horarios</th><th>Coords</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ferreterias.map(f => (
                    <tr key={f.id} style={!f.activa ? { opacity: 0.5 } : {}}>
                      <td>{f.id}</td>
                      <td><strong>{f.nombre}</strong></td>
                      <td>{f.direccion}</td>
                      <td>{f.telefono || '-'}</td>
                      <td>{f.horarios || '-'}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {f.lat && f.lng ? `${Number(f.lat).toFixed(4)}, ${Number(f.lng).toFixed(4)}` : '-'}
                      </td>
                      <td>
                        <span className={`badge badge-${f.activa ? 'success' : 'danger'}`}>
                          {f.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => { setEditingFer({ ...f }); setShowAddForm(false); }}
                          >
                            Editar
                          </button>
                          <button
                            className={`btn btn-sm ${f.activa ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleActiva(f)}
                          >
                            {f.activa ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;
