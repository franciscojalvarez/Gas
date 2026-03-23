import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AccesorioGasnet } from '../entities/AccesorioGasnet.entity';
import { CompraGasnet, EstadoCompra } from '../entities/CompraGasnet.entity';
import { TransaccionPunto } from '../entities/TransaccionPunto.entity';
import { Usuario } from '../entities/Usuario.entity';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Obtener todos los accesorios Gasnet
router.get('/accesorios', async (req: Request, res: Response) => {
  try {
    const accesorioRepo = AppDataSource.getRepository(AccesorioGasnet);
    const accesorios = await accesorioRepo.find({
      where: { activo: true },
      order: { id: 'ASC' }
    });
    res.json(accesorios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear o actualizar accesorios
router.post('/accesorios', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const accesorioRepo = AppDataSource.getRepository(AccesorioGasnet);

    for (const item of items) {
      if (item.id) {
        await accesorioRepo.update(item.id, {
          nombre: item.nombre,
          codigo: item.codigo,
          precioUnitario: item.precio_unitario
        });
      } else {
        await accesorioRepo.save({
          nombre: item.nombre,
          codigo: item.codigo,
          precioUnitario: item.precio_unitario
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear compra
router.post('/compra', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, metodo_pago, referencia_pago } = req.body;
    const compraRepo = AppDataSource.getRepository(CompraGasnet);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const transaccionRepo = AppDataSource.getRepository(TransaccionPunto);

    const total = items.reduce((sum: number, item: any) => {
      return sum + (item.cantidad * item.precio_unitario);
    }, 0);

    const compra = compraRepo.create({
      usuarioId: req.user!.id,
      total,
      items,
      estado: EstadoCompra.PENDIENTE,
      metodoPago: metodo_pago || 'transferencia',
      referenciaPago: referencia_pago || null
    });

    const saved = await compraRepo.save(compra);

    // Calcular puntos ($1000 = 1 punto)
    const puntos = total / 1000;
    const usuario = await usuarioRepo.findOne({ where: { id: req.user!.id } });
    if (usuario) {
      usuario.puntosAcumulados += puntos;
      await usuarioRepo.save(usuario);

      await transaccionRepo.save({
        usuarioId: usuario.id,
        tipo: 'compra',
        monto: total,
        puntos,
        descripcion: 'Compra de accesorios Gasnet'
      });
    }

    res.json({
      id: saved.id,
      total,
      items,
      puntos_obtenidos: puntos
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener compras
router.get('/compras', async (req: Request, res: Response) => {
  try {
    const compraRepo = AppDataSource.getRepository(CompraGasnet);
    const compras = await compraRepo.find({
      order: { fechaCreacion: 'DESC' }
    });
    res.json(compras);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de compra
router.put('/compra/:id', async (req: Request, res: Response) => {
  try {
    const { estado } = req.body;
    const compraRepo = AppDataSource.getRepository(CompraGasnet);
    await compraRepo.update(req.params.id, { estado: estado as EstadoCompra });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

