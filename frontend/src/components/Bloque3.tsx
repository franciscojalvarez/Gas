import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import { Proveedor, Material, PresupuestoMaterial } from '../types';
import './Bloque3.css';

interface MaterialWithQuantity extends Material {
  cantidad: number;
  precio_unitario: number;
}

const Bloque3: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [materiales, setMateriales] = useState<MaterialWithQuantity[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadProveedores();
    loadMateriales();
    loadPresupuestos();
  }, []);

  useEffect(() => {
    if (selectedProveedor) {
      loadPrecios();
    }
  }, [selectedProveedor]);

  const loadProveedores = async (): Promise<void> => {
    try {
      const response = await api.get<Proveedor[]>('/bloque3/proveedores');
      setProveedores(response.data);
      if (response.data.length > 0) {
        setSelectedProveedor(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading proveedores:', error);
    }
  };

  const loadMateriales = async (): Promise<void> => {
    try {
      const response = await api.get<Material[]>('/bloque3/materiales');
      setMateriales(response.data.map(item => ({ ...item, cantidad: 0, precio_unitario: 0 })));
    } catch (error) {
      console.error('Error loading materiales:', error);
    }
  };

  const loadPrecios = async (): Promise<void> => {
    try {
      const response = await api.get<Material[]>('/bloque3/precios/' + selectedProveedor);
     setMateriales(response.data.map(item => ({ 
        ...item, 
        // Agregamos esta línea para asegurar que sea un número
        precio_unitario: item.precio_unitario || item.precioUnitario || 0,
        cantidad: materiales.find(m => m.id === item.id)?.cantidad || 0
      })));
    } catch (error) {
      console.error('Error loading precios:', error);
    }
  };

  const loadPresupuestos = async (): Promise<void> => {
    try {
      const response = await api.get<PresupuestoMaterial[]>('/bloque3/presupuestos');
      setPresupuestos(response.data);
    } catch (error) {
      console.error('Error loading presupuestos:', error);
    }
  };

  const handleQuantityChange = (id: number, cantidad: string): void => {
    const updatedMateriales = materiales.map(item => 
      item.id === id ? { ...item, cantidad: parseFloat(cantidad) || 0 } : item
    );
    setMateriales(updatedMateriales);
    calculateTotal(updatedMateriales);
  };

  const calculateTotal = (itemsList: MaterialWithQuantity[]): void => {
    const sum = itemsList.reduce((acc, item) => {
      const precio = item.precioUnitario || item.precio_unitario || 0;
      return acc + (item.cantidad * precio);
    }, 0);
    setTotal(sum);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !selectedProveedor) {
      setMessage('Debe seleccionar un proveedor primero');
      return;
    }

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

          await api.post(`/bloque3/precios/${selectedProveedor}`, { items: itemsToUpdate });
          setMessage('Precios actualizados correctamente');
          loadPrecios();
        } catch (error) {
          setMessage('Error al importar Excel');
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSavePresupuesto = async (): Promise<void> => {
    const itemsWithQuantity = materiales.filter(item => item.cantidad > 0);
    
    if (itemsWithQuantity.length === 0) {
      setMessage('Debe agregar al menos un material con cantidad');
      return;
    }

    if (!selectedProveedor) {
      setMessage('Debe seleccionar un proveedor');
      return;
    }

    try {
      setLoading(true);
      await api.post('/bloque3/presupuesto', {
        proveedor_id: selectedProveedor,
        items: itemsWithQuantity.map(item => ({
          id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario || item.precio_unitario || 0
        }))
      });
      setMessage('Presupuesto guardado correctamente');
      loadPresupuestos();
      setMateriales(materiales.map(item => ({ ...item, cantidad: 0 })));
      setTotal(0);
    } catch (error) {
      setMessage('Error al guardar presupuesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bloque3">
      <div className="module-header module-b3">
        <span className="module-icon">📦</span>
        <div><h1>Presupuesto por Materiales</h1><p>Compará precios entre los 4 proveedores</p></div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h2 className="section-title">Seleccionar Proveedor</h2>
          <div className="proveedor-selector">
            {proveedores.map((prov) => (
              <button
                key={prov.id}
                className={`btn ${selectedProveedor === prov.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setSelectedProveedor(prov.id);
                  setMateriales(materiales.map(item => ({ ...item, cantidad: 0 })));
                  setTotal(0);
                }}
              >
                {prov.nombre}
              </button>
            ))}
          </div>
        </div>

        {selectedProveedor && (
          <>
            <div className="section-header">
              <h2 className="section-title">Materiales - {proveedores.find(p => p.id === selectedProveedor)?.nombre}</h2>
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
                    <th>Material</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.map((item) => (
                    <tr key={item.id}>
                      <td>{item.codigo || '-'}</td>
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
              Total: ${total.toFixed(2)}
            </div>

            <button 
              className="btn btn-primary btn-large" 
              onClick={handleSavePresupuesto}
              disabled={loading || total === 0}
            >
              {loading ? 'Guardando...' : 'Guardar Presupuesto'}
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Presupuestos Guardados</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
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
                    <td>{pres.proveedor_nombre}</td>
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

export default Bloque3;

