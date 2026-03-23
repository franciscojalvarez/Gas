import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Proveedor } from '../entities/Proveedor.entity';
import { Material } from '../entities/Material.entity';
import { PrecioMaterial } from '../entities/PrecioMaterial.entity';
import { PresupuestoMaterial } from '../entities/PresupuestoMaterial.entity';
import { Ferreteria } from '../entities/Ferreteria.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ── Proveedores y materiales (funcionalidad existente) ──────────────────────

router.get('/proveedores', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Proveedor);
    res.json(await repo.find({ where: { activo: true } }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/materiales', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Material);
    res.json(await repo.find({ where: { activo: true }, order: { nombre: 'ASC' } }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/precios/:proveedorId', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PrecioMaterial);
    const precios = await repo.find({
      where: { proveedorId: parseInt(req.params.proveedorId) },
      relations: ['material']
    });
    res.json(precios.map(p => ({
      id: p.material.id,
      nombre: p.material.nombre,
      codigo: p.material.codigo,
      precio_unitario: p.precioUnitario,
      fecha_actualizacion: p.fechaActualizacion
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/precios/:proveedorId', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const proveedorId = parseInt(req.params.proveedorId);
    const materialRepo = AppDataSource.getRepository(Material);
    const precioRepo = AppDataSource.getRepository(PrecioMaterial);
    for (const item of items) {
      let material = await materialRepo.findOne({ where: { nombre: item.nombre } });
      if (!material) {
        material = await materialRepo.save(materialRepo.create({ nombre: item.nombre, codigo: item.codigo || null }));
      }
      const existing = await precioRepo.findOne({ where: { proveedorId, materialId: material.id } });
      if (existing) {
        existing.precioUnitario = item.precio_unitario;
        await precioRepo.save(existing);
      } else {
        await precioRepo.save({ proveedorId, materialId: material.id, precioUnitario: item.precio_unitario });
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/presupuesto', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { proveedor_id, items } = req.body;
    const repo = AppDataSource.getRepository(PresupuestoMaterial);
    const total = items.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_unitario), 0);
    const saved = await repo.save(repo.create({ usuarioId: req.user!.id, proveedorId: proveedor_id, total, items }));
    res.json({ id: saved.id, total, items, proveedor_id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/presupuestos', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PresupuestoMaterial);
    const presupuestos = await repo.find({ relations: ['proveedor'], order: { fechaCreacion: 'DESC' } });
    res.json(presupuestos.map(p => ({ ...p, proveedor_nombre: p.proveedor?.nombre })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Ferreterías ─────────────────────────────────────────────────────────────

router.get('/ferreterias', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Ferreteria);
    res.json(await repo.find({ where: { activa: true }, order: { nombre: 'ASC' } }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ferreterias/todas', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Ferreteria);
    res.json(await repo.find({ order: { nombre: 'ASC' } }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ferreterias', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, direccion, telefono, horarios, lat, lng } = req.body;
    if (!nombre || !direccion) return res.status(400).json({ error: 'nombre y direccion son requeridos' });
    const repo = AppDataSource.getRepository(Ferreteria);
    const saved = await repo.save(repo.create({ nombre, direccion, telefono, horarios, lat: Number(lat), lng: Number(lng), activa: true }));
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ferreterias/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Ferreteria);
    const ferreteria = await repo.findOne({ where: { id: Number(req.params.id) } });
    if (!ferreteria) return res.status(404).json({ error: 'Ferretería no encontrada' });
    const { nombre, direccion, telefono, horarios, lat, lng, activa } = req.body;
    if (nombre !== undefined) ferreteria.nombre = nombre;
    if (direccion !== undefined) ferreteria.direccion = direccion;
    if (telefono !== undefined) ferreteria.telefono = telefono;
    if (horarios !== undefined) ferreteria.horarios = horarios;
    if (lat !== undefined) ferreteria.lat = Number(lat);
    if (lng !== undefined) ferreteria.lng = Number(lng);
    if (activa !== undefined) ferreteria.activa = activa;
    res.json(await repo.save(ferreteria));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ferreterias/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Ferreteria);
    await repo.update(Number(req.params.id), { activa: false });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
