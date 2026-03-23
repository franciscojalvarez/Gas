import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RegisterData } from '../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData & { confirmPassword: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellido: '',
    telefono: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Error al registrar usuario');
    }

    setLoading(false);
  };

  return (
    <div className="full-page">
      <div className="login-wrapper" style={{ width: '520px' }}>
        <div className="login-logo">
          <span className="logo-icon">⚡</span>
          <h1>App Gasnet</h1>
          <p>Crear cuenta nueva</p>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario *</label>
            <input type="text" value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Nombre de usuario" required autoFocus />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com" required />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nombre *</label>
              <input type="text" value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Apellido</label>
              <input type="text" value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                placeholder="Apellido" />
            </div>
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="Teléfono (opcional)" />
          </div>
          <div className="form-group">
            <label>Contraseña *</label>
            <input type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirmar Contraseña *</label>
            <input type="password" value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repetí la contraseña" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'11px'}} disabled={loading}>
            {loading ? 'Registrando...' : '→ Crear cuenta'}
          </button>
        </form>
        <div className="login-divider">
          ¿Ya tenés cuenta? <Link to="/login" style={{color:'#2563eb', fontWeight:500}}>Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
