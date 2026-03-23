import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

interface Bloque {
  id: number;
  title: string;
  description: string;
  path: string;
  color: string;
}

const Home: React.FC = () => {
  const bloques: Bloque[] = [
    {
      id: 1,
      title: 'Presupuesto Mano de Obra',
      description: 'Sistema de presupuestos con 20 ítems de precios unitarios actualizables',
      path: '/bloque1',
      color: '#3498db'
    },
    {
      id: 2,
      title: 'Compra de Accesorios Gasnet',
      description: 'Catálogo de 20 artículos con opción de compra por transferencia bancaria',
      path: '/bloque2',
      color: '#2ecc71'
    },
    {
      id: 3,
      title: 'Presupuesto por Materiales',
      description: 'Comparación de precios entre 4 proveedores (80 artículos cada uno)',
      path: '/bloque3',
      color: '#e74c3c'
    },
    {
      id: 4,
      title: 'Sistema de Puntos',
      description: 'Acumulación de puntos por compras ($1000 = 1 punto)',
      path: '/bloque4',
      color: '#f39c12'
    },
    {
      id: 5,
      title: 'Capacitaciones',
      description: '5 capacitaciones anuales con costo en puntos',
      path: '/bloque5',
      color: '#9b59b6'
    },
    {
      id: 6,
      title: 'Bolsa de Trabajo',
      description: 'Sistema de pedidos de trabajo con presupuestos',
      path: '/bloque6',
      color: '#1abc9c'
    }
  ];

  return (
    <div className="home">
      <h1 className="page-title">Bienvenido a App Gasnet</h1>
      <p className="home-subtitle">
        Sistema integral para Profesionales Instaladores Sanitaristas y Gas
      </p>

      <div className="bloques-grid">
        {bloques.map((bloque) => (
          <Link key={bloque.id} to={bloque.path} className="bloque-card">
            <div className="bloque-number" style={{ backgroundColor: bloque.color }}>
              {bloque.id}
            </div>
            <h2>{bloque.title}</h2>
            <p>{bloque.description}</p>
            <div className="bloque-link">Ir al módulo →</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;

