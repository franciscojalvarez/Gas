import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { AccesorioGasnet, CompraGasnet } from '../types';
import './Bloque2.css';

interface AccesorioWithQuantity extends AccesorioGasnet {
  cantidad: number;
}

const Bloque2: React.FC = () => {
  const [accesorios, setAccesorios] = useState<AccesorioWithQuantity[]>([]);
  const [compras, setCompras] = useState<CompraGasnet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState({ referencia: '', metodo: 'transferencia' });

  useEffect(() => {
    loadAccesorios();
    loadCompras();
  }, []);

  const loadAccesorios = async (): Promise<void> => {
    try {
      const response = await api.get<AccesorioGasnet[]>('/bloque2/accesorios');
      setAccesorios(response.data.map(item => ({ ...item, cantidad: 0 })));
    } catch (error) {
      console.error('Error loading accesorios:', error);
      setMessage('Error al cargar accesorios');
    }
  };

  const loadCompras = async (): Promise<void> => {
    try {
      const response = await api.get<CompraGasnet[]>('/bloque2/compras');
      setCompras(response.data);
    } catch (error) {
      console.error('Error loading compras:', error);
    }
  };

  const handleQuantityChange = (id: number, cantidad: string): void => {
    const updatedAccesorios = accesorios.map(item => 
      item.id === id ? { ...item, cantidad: parseFloat(cantidad) || 0 } : item
    );
    setAccesorios(updatedAccesorios);
    calculateTotal(updatedAccesorios);
  };

  const calculateTotal = (itemsList: AccesorioWithQuantity[]): void => {
    const sum = itemsList.reduce((acc, item) => {
      const precio = item.precio_unitario || item.precio_unitario || 0;
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
            codigo: row.Codigo || row.codigo || '',
            precio_unitario: parseFloat(row['Precio Unitario'] || row.precio_unitario || 0)
          }));

          await api.post('/bloque2/accesorios', { items: itemsToUpdate });
          setMessage('Accesorios actualizados correctamente');
          loadAccesorios();
        } catch (error) {
          setMessage('Error al importar Excel');
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleComprar = (): void => {
    if (total === 0) {
      setMessage('Debe agregar al menos un accesorio con cantidad');
      return;
    }
    setShowPayment(true);
  };

  const handleConfirmPurchase = async (): Promise<void> => {
    const itemsWithQuantity = accesorios.filter(item => item.cantidad > 0);
    
    try {
      setLoading(true);
      const response = await api.post('/bloque2/compra', {
        items: itemsWithQuantity.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario || item.precio_unitario || 0
        })),
        metodo_pago: paymentData.metodo,
        referencia_pago: paymentData.referencia
      });

      setMessage(`Compra realizada. Puntos obtenidos: ${(response.data as any).puntos_obtenidos?.toFixed(2) || 0}`);
      setShowPayment(false);
      loadCompras();
      setAccesorios(accesorios.map(item => ({ ...item, cantidad: 0 })));
      setTotal(0);
      setPaymentData({ referencia: '', metodo: 'transferencia' });
    } catch (error) {
      setMessage('Error al realizar compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bloque2">
      <div className="module-header module-b2">
        <span className="module-icon">🛒</span>
        <div><h1>Compra de Accesorios Gasnet</h1><p>Catálogo oficial · Pagá por transferencia y acumulá puntos</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Accesorios Gasnet</h2>
          <label className="btn btn-primary">
            Importar Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
          </label>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Precio Unitario</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {accesorios.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo || '-'}</td>
                  <td>{item.nombre}</td>
                  <td>${((item.precio_unitario || item.precio_unitario || 0)).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      className="quantity-input"
                      value={item.cantidad || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min="0"
                      step="1"
                    />
                  </td>
                  <td>${((item.cantidad || 0) * (item.precio_unitario || item.precio_unitario || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="total-display">
          Total: ${total.toFixed(2)}
        </div>

        <button 
          className="btn btn-primary btn-large" 
          onClick={handleComprar}
          disabled={loading || total === 0}
        >
          Realizar Compra
        </button>
      </div>

      {showPayment && (
        <div className="card payment-modal">
          <h2 className="section-title">Datos de Pago</h2>
          <div className="form-group">
            <label>Método de Pago</label>
            <select 
              value={paymentData.metodo}
              onChange={(e) => setPaymentData({ ...paymentData, metodo: e.target.value })}
            >
              <option value="transferencia">Transferencia Bancaria</option>
            </select>
          </div>
          <div className="form-group">
            <label>Referencia de Pago</label>
            <input
              type="text"
              value={paymentData.referencia}
              onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
              placeholder="Ingrese el número de transferencia"
            />
          </div>
          <div className="payment-actions">
            <button className="btn btn-danger" onClick={() => setShowPayment(false)}>
              Cancelar
            </button>
            <button className="btn btn-success" onClick={handleConfirmPurchase} disabled={loading}>
              {loading ? 'Procesando...' : 'Confirmar Compra'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Compras Realizadas</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Total</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {compras.map((compra) => (
                <tr key={compra.id}>
                  <td>{new Date(compra.fecha_creacion).toLocaleDateString()}</td>
                  <td>${parseFloat(compra.total.toString()).toFixed(2)}</td>
                  <td>{compra.metodo_pago}</td>
                  <td>{compra.referencia_pago || '-'}</td>
                  <td>
                    <span className={`status-badge status-${compra.estado}`}>
                      {compra.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bloque2;

