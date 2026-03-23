import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { TipoTrabajo } from '../entities/TipoTrabajo.entity';
import { TrabajoItem } from '../entities/TrabajoItem.entity';
import { PedidoTrabajo, EstadoPedido } from '../entities/PedidoTrabajo.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener tipos de trabajo
router.get('/tipos-trabajo', async (req: Request, res: Response) => {
  try {
    const tipoRepo = AppDataSource.getRepository(TipoTrabajo);
    const tipos = await tipoRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' }
    });
    res.json(tipos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener items de trabajos
router.get('/items', async (req: Request, res: Response) => {
  try {
    const itemRepo = AppDataSource.getRepository(TrabajoItem);
    const items = await itemRepo.find({
      where: { activo: true },
      order: { id: 'ASC' }
    });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar items de trabajos
router.post('/items', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const itemRepo = AppDataSource.getRepository(TrabajoItem);

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

// Crear pedido de trabajo
router.post('/pedido', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tipo_trabajo_id, direccion, contacto_cliente, telefono, email, items } = req.body;
    const pedidoRepo = AppDataSource.getRepository(PedidoTrabajo);

    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.cantidad * item.precio_unitario);
    }, 0);

    const pedido = pedidoRepo.create({
      tipoTrabajoId: tipo_trabajo_id || null,
      direccion,
      contactoCliente: contacto_cliente,
      telefono: telefono || null,
      email: email || null,
      total,
      items,
      estado: EstadoPedido.PENDIENTE
    });

    const saved = await pedidoRepo.save(pedido);

    res.json({
      id: saved.id,
      total,
      items
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener pedidos de trabajo
router.get('/pedidos', async (req: Request, res: Response) => {
  try {
    const pedidoRepo = AppDataSource.getRepository(PedidoTrabajo);
    const pedidos = await pedidoRepo.find({
      relations: ['tipoTrabajo'],
      order: { fechaCreacion: 'DESC' }
    });

    const result = pedidos.map(p => ({
      ...p,
      tipo_trabajo_nombre: p.tipoTrabajo?.nombre
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de pedido
router.put('/pedido/:id', async (req: Request, res: Response) => {
  try {
    const { estado } = req.body;
    const pedidoRepo = AppDataSource.getRepository(PedidoTrabajo);
    await pedidoRepo.update(req.params.id, { estado: estado as EstadoPedido });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

