import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role.entity';
import { Permiso } from '../entities/Permiso.entity';
import { RolPermiso } from '../entities/RolPermiso.entity';
import { Proveedor } from '../entities/Proveedor.entity';
import { Capacitacion } from '../entities/Capacitacion.entity';
import { TipoTrabajo } from '../entities/TipoTrabajo.entity';
import { Usuario } from '../entities/Usuario.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    // 1. FORZAMOS LA CREACIÓN DE TABLAS
    // Esto sobrescribe la configuración de database.ts solo para este script
    AppDataSource.setOptions({ synchronize: true });

    // 2. Iniciamos la conexión
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada y sincronizada (Tablas creadas)');

    const roleRepo = AppDataSource.getRepository(Role);
    const permisoRepo = AppDataSource.getRepository(Permiso);
    const rolPermisoRepo = AppDataSource.getRepository(RolPermiso);
    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const capacitacionRepo = AppDataSource.getRepository(Capacitacion);
    const tipoTrabajoRepo = AppDataSource.getRepository(TipoTrabajo);
    const usuarioRepo = AppDataSource.getRepository(Usuario);

    // ------------------------------------------
    // ROLES
    // ------------------------------------------
    console.log('Insertando Roles...');
    let adminRole = await roleRepo.findOne({ where: { id: 1 } });
    if (!adminRole) {
      adminRole = await roleRepo.save({ id: 1, nombre: 'Administrador', descripcion: 'Acceso completo', activo: true });
    }

    let instaladorRole = await roleRepo.findOne({ where: { id: 2 } });
    if (!instaladorRole) {
      instaladorRole = await roleRepo.save({ id: 2, nombre: 'Instalador', descripcion: 'Profesional', activo: true });
    }

    let usuarioRole = await roleRepo.findOne({ where: { id: 3 } });
    if (!usuarioRole) {
      usuarioRole = await roleRepo.save({ id: 3, nombre: 'Usuario', descripcion: 'Básico', activo: true });
    }

    // ------------------------------------------
    // PERMISOS
    // ------------------------------------------
    console.log('Insertando Permisos...');
    let permisos = await permisoRepo.find();
    if (permisos.length === 0) {
      permisos = await permisoRepo.save([
        { id: 1, nombre: 'bloque1_ver', descripcion: 'Ver presupuestos de mano de obra', modulo: 'Bloque 1', activo: true },
        { id: 2, nombre: 'bloque1_crear', descripcion: 'Crear presupuestos de mano de obra', modulo: 'Bloque 1', activo: true },
        { id: 3, nombre: 'bloque1_editar', descripcion: 'Editar presupuestos de mano de obra', modulo: 'Bloque 1', activo: true },
        { id: 4, nombre: 'bloque1_eliminar', descripcion: 'Eliminar presupuestos de mano de obra', modulo: 'Bloque 1', activo: true },
        { id: 5, nombre: 'bloque2_ver', descripcion: 'Ver accesorios Gasnet', modulo: 'Bloque 2', activo: true },
        { id: 6, nombre: 'bloque2_comprar', descripcion: 'Comprar accesorios Gasnet', modulo: 'Bloque 2', activo: true },
        { id: 7, nombre: 'bloque3_ver', descripcion: 'Ver presupuestos de materiales', modulo: 'Bloque 3', activo: true },
        { id: 8, nombre: 'bloque3_crear', descripcion: 'Crear presupuestos de materiales', modulo: 'Bloque 3', activo: true },
        { id: 9, nombre: 'bloque4_ver', descripcion: 'Ver sistema de puntos', modulo: 'Bloque 4', activo: true },
        { id: 10, nombre: 'bloque4_gestionar', descripcion: 'Gestionar usuarios y puntos', modulo: 'Bloque 4', activo: true },
        { id: 11, nombre: 'bloque5_ver', descripcion: 'Ver capacitaciones', modulo: 'Bloque 5', activo: true },
        { id: 12, nombre: 'bloque5_inscribir', descripcion: 'Inscribirse a capacitaciones', modulo: 'Bloque 5', activo: true },
        { id: 13, nombre: 'bloque6_ver', descripcion: 'Ver bolsa de trabajo', modulo: 'Bloque 6', activo: true },
        { id: 14, nombre: 'bloque6_crear', descripcion: 'Crear pedidos de trabajo', modulo: 'Bloque 6', activo: true },
        { id: 15, nombre: 'usuarios_gestionar', descripcion: 'Gestionar usuarios', modulo: 'Sistema', activo: true },
        { id: 16, nombre: 'roles_gestionar', descripcion: 'Gestionar roles y permisos', modulo: 'Sistema', activo: true },
        { id: 17, nombre: 'configuracion', descripcion: 'Acceso a configuración', modulo: 'Sistema', activo: true },
      ]);
    }

    // RELACIÓN ROL-PERMISO (ADMIN)
    const adminPermisos = await rolPermisoRepo.find({ where: { role: adminRole } });
    if (adminPermisos.length === 0) {
      for (const permiso of permisos) {
        await rolPermisoRepo.save({ role: adminRole, permiso: permiso });
      }
    }

    // RELACIÓN ROL-PERMISO (INSTALADOR)
    const instaladorPermisos = await rolPermisoRepo.find({ where: { role: instaladorRole } });
    if (instaladorPermisos.length === 0) {
      const permisosInstalador = [1, 2, 5, 6, 7, 8, 9, 11, 12, 13, 14];
      for (const permisoId of permisosInstalador) {
        const permiso = permisos.find(p => p.id === permisoId);
        if (permiso) await rolPermisoRepo.save({ role: instaladorRole, permiso: permiso });
      }
    }

    // RELACIÓN ROL-PERMISO (USUARIO)
    const usuarioPermisos = await rolPermisoRepo.find({ where: { role: usuarioRole } });
    if (usuarioPermisos.length === 0) {
      const permisosUsuario = [1, 5, 7, 9, 11, 13];
      for (const permisoId of permisosUsuario) {
        const permiso = permisos.find(p => p.id === permisoId);
        if (permiso) await rolPermisoRepo.save({ role: usuarioRole, permiso: permiso });
      }
    }

    // ------------------------------------------
    // OTROS DATOS (Proveedores, Capacitaciones, Tipos)
    // ------------------------------------------
    console.log('Insertando Datos Varios...');
    const proveedores = await proveedorRepo.find();
    if (proveedores.length === 0) {
      await proveedorRepo.save([
        { id: 1, nombre: 'Proveedor A', activo: true },
        { id: 2, nombre: 'Proveedor B', activo: true },
        { id: 3, nombre: 'Proveedor C', activo: true },
        { id: 4, nombre: 'Proveedor D', activo: true },
      ]);
    }

    const capacitaciones = await capacitacionRepo.find();
    if (capacitaciones.length === 0) {
      await capacitacionRepo.save([
        { id: 1, nombre: 'Capacitación 1', descripcion: 'Desc 1', contenido: 'Cont 1', puntosRequeridos: 10, activa: true },
        { id: 2, nombre: 'Capacitación 2', descripcion: 'Desc 2', contenido: 'Cont 2', puntosRequeridos: 15, activa: true },
        { id: 3, nombre: 'Capacitación 3', descripcion: 'Desc 3', contenido: 'Cont 3', puntosRequeridos: 20, activa: true },
        { id: 4, nombre: 'Capacitación 4', descripcion: 'Desc 4', contenido: 'Cont 4', puntosRequeridos: 25, activa: true },
        { id: 5, nombre: 'Capacitación 5', descripcion: 'Desc 5', contenido: 'Cont 5', puntosRequeridos: 30, activa: true },
      ]);
    }

    const tiposTrabajo = await tipoTrabajoRepo.find();
    if (tiposTrabajo.length === 0) {
      await tipoTrabajoRepo.save([
        { id: 1, nombre: 'Instalación de Gas', activo: true },
        { id: 2, nombre: 'Instalación Sanitaria', activo: true },
        { id: 3, nombre: 'Mantenimiento', activo: true },
        { id: 4, nombre: 'Reparación', activo: true },
        { id: 5, nombre: 'Inspección', activo: true },
      ]);
    }

    // ------------------------------------------
    // USUARIO ADMINISTRADOR
    // ------------------------------------------
    console.log('Verificando Usuario Admin...');
    const adminUser = await usuarioRepo.findOne({ where: { email: 'admin@gasnet.com' } });
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        const nuevoAdmin = usuarioRepo.create({
            nombre: 'Super Admin',
            email: 'admin@gasnet.com',
            password: hashedPassword,
            role: adminRole,
            puntos_acumulados: 0,
            activo: true
        });
        await usuarioRepo.save(nuevoAdmin);
        console.log('✅ USUARIO ADMIN CREADO: admin@gasnet.com / 123456');
    } else {
        console.log('ℹ️ El usuario Admin ya existe.');
    }

    console.log('🚀 SEED COMPLETADO EXITOSAMENTE');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();