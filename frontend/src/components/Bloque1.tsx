import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { ManoObraItem, PresupuestoManoObra } from '../types';
import './Bloque1.css';

interface ManoObraItemWithQuantity extends ManoObraItem {
  cantidad: number;
}

const Bloque1: React.FC = () => {
  const [items, setItems] = useState<ManoObraItemWithQuantity[]>([]);
  const [presupuestos, setPresupuestos] = useState<PresupuestoManoObra[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadItems();
    loadPresupuestos();
  }, []);

  const loadItems = async (): Promise<void> => {
    try {
      const response = await api.get<ManoObraItem[]>('/bloque1/items');
      setItems(response.data.map(item => ({ ...item, cantidad: 0 })));
    } catch (error) {
      console.error('Error loading items:', error);
      setMessage('Error al cargar items');
    }
  };

  const loadPresupuestos = async (): Promise<void> => {
    try {
      const response = await api.get<PresupuestoManoObra[]>('/bloque1/presupuestos');
      setPresupuestos(response.data);
    } catch (error) {
      console.error('Error loading presupuestos:', error);
    }
  };

  const handleQuantityChange = (id: number, cantidad: string): void => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, cantidad: parseFloat(cantidad) || 0 } : item
    );
    setItems(updatedItems);
    calculateTotal(updatedItems);
  };

  const calculateTotal = (itemsList: ManoObraItemWithQuantity[]): void => {
    const sum = itemsList.reduce((acc, item) => {
      return acc + (item.cantidad * item.precio_unitario);
    }, 0);
    setTotal(sum);
  };

  const handleExportExcel = (): void => {
    const ws = XLSX.utils.json_to_sheet(items.map(item => {
      const precio = item.precio_unitario || item.precio_unitario || 0;
      return {
        Nombre: item.nombre,
        'Precio Unitario': precio,
        Cantidad: item.cantidad || 0,
        Subtotal: (item.cantidad || 0) * precio
      };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
    XLSX.writeFile(wb, 'presupuesto_mano_obra.xlsx');
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

          await api.post('/bloque1/items', { items: itemsToUpdate });
          setMessage('Items actualizados correctamente');
          loadItems();
        } catch (error) {
          setMessage('Error al importar Excel');
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSavePresupuesto = async (): Promise<void> => {
    const itemsWithQuantity = items.filter(item => item.cantidad > 0);
    
    if (itemsWithQuantity.length === 0) {
      setMessage('Debe agregar al menos un item con cantidad');
      return;
    }

    try {
      setLoading(true);
      await api.post('/bloque1/presupuesto', {
        items: itemsWithQuantity.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario || item.precio_unitario || 0
        }))
      });
      setMessage('Presupuesto guardado correctamente');
      loadPresupuestos();
      setItems(items.map(item => ({ ...item, cantidad: 0 })));
      setTotal(0);
    } catch (error) {
      setMessage('Error al guardar presupuesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bloque1">
      <h1 className="page-title">Bloque 1: Presupuesto Mano de Obra</h1>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Items de Mano de Obra</h2>
          <div className="actions">
            <label className="btn btn-primary">
              Importar Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-success" onClick={handleExportExcel}>
              Exportar Excel
            </button>
          </div>
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
                  <td>${((item.precio_unitario || item.precio_unitario || 0)).toFixed(2)}</td>
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
          onClick={handleSavePresupuesto}
          disabled={loading || total === 0}
        >
          {loading ? 'Guardando...' : 'Guardar Presupuesto'}
        </button>
      </div>

      <div className="card">
        <h2 className="section-title">Presupuestos Guardados</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Total</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((pres) => {
                const itemsData = typeof pres.items === 'string' ? JSON.parse(pres.items) : pres.items;
                return (
                  <tr key={pres.id}>
                    <td>{new Date(pres.fecha_creacion).toLocaleDateString()}</td>
                    <td>${parseFloat(pres.total.toString()).toFixed(2)}</td>
                    <td>{Array.isArray(itemsData) ? itemsData.length : 0} items</td>
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

export default Bloque1;

