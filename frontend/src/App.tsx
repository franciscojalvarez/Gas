import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import Bloque1 from './components/Bloque1';
import Bloque2 from './components/Bloque2';
import Bloque3 from './components/Bloque3';
import Bloque4 from './components/Bloque4';
import Bloque5 from './components/Bloque5';
import Bloque6 from './components/Bloque6';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="App">
      {user && !isAuthPage && (
        <nav className="navbar">
          <div className="nav-inner">
            <div className="nav-brand">
              <span className="nav-logo">⚡</span>
              <span className="nav-title">Gasnet</span>
            </div>
            <ul className="nav-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/bloque1">Mano de Obra</Link></li>
              <li><Link to="/bloque2">Accesorios</Link></li>
              <li><Link to="/bloque3">Materiales</Link></li>
              <li><Link to="/bloque4">Puntos</Link></li>
              <li><Link to="/bloque5">Capacitaciones</Link></li>
              <li><Link to="/bloque6">Trabajo</Link></li>
              {user.roleId === 1 && <li><Link to="/admin">Admin</Link></li>}
            </ul>
            <div className="nav-user">
              <span className="nav-username">👤 {user.nombre}</span>
              <span className="nav-points">⭐ {user.puntosAcumulados || 0} pts</span>
              <button className="btn-logout" onClick={logout}>Salir</button>
            </div>
          </div>
        </nav>
      )}
      <div className={user && !isAuthPage ? 'main-content' : 'full-page'}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/bloque1" element={<ProtectedRoute><Bloque1 /></ProtectedRoute>} />
          <Route path="/bloque2" element={<ProtectedRoute><Bloque2 /></ProtectedRoute>} />
          <Route path="/bloque3" element={<ProtectedRoute><Bloque3 /></ProtectedRoute>} />
          <Route path="/bloque4" element={<ProtectedRoute><Bloque4 /></ProtectedRoute>} />
          <Route path="/bloque5" element={<ProtectedRoute><Bloque5 /></ProtectedRoute>} />
          <Route path="/bloque6" element={<ProtectedRoute><Bloque6 /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
