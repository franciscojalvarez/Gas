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

const AdminPanel: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<number | null>(null);
  const [puntosAgregar, setPuntosAgregar] = useState<number>(0);
  const [descripcionPuntos, setDescripcionPuntos] = useState('');
  const [activeTab, setActiveTab] = useState<'usuarios' | 'ranking'>('usuarios');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bloque4/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      setMessage('Error al cargar usuarios');
    } finally {
      setLoading(false);
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
    } catch (error) {
      setMessage('Error al agregar puntos');
    }
  };

  if (loading) return <div className="loading">Cargando panel de administración...</div>;

  return (
    <div className="admin-panel">
      <h1 className="page-title">Panel de Administración</h1>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          Usuarios ({usuarios.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          Ranking de Puntos
        </button>
      </div>

      {activeTab === 'usuarios' && (
        <>
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <h3>Agregar Puntos a Usuario</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
              <select
                value={selectedUsuario || ''}
                onChange={(e) => setSelectedUsuario(Number(e.target.value))}
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
                onChange={(e) => setPuntosAgregar(Number(e.target.value))}
                style={{ flex: '1', minWidth: '100px', padding: '8px' }}
                min="1"
              />
              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={descripcionPuntos}
                onChange={(e) => setDescripcionPuntos(e.target.value)}
                style={{ flex: '3', minWidth: '200px', padding: '8px' }}
              />
              <button onClick={handleAgregarPuntos} className="btn-primary">
                Agregar Puntos
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Puntos</th>
                  <th>Registro</th>
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

      {activeTab === 'ranking' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Puntos Acumulados</th>
              </tr>
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
    </div>
  );
};

export default AdminPanel;
