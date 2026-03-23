import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Capacitacion } from '../types';
import './Bloque5.css';

interface UsuarioData {
  id: number;
  puntos_acumulados: number;
}

const Bloque5: React.FC = () => {
  const { user } = useAuth();
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState<number | null>(null);
  const [inscripcionData, setInscripcionData] = useState({ capacitacion_id: '' });
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadCapacitaciones();
    loadUsuario();
  }, []);

  const loadCapacitaciones = async (): Promise<void> => {
    try {
      const response = await api.get<Capacitacion[]>('/bloque5/capacitaciones');
      setCapacitaciones(response.data);
    } catch (error) {
      console.error('Error loading capacitaciones:', error);
    }
  };

  const loadUsuario = async (): Promise<void> => {
    try {
      const response = await api.get<UsuarioData>('/bloque4/usuario/me');
      setUsuario(response.data);
    } catch (error) {
      console.error('Error loading usuario:', error);
    }
  };

  const handleInscripcion = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!inscripcionData.capacitacion_id) {
      setMessage('Debe seleccionar una capacitación');
      return;
    }
    try {
      await api.post('/bloque5/inscripcion', inscripcionData);
      setMessage('Inscripción realizada correctamente');
      setInscripcionData({ capacitacion_id: '' });
      loadUsuario();
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Error al realizar inscripción');
    }
  };

  const selectedCap = capacitaciones.find(c => c.id === parseInt(inscripcionData.capacitacion_id));

  return (
    <div className="bloque5">
      <h1 className="page-title">Bloque 5: Capacitaciones</h1>
      <p className="info-text">
        Sistema de 5 capacitaciones anuales. Cada capacitación tiene un costo en puntos.
      </p>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Inscribirse a una Capacitación</h2>
        {usuario && (
          <p className="info-text">
            Puntos disponibles: <strong>{usuario.puntos_acumulados.toFixed(2)}</strong>
          </p>
        )}
        <form onSubmit={handleInscripcion}>
          <div className="form-group">
            <label>Capacitación</label>
            <select
              value={inscripcionData.capacitacion_id}
              onChange={(e) => setInscripcionData({ ...inscripcionData, capacitacion_id: e.target.value })}
              required
            >
              <option value="">Seleccione una capacitación</option>
              {capacitaciones.map(cap => (
                <option key={cap.id} value={cap.id}>
                  {cap.nombre} - {(cap.puntosRequeridos || cap.puntos_requeridos || 0)} puntos
                </option>
              ))}
            </select>
          </div>
          {selectedCap && usuario && (
            <div className="inscripcion-summary">
              <div className="summary-row">
                <span>Puntos disponibles:</span>
                <span className={usuario.puntos_acumulados >= (selectedCap.puntosRequeridos || selectedCap.puntos_requeridos || 0) ? 'text-success' : 'text-danger'}>
                  {usuario.puntos_acumulados.toFixed(2)}
                </span>
              </div>
              <div className="summary-row">
                <span>Costo de la capacitación:</span>
                <span>{(selectedCap.puntosRequeridos || selectedCap.puntos_requeridos || 0)} puntos</span>
              </div>
              <div className="summary-row">
                <span>Puntos restantes:</span>
                <span className={usuario.puntos_acumulados >= (selectedCap.puntosRequeridos || selectedCap.puntos_requeridos || 0) ? 'text-success' : 'text-danger'}>
                  {(usuario.puntos_acumulados - (selectedCap.puntosRequeridos || selectedCap.puntos_requeridos || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <button 
            type="submit" 
            className="btn btn-primary"
disabled={!!(selectedCap && usuario && usuario.puntos_acumulados < (selectedCap.puntosRequeridos || selectedCap.puntos_requeridos || 0))}          >
            Confirmar Inscripción
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Capacitaciones Disponibles</h2>
        <div className="capacitaciones-grid">
          {capacitaciones.map((cap) => (
            <div 
              key={cap.id} 
              className="capacitacion-card"
              onClick={() => setSelectedCapacitacion(cap.id === selectedCapacitacion ? null : cap.id)}
            >
              <div className="capacitacion-header">
                <h3>{cap.nombre}</h3>
                <div className="puntos-badge">{(cap.puntosRequeridos || cap.puntos_requeridos || 0)} puntos</div>
              </div>
              <p className="capacitacion-descripcion">{cap.descripcion}</p>
              {selectedCapacitacion === cap.id && (
                <div className="capacitacion-detalle">
                  <h4>Contenido:</h4>
                  <p>{cap.contenido || 'Sin contenido detallado'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bloque5;

