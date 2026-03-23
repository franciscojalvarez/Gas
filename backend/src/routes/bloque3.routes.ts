import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Proveedor } from '../entities/Proveedor.entity';
import { Material } from '../entities/Material.entity';
import { PrecioMaterial } from '../entities/PrecioMaterial.entity';
import { PresupuestoMaterial } from '../entities/PresupuestoMaterial.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener todos los proveedores
router.get('/proveedores', async (req: Request, res: Response) => {
  try {
    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const proveedores = await proveedorRepo.find({
      where: { activo: true }
    });
    res.json(proveedores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los materiales
router.get('/materiales', async (req: Request, res: Response) => {
  try {
    const materialRepo = AppDataSource.getRepository(Material);
    const materiales = await materialRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' }
    });
    res.json(materiales);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener precios de materiales por proveedor
router.get('/precios/:proveedorId', async (req: Request, res: Response) => {
  try {
    const precioRepo = AppDataSource.getRepository(PrecioMaterial);
    const precios = await precioRepo.find({
      where: { proveedorId: parseInt(req.params.proveedorId) },
      relations: ['material']
    });

    const materiales = precios.map(p => ({
      id: p.material.id,
      nombre: p.material.nombre,
      codigo: p.material.codigo,
      precio_unitario: p.precioUnitario,
      fecha_actualizacion: p.fechaActualizacion
    }));

    res.json(materiales);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar precios de materiales
router.post('/precios/:proveedorId', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const proveedorId = parseInt(req.params.proveedorId);
    const materialRepo = AppDataSource.getRepository(Material);
    const precioRepo = AppDataSource.getRepository(PrecioMaterial);

    for (const item of items) {
      let material = await materialRepo.findOne({ where: { nombre: item.nombre } });
      
      if (!material) {
        material = materialRepo.create({
          nombre: item.nombre,
          codigo: item.codigo || null
        });
        material = await materialRepo.save(material);
      }

      const existingPrecio = await precioRepo.findOne({
        where: { proveedorId, materialId: material.id }
      });

      if (existingPrecio) {
        existingPrecio.precioUnitario = item.precio_unitario;
        await precioRepo.save(existingPrecio);
      } else {
        await precioRepo.save({
          proveedorId,
          materialId: material.id,
          precioUnitario: item.precio_unitario
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear presupuesto de materiales
router.post('/presupuesto', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { proveedor_id, items } = req.body;
    const presupuestoRepo = AppDataSource.getRepository(PresupuestoMaterial);

    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.cantidad * item.precio_unitario);
    }, 0);

    const presupuesto = presupuestoRepo.create({
      usuarioId: req.user!.id,
      proveedorId: proveedor_id,
      total,
      items
    });

    const saved = await presupuestoRepo.save(presupuesto);

    res.json({
      id: saved.id,
      total,
      items,
      proveedor_id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener presupuestos de materiales
router.get('/presupuestos', async (req: Request, res: Response) => {
  try {
    const presupuestoRepo = AppDataSource.getRepository(PresupuestoMaterial);
    const presupuestos = await presupuestoRepo.find({
      relations: ['proveedor'],
      order: { fechaCreacion: 'DESC' }
    });
    
    const result = presupuestos.map(p => ({
      ...p,
      proveedor_nombre: p.proveedor?.nombre
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

