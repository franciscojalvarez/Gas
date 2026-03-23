import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ManoObraItem } from '../entities/ManoObraItem.entity';
import { PresupuestoManoObra } from '../entities/PresupuestoManoObra.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener todos los items de mano de obra
router.get('/items', async (req: Request, res: Response) => {
  try {
    const itemRepo = AppDataSource.getRepository(ManoObraItem);
    const items = await itemRepo.find({
      where: { activo: true },
      order: { id: 'ASC' }
    });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar items (para importar desde Excel)
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const itemRepo = AppDataSource.getRepository(ManoObraItem);

    for (const item of items) {
      if (item.id) {
        await itemRepo.update(item.id, {
          nombre: item.nombre,
          precioUnitario: item.precio_unitario
        });
      } else {
        await itemRepo.save({
          nombre: item.nombre,
          precioUnitario: item.precio_unitario
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
    const { items } = req.body;
    const presupuestoRepo = AppDataSource.getRepository(PresupuestoManoObra);

    const total = items.reduce((sum: number, item: any) => {
      const precio = item.precio_unitario || item.precioUnitario || 0;
      return sum + (item.cantidad * precio);
    }, 0);

    const presupuesto = presupuestoRepo.create({
      usuarioId: req.user!.id,
      total,
      items
    });

    const saved = await presupuestoRepo.save(presupuesto);

    res.json({
      id: saved.id,
      total,
      items
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener presupuestos
router.get('/presupuestos', async (req: Request, res: Response) => {
  try {
    const presupuestoRepo = AppDataSource.getRepository(PresupuestoManoObra);
    const presupuestos = await presupuestoRepo.find({
      order: { fechaCreacion: 'DESC' }
    });
    res.json(presupuestos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

