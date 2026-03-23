import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ManoObraItem } from '../entities/ManoObraItem.entity';
import { PresupuestoManoObra } from '../entities/PresupuestoManoObra.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener categorías distintas
router.get('/categorias', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ManoObraItem);
    const rows = await repo
      .createQueryBuilder('item')
      .select('DISTINCT item.categoria', 'categoria')
      .where('item.activo = true')
      .getRawMany();
    const categorias = rows.map((r: any) => r.categoria).filter(Boolean).sort();
    res.json(categorias);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener items (opcionalmente filtrados por categoría)
router.get('/items', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ManoObraItem);
    const qb = repo.createQueryBuilder('item').where('item.activo = true');
    if (req.query.categoria) {
      qb.andWhere('item.categoria = :categoria', { categoria: req.query.categoria });
    }
    const items = await qb.orderBy('item.nombre', 'ASC').getMany();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear un ítem individual
router.post('/item', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, precio_unitario, categoria } = req.body;
    if (!nombre || precio_unitario === undefined) {
      return res.status(400).json({ error: 'nombre y precio_unitario son requeridos' });
    }
    const repo = AppDataSource.getRepository(ManoObraItem);
    const item = repo.create({
      nombre,
      precioUnitario: Number(precio_unitario),
      categoria: categoria || 'General',
      activo: true
    });
    const saved = await repo.save(item);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar un ítem
router.put('/items/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ManoObraItem);
    const item = await repo.findOne({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Ítem no encontrado' });
    if (req.body.nombre !== undefined) item.nombre = req.body.nombre;
    if (req.body.precio_unitario !== undefined) item.precioUnitario = Number(req.body.precio_unitario);
    if (req.body.categoria !== undefined) item.categoria = req.body.categoria;
    const saved = await repo.save(item);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un ítem (soft delete)
router.delete('/items/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(ManoObraItem);
    await repo.update(Number(req.params.id), { activo: false });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar items en bulk (para importar desde Excel)
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { items, categoria } = req.body;
    const repo = AppDataSource.getRepository(ManoObraItem);
    for (const item of items) {
      if (item.id) {
        await repo.update(item.id, {
          nombre: item.nombre,
          precioUnitario: item.precio_unitario || item.precioUnitario
        });
      } else {
        await repo.save({
          nombre: item.nombre,
          precioUnitario: item.precio_unitario || item.precioUnitario || 0,
          categoria: item.categoria || categoria || 'General'
        });
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear presupuesto
router.post('/presupuesto', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, categoria } = req.body;
    const repo = AppDataSource.getRepository(PresupuestoManoObra);
    const total = items.reduce((sum: number, item: any) => {
      const precio = item.precio_unitario || item.precioUnitario || 0;
      return sum + (item.cantidad * precio);
    }, 0);
    const presupuesto = repo.create({
      usuarioId: req.user!.id,
      total,
      items: { categoria: categoria || 'General', detalle: items }
    });
    const saved = await repo.save(presupuesto);
    res.json({ success: true, presupuesto_id: saved.id, total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener presupuestos
router.get('/presupuestos', async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(PresupuestoManoObra);
    const presupuestos = await repo.find({ order: { fechaCreacion: 'DESC' } });
    res.json(presupuestos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
