import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { TransaccionPunto } from '../types';
import './Bloque4.css';

interface UsuarioData {
  id: number;
  nombre: string;
  email: string;
  puntos_acumulados: number;
  fecha_registro: string;
}

const Bloque4: React.FC = () => {
  const { user } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionPunto[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadUsuario();
    loadTransacciones();
  }, []);

  const loadUsuario = async (): Promise<void> => {
    try {
      const response = await api.get<UsuarioData>('/bloque4/usuario/me');
      setUsuario(response.data);
    } catch (error) {
      console.error('Error loading usuario:', error);
    }
  };

  const loadTransacciones = async (): Promise<void> => {
    try {
      const response = await api.get<TransaccionPunto[]>('/bloque4/transacciones/me');
      setTransacciones(response.data);
    } catch (error) {
      console.error('Error loading transacciones:', error);
    }
  };

  if (!usuario) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="bloque4">
      <div className="module-header module-b4">
        <span className="module-icon">⭐</span>
        <div><h1>Sistema de Puntos</h1><p>$1.000 = 1 punto · Usá tus puntos en capacitaciones</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">
          Mi Perfil: {user?.nombre}
        </h2>
        <div className="user-summary">
          <div className="summary-item">
            <span className="label">Puntos Totales:</span>
            <span className="value points-highlight">{usuario.puntos_acumulados.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Equivalente en pesos:</span>
            <span className="value">${(usuario.puntos_acumulados * 1000).toFixed(2)}</span>
          </div>
        </div>

        <h3 className="section-title">Historial de Transacciones</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Puntos</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {transacciones.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No hay transacciones registradas
                  </td>
                </tr>
              ) : (
                transacciones.map((trans) => (
                  <tr key={trans.id}>
                    <td>{new Date(trans.fecha).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${trans.tipo}`}>
                        {trans.tipo}
                      </span>
                    </td>
                    <td>${trans.monto ? parseFloat(trans.monto.toString()).toFixed(2) : '-'}</td>
                    <td className={trans.puntos > 0 ? 'points-positive' : 'points-negative'}>
                      {trans.puntos > 0 ? '+' : ''}{parseFloat(trans.puntos.toString()).toFixed(2)}
                    </td>
                    <td>{trans.descripcion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bloque4;

