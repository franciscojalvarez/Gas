import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
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

interface ProtectedRouteProps {
  children: React.ReactElement;
}

// Componente de ruta protegida
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente principal con navegación
const AppContent: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <h1 className="logo">App Gasnet</h1>
          <ul className="nav-links">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/bloque1">Mano de Obra</Link></li>
            <li><Link to="/bloque2">Accesorios Gasnet</Link></li>
            <li><Link to="/bloque3">Materiales</Link></li>
            <li><Link to="/bloque4">Puntos</Link></li>
            <li><Link to="/bloque5">Capacitaciones</Link></li>
            <li><Link to="/bloque6">Bolsa de Trabajo</Link></li>
            {user ? (
              <>
                <li className="user-info">
                  <span>{user.nombre} ({user.roleNombre || 'Usuario'})</span>
                </li>
                <li>
                  <button className="btn-link" onClick={logout}>
                    Cerrar Sesión
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Iniciar Sesión</Link></li>
                <li><Link to="/register">Registrarse</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/" replace /> : <Register />} 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque1" 
            element={
              <ProtectedRoute>
                <Bloque1 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque2" 
            element={
              <ProtectedRoute>
                <Bloque2 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque3" 
            element={
              <ProtectedRoute>
                <Bloque3 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque4" 
            element={
              <ProtectedRoute>
                <Bloque4 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque5" 
            element={
              <ProtectedRoute>
                <Bloque5 />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bloque6" 
            element={
              <ProtectedRoute>
                <Bloque6 />
              </ProtectedRoute>
            } 
          />
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

