import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { TipoTrabajo, TrabajoItem, PedidoTrabajo } from '../types';
import './Bloque6.css';

interface TrabajoItemWithQuantity extends TrabajoItem {
  cantidad: number;
}

interface PedidoFormData {
  tipo_trabajo_id: string;
  direccion: string;
  contacto_cliente: string;
  telefono: string;
  email: string;
}

const Bloque6: React.FC = () => {
  const [tiposTrabajo, setTiposTrabajo] = useState<TipoTrabajo[]>([]);
  const [items, setItems] = useState<TrabajoItemWithQuantity[]>([]);
  const [pedidos, setPedidos] = useState<PedidoTrabajo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [pedidoData, setPedidoData] = useState<PedidoFormData>({
    tipo_trabajo_id: '',
    direccion: '',
    contacto_cliente: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    loadTiposTrabajo();
    loadItems();
    loadPedidos();
  }, []);

  const loadTiposTrabajo = async (): Promise<void> => {
    try {
      const response = await api.get<TipoTrabajo[]>('/bloque6/tipos-trabajo');
      setTiposTrabajo(response.data);
    } catch (error) {
      console.error('Error loading tipos trabajo:', error);
    }
  };

  const loadItems = async (): Promise<void> => {
    try {
      const response = await api.get<TrabajoItem[]>('/bloque6/items');
      setItems(response.data.map(item => ({ ...item, cantidad: 0 })));
    } catch (error) {
      console.error('Error loading items:', error);
      setMessage('Error al cargar items');
    }
  };

  const loadPedidos = async (): Promise<void> => {
    try {
      const response = await api.get<PedidoTrabajo[]>('/bloque6/pedidos');
      setPedidos(response.data);
    } catch (error) {
      console.error('Error loading pedidos:', error);
    }
  };

  const handleQuantityChange = (id: number, cantidad: string): void => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, cantidad: parseFloat(cantidad) || 0 } : item
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const calculateTotal = (itemsList: TrabajoItemWithQuantity[]): void => {
    const sum = itemsList.reduce((acc, item) => {
      const precio = item.precioUnitario || item.precio_unitario || 0;
      return acc + (item.cantidad * precio);
    }, 0);
    setTotal(sum);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: ProgressEvent<FileReader>) => {
      const bstr = evt.target?.result;
      if (typeof bstr === 'string') {
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        try {
          const itemsToUpdate = data.map(row => ({
            nombre: row.Nombre || row.nombre,
            precio_unitario: parseFloat(row['Precio Unitario'] || row.precio_unitario || 0)
          }));

          await api.post('/bloque6/items', { items: itemsToUpdate });
          setMessage('Items actualizados correctamente');
          loadItems();
        } catch (error) {
          setMessage('Error al importar Excel');
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSavePedido = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const itemsWithQuantity = items.filter(item => item.cantidad > 0);
    
    if (itemsWithQuantity.length === 0) {
      setMessage('Debe agregar al menos un item con cantidad');
      return;
    }

    try {
      setLoading(true);
      await api.post('/bloque6/pedido', {
        ...pedidoData,
        items: itemsWithQuantity.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || item.precio_unitario || 0
        }))
      });
      setMessage('Pedido guardado correctamente');
      loadPedidos();
      setPedidoData({
        tipo_trabajo_id: '',
        direccion: '',
        contacto_cliente: '',
        telefono: '',
        email: ''
      });
      setItems(items.map(item => ({ ...item, cantidad: 0 })));
      setTotal(0);
    } catch (error) {
      setMessage('Error al guardar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bloque6">
      <div className="module-header module-b6">
        <span className="module-icon">💼</span>
        <div><h1>Bolsa de Trabajo</h1><p>Publicá y gestioná pedidos de trabajo</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Nuevo Pedido de Trabajo</h2>
        <form onSubmit={handleSavePedido}>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Trabajo</label>
              <select
                value={pedidoData.tipo_trabajo_id}
                onChange={(e) => setPedidoData({ ...pedidoData, tipo_trabajo_id: e.target.value })}
                required
              >
                <option value="">Seleccione tipo de trabajo</option>
                {tiposTrabajo.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Dirección del Trabajo</label>
            <input
              type="text"
              value={pedidoData.direccion}
              onChange={(e) => setPedidoData({ ...pedidoData, direccion: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contacto del Cliente</label>
              <input
                type="text"
                value={pedidoData.contacto_cliente}
                onChange={(e) => setPedidoData({ ...pedidoData, contacto_cliente: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={pedidoData.telefono}
                onChange={(e) => setPedidoData({ ...pedidoData, telefono: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={pedidoData.email}
                onChange={(e) => setPedidoData({ ...pedidoData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="section-header">
            <h3 className="section-title">Items de Trabajo</h3>
            <label className="btn btn-primary">
              Importar Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Precio Unitario</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>${((item.precioUnitario || item.precio_unitario || 0)).toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        className="quantity-input"
                        value={item.cantidad || ''}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>${((item.cantidad || 0) * (item.precioUnitario || item.precio_unitario || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="total-display">
            Presupuesto Total: ${total.toFixed(2)}
          </div>

          <button 
            type="submit"
            className="btn btn-primary btn-large" 
            disabled={loading || total === 0}
          >
            {loading ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="section-title">Pedidos de Trabajo</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => {
                const itemsData = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : pedido.items;
                return (
                  <tr key={pedido.id}>
                    <td>{new Date(pedido.fecha_creacion).toLocaleDateString()}</td>
                    <td>{pedido.tipo_trabajo_nombre || '-'}</td>
                    <td>{pedido.direccion}</td>
                    <td>{pedido.contacto_cliente}</td>
                    <td>{pedido.telefono || '-'}</td>
                    <td>${parseFloat(pedido.total.toString()).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${pedido.estado}`}>
                        {pedido.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bloque6;

