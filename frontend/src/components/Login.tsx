import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }

    setLoading(false);
  };

  return (
    <div className="full-page">
      <div className="login-wrapper">
        <div className="login-logo">
          <span className="logo-icon">⚡</span>
          <h1>App Gasnet</h1>
          <p>Sistema para Instaladores Sanitaristas y Gas</p>
        </div>
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario o Email</label>
            <input type="text" value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Ingresá tu usuario o email" required autoFocus />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%', padding:'11px'}} disabled={loading}>
            {loading ? 'Iniciando sesión...' : '→ Ingresar'}
          </button>
        </form>
        <div className="login-divider">
          ¿No tenés cuenta? <Link to="/register" style={{color:'#2563eb', fontWeight:500}}>Registrate</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
