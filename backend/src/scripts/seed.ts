import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role.entity';
import { Permiso } from '../entities/Permiso.entity';
import { RolPermiso } from '../entities/RolPermiso.entity';
import { Proveedor } from '../entities/Proveedor.entity';
import { Capacitacion } from '../entities/Capacitacion.entity';
import { TipoTrabajo } from '../entities/TipoTrabajo.entity';
import { Usuario } from '../entities/Usuario.entity';
import { ManoObraItem } from '../entities/ManoObraItem.entity';
import { AccesorioGasnet } from '../entities/AccesorioGasnet.entity';
import { Ferreteria } from '../entities/Ferreteria.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    AppDataSource.setOptions({ synchronize: true });
    await AppDataSource.initialize();
    console.log('✅ Base de datos conectada y sincronizada');

    const roleRepo = AppDataSource.getRepository(Role);
    const permisoRepo = AppDataSource.getRepository(Permiso);
    const rolPermisoRepo = AppDataSource.getRepository(RolPermiso);
    const proveedorRepo = AppDataSource.getRepository(Proveedor);
    const capacitacionRepo = AppDataSource.getRepository(Capacitacion);
    const tipoTrabajoRepo = AppDataSource.getRepository(TipoTrabajo);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const manoObraRepo = AppDataSource.getRepository(ManoObraItem);
    const accesorioRepo = AppDataSource.getRepository(AccesorioGasnet);
    const ferreteriaRepo = AppDataSource.getRepository(Ferreteria);

    // ── ROLES ────────────────────────────────────────────────────────────────
    console.log('Insertando Roles...');
    let adminRole = await roleRepo.findOne({ where: { id: 1 } });
    if (!adminRole) adminRole = await roleRepo.save({ id: 1, nombre: 'Administrador', descripcion: 'Acceso completo', activo: true });

    let instaladorRole = await roleRepo.findOne({ where: { id: 2 } });
    if (!instaladorRole) instaladorRole = await roleRepo.save({ id: 2, nombre: 'Instalador', descripcion: 'Profesional', activo: true });

    let usuarioRole = await roleRepo.findOne({ where: { id: 3 } });
    if (!usuarioRole) usuarioRole = await roleRepo.save({ id: 3, nombre: 'Usuario', descripcion: 'Básico', activo: true });

    // ── PERMISOS ─────────────────────────────────────────────────────────────
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

    const adminPermisos = await rolPermisoRepo.find({ where: { role: adminRole } });
    if (adminPermisos.length === 0) {
      for (const permiso of permisos) await rolPermisoRepo.save({ role: adminRole, permiso });
    }

    const instaladorPermisos = await rolPermisoRepo.find({ where: { role: instaladorRole } });
    if (instaladorPermisos.length === 0) {
      for (const id of [1, 2, 5, 6, 7, 8, 9, 11, 12, 13, 14]) {
        const p = permisos.find(x => x.id === id);
        if (p) await rolPermisoRepo.save({ role: instaladorRole, permiso: p });
      }
    }

    const usuarioPermisos = await rolPermisoRepo.find({ where: { role: usuarioRole } });
    if (usuarioPermisos.length === 0) {
      for (const id of [1, 5, 7, 9, 11, 13]) {
        const p = permisos.find(x => x.id === id);
        if (p) await rolPermisoRepo.save({ role: usuarioRole, permiso: p });
      }
    }

    // ── MANO DE OBRA — Instalación de Gas Residencial ────────────────────────
    console.log('Insertando Ítems de Mano de Obra...');
    const gasItems = await manoObraRepo.find({ where: { categoria: 'Instalación Gas' } });
    if (gasItems.length === 0) {
      await manoObraRepo.save([
        { nombre: 'Tendido cañería cobre 1/2" (por metro)', precioUnitario: 3500, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Tendido cañería cobre 3/4" (por metro)', precioUnitario: 4800, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Tendido cañería cobre 1" (por metro)', precioUnitario: 6500, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación llave de paso esfera 1/2"', precioUnitario: 8000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación llave de paso esfera 3/4"', precioUnitario: 11000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación regulador presión 2 etapas', precioUnitario: 18000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación medidor gas (gestión + mano de obra)', precioUnitario: 35000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación termocalefón', precioUnitario: 25000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación caldera mural', precioUnitario: 45000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación cocina / anafe', precioUnitario: 15000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación estufa empotrada', precioUnitario: 20000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación caloventor', precioUnitario: 12000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Soldadura punto cobre 1/2"', precioUnitario: 2500, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Soldadura punto cobre 3/4"', precioUnitario: 3200, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Conexión flexible cocina', precioUnitario: 5000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Conexión flexible calefactor', precioUnitario: 6000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Prueba de hermeticidad (instalación completa)', precioUnitario: 28000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Habilitación instalación gas (gestión)', precioUnitario: 40000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación detector de gas', precioUnitario: 12000, categoria: 'Instalación Gas', activo: true },
        { nombre: 'Colocación ventilación reglamentaria', precioUnitario: 18000, categoria: 'Instalación Gas', activo: true },
      ]);
      console.log('  ✓ 20 ítems — Instalación Gas');
    }

    // ── MANO DE OBRA — Instalación Sanitaria ─────────────────────────────────
    const sanitariaItems = await manoObraRepo.find({ where: { categoria: 'Instalación Sanitaria' } });
    if (sanitariaItems.length === 0) {
      await manoObraRepo.save([
        { nombre: 'Tendido cañería PVC desagüe 110mm (por metro)', precioUnitario: 4200, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Tendido cañería PVC desagüe 63mm (por metro)', precioUnitario: 3100, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Tendido cañería PVC desagüe 40mm (por metro)', precioUnitario: 2400, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Tendido cañería PPR agua fría 20mm (por metro)', precioUnitario: 3800, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Tendido cañería PPR agua caliente 20mm (por metro)', precioUnitario: 4200, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación inodoro con mochila', precioUnitario: 28000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación bidet', precioUnitario: 22000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación lavatorio', precioUnitario: 18000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación pileta cocina', precioUnitario: 20000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación bañera', precioUnitario: 35000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación ducha completa', precioUnitario: 25000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación termostato ducha eléctrica', precioUnitario: 15000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación termotanque / calefón', precioUnitario: 30000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación llave de corte general', precioUnitario: 12000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación válvula anti-retorno', precioUnitario: 8500, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Conexión a red cloacal', precioUnitario: 45000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Cámara de inspección (unidad)', precioUnitario: 55000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Destapación cañería mecánica', precioUnitario: 18000, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Colocación sifón botella', precioUnitario: 5500, categoria: 'Instalación Sanitaria', activo: true },
        { nombre: 'Instalación bomba presurizadora', precioUnitario: 38000, categoria: 'Instalación Sanitaria', activo: true },
      ]);
      console.log('  ✓ 20 ítems — Instalación Sanitaria');
    }

    // ── MANO DE OBRA — Reparación y Mantenimiento ────────────────────────────
    const repItems = await manoObraRepo.find({ where: { categoria: 'Reparación y Mantenimiento' } });
    if (repItems.length === 0) {
      await manoObraRepo.save([
        { nombre: 'Detección pérdida de gas (visita + informe)', precioUnitario: 22000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Detección pérdida de agua (visita + informe)', precioUnitario: 18000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Reparación cañería cobre — soldadura (punto)', precioUnitario: 8500, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Reparación cañería PVC (punto)', precioUnitario: 6000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio llave de paso esfera 1/2"', precioUnitario: 12000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio llave de paso esfera 3/4"', precioUnitario: 15000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio regulador de presión', precioUnitario: 18000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio manguera flexible cocina', precioUnitario: 8000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio manguera flexible calefactor', precioUnitario: 9500, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Limpieza y regulación quemadores cocina', precioUnitario: 15000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Limpieza sifón', precioUnitario: 5000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Destapación inodoro', precioUnitario: 12000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio kit mochila inodoro', precioUnitario: 14000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio fluxómetro', precioUnitario: 18000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio canilla monocomando cocina', precioUnitario: 16000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio canilla monocomando baño', precioUnitario: 14000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Cambio cabezal ducha', precioUnitario: 8000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Sellado pérdida azulejo / junta', precioUnitario: 10000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Revisión instalación gas (informe completo)', precioUnitario: 28000, categoria: 'Reparación y Mantenimiento', activo: true },
        { nombre: 'Mantenimiento preventivo anual', precioUnitario: 65000, categoria: 'Reparación y Mantenimiento', activo: true },
      ]);
      console.log('  ✓ 20 ítems — Reparación y Mantenimiento');
    }

    // ── ACCESORIOS GASNET ────────────────────────────────────────────────────
    console.log('Insertando Accesorios Gasnet...');
    const existingAccesorios = await accesorioRepo.find();
    if (existingAccesorios.length === 0) {
      await accesorioRepo.save([
        { nombre: 'Codo 90° cobre 15mm (1/2")', codigo: 'GAS-001', precioUnitario: 850, activo: true },
        { nombre: 'Codo 90° cobre 22mm (3/4")', codigo: 'GAS-002', precioUnitario: 1200, activo: true },
        { nombre: 'Tee cobre 15mm (1/2")', codigo: 'GAS-003', precioUnitario: 1100, activo: true },
        { nombre: 'Tee cobre 22mm (3/4")', codigo: 'GAS-004', precioUnitario: 1450, activo: true },
        { nombre: 'Unión doble cobre 15mm', codigo: 'GAS-005', precioUnitario: 680, activo: true },
        { nombre: 'Unión doble cobre 22mm', codigo: 'GAS-006', precioUnitario: 920, activo: true },
        { nombre: 'Manguera flexible gas 1/2" × 50cm', codigo: 'GAS-007', precioUnitario: 3200, activo: true },
        { nombre: 'Manguera flexible gas 3/4" × 50cm', codigo: 'GAS-008', precioUnitario: 4100, activo: true },
        { nombre: 'Niple roscado 1/2" × 5cm', codigo: 'GAS-009', precioUnitario: 420, activo: true },
        { nombre: 'Bushing reductor 3/4" a 1/2"', codigo: 'GAS-010', precioUnitario: 750, activo: true },
        { nombre: 'Llave esfera paso total 1/2"', codigo: 'GAS-011', precioUnitario: 4800, activo: true },
        { nombre: 'Llave esfera paso total 3/4"', codigo: 'GAS-012', precioUnitario: 6200, activo: true },
        { nombre: 'Regulador presión 1 etapa 1/2"', codigo: 'GAS-013', precioUnitario: 8500, activo: true },
        { nombre: 'Regulador presión 2 etapas 3/4"', codigo: 'GAS-014', precioUnitario: 14000, activo: true },
        { nombre: 'Detector gas GNC/GLP 220V', codigo: 'GAS-015', precioUnitario: 12500, activo: true },
        { nombre: 'Tubo corrugado inox 1/2" × 1m', codigo: 'GAS-016', precioUnitario: 3800, activo: true },
        { nombre: 'Tubo corrugado inox 3/4" × 1m', codigo: 'GAS-017', precioUnitario: 5200, activo: true },
        { nombre: 'Teflón blanco 19mm × 10m', codigo: 'GAS-018', precioUnitario: 380, activo: true },
        { nombre: 'Pasta selladora roscas 60g', codigo: 'GAS-019', precioUnitario: 650, activo: true },
        { nombre: 'Abrazadera media caña 1/2" (×10)', codigo: 'GAS-020', precioUnitario: 290, activo: true },
      ]);
      console.log('  ✓ 20 accesorios Gasnet');
    }

    // ── FERRETERÍAS ──────────────────────────────────────────────────────────
    console.log('Insertando Ferreterías...');
    const existingFerr = await ferreteriaRepo.find();
    if (existingFerr.length === 0) {
      await ferreteriaRepo.save([
        { nombre: 'Ferretería Central', direccion: 'Av. Corrientes 2500, CABA', telefono: '011-4961-2233', horarios: 'L-V 8:00-18:00 / S 8:00-13:00', lat: -34.5985, lng: -58.3988, activa: true },
        { nombre: 'Ferretería Del Sur', direccion: 'Av. Rivadavia 8500, Liniers, CABA', telefono: '011-4641-5522', horarios: 'L-V 8:00-18:00 / S 8:00-13:00', lat: -34.6401, lng: -58.5205, activa: true },
        { nombre: 'Tecno Ferretería', direccion: 'Av. San Martín 3800, Villa del Parque, CABA', telefono: '011-4573-8899', horarios: 'L-V 7:30-18:00 / S 8:00-13:00', lat: -34.5988, lng: -58.4812, activa: true },
        { nombre: 'Ferretería Gómez', direccion: 'Av. Belgrano 4200, Caballito, CABA', telefono: '011-4902-3344', horarios: 'L-V 8:00-18:00 / S 8:00-12:00', lat: -34.6198, lng: -58.4488, activa: true },
        { nombre: 'Ferretería del Norte', direccion: 'Monroe 3200, Belgrano, CABA', telefono: '011-4543-7766', horarios: 'L-V 8:30-18:00 / S 9:00-13:00', lat: -34.5621, lng: -58.4576, activa: true },
        { nombre: 'Ferretería Modelo', direccion: 'Av. Cabildo 4100, Núñez, CABA', telefono: '011-4703-2211', horarios: 'L-V 8:00-17:30 / S 8:00-12:30', lat: -34.5487, lng: -58.4723, activa: true },
        { nombre: 'Ferretería La Industrial', direccion: 'Av. Gaona 3400, Floresta, CABA', telefono: '011-4683-1122', horarios: 'L-V 7:30-17:30 / S 8:00-12:00', lat: -34.6188, lng: -58.5071, activa: true },
        { nombre: 'Ferretería San José', direccion: 'Av. Mitre 2100, Lanús', telefono: '011-4244-8855', horarios: 'L-V 8:00-18:00 / S 8:00-13:00', lat: -34.7003, lng: -58.4012, activa: true },
        { nombre: 'Ferretería El Tornillo', direccion: 'Boedo 1200, Boedo, CABA', telefono: '011-4957-6644', horarios: 'L-V 8:00-17:00 / S 8:00-12:00', lat: -34.6289, lng: -58.4189, activa: true },
        { nombre: 'Ferretería Americana', direccion: 'Av. Callao 1800, Recoleta, CABA', telefono: '011-4812-3300', horarios: 'L-V 9:00-18:00 / S 9:00-13:00', lat: -34.5934, lng: -58.3942, activa: true },
      ]);
      console.log('  ✓ 10 ferreterías — Buenos Aires');
    }

    // ── PROVEEDORES ──────────────────────────────────────────────────────────
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

    // ── CAPACITACIONES ───────────────────────────────────────────────────────
    const capacitaciones = await capacitacionRepo.find();
    if (capacitaciones.length === 0) {
      await capacitacionRepo.save([
        { nombre: 'Instalación Segura de Gas Residencial', descripcion: 'Normas y procedimientos para instalaciones de gas en viviendas', contenido: 'Módulo 1: Normativa vigente (ENARGAS)\nMódulo 2: Materiales homologados\nMódulo 3: Trazado de cañerías\nMódulo 4: Prueba de hermeticidad\nMódulo 5: Habilitación y documentación', puntosRequeridos: 10, activa: true },
        { nombre: 'Instalaciones Sanitarias Avanzadas', descripcion: 'Técnicas avanzadas para instalaciones de agua y desagüe', contenido: 'Módulo 1: Sistemas de agua fría y caliente\nMódulo 2: Desagüe cloacal y pluvial\nMódulo 3: Equipos sanitarios de última generación\nMódulo 4: Resolución de problemas frecuentes', puntosRequeridos: 15, activa: true },
        { nombre: 'Detección y Reparación de Pérdidas', descripcion: 'Metodologías para detectar y reparar pérdidas de gas y agua', contenido: 'Módulo 1: Equipos de detección\nMódulo 2: Técnicas de reparación sin rotura\nMódulo 3: Materiales de sellado\nMódulo 4: Documentación y seguimiento', puntosRequeridos: 20, activa: true },
        { nombre: 'Calefacción y Climatización', descripcion: 'Sistemas de calefacción a gas: calderas, radiadores y losa radiante', contenido: 'Módulo 1: Tipos de sistemas de calefacción\nMódulo 2: Cálculo de cargas térmicas\nMódulo 3: Instalación de calderas murales\nMódulo 4: Losa radiante y radiadores\nMódulo 5: Mantenimiento preventivo', puntosRequeridos: 25, activa: true },
        { nombre: 'Eficiencia Energética y Certificación', descripcion: 'Certificación en eficiencia energética para instalaciones de gas', contenido: 'Módulo 1: Conceptos de eficiencia energética\nMódulo 2: Equipos de alto rendimiento\nMódulo 3: Auditoría energética\nMódulo 4: Certificación y documentación\nMódulo 5: Presentación ante organismos', puntosRequeridos: 30, activa: true },
      ]);
      console.log('  ✓ 5 capacitaciones con contenido completo');
    }

    // ── TIPOS DE TRABAJO (Bloque 6) ──────────────────────────────────────────
    const tiposTrabajo = await tipoTrabajoRepo.find();
    if (tiposTrabajo.length === 0) {
      await tipoTrabajoRepo.save([
        { id: 1, nombre: 'Instalación de Gas', activo: true },
        { id: 2, nombre: 'Instalación Sanitaria', activo: true },
        { id: 3, nombre: 'Mantenimiento', activo: true },
        { id: 4, nombre: 'Reparación de Urgencia', activo: true },
        { id: 5, nombre: 'Inspección Técnica', activo: true },
      ]);
    }

    // ── USUARIO ADMINISTRADOR ────────────────────────────────────────────────
    console.log('Verificando Usuario Admin...');
    const adminUser = await usuarioRepo.findOne({ where: { email: 'admin@gasnet.com' } });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await usuarioRepo.save(usuarioRepo.create({
        username: 'admin',
        nombre: 'Super Admin',
        email: 'admin@gasnet.com',
        passwordHash: hashedPassword,
        roleId: 1,
        puntosAcumulados: 0,
        activo: true
      }));
      console.log('✅ USUARIO ADMIN CREADO: admin / 123456');
    } else {
      console.log('ℹ️  El usuario Admin ya existe.');
    }

    console.log('\n🚀 SEED COMPLETADO EXITOSAMENTE');
    console.log('   → 60 ítems de Mano de Obra (3 categorías × 20)');
    console.log('   → 20 Accesorios Gasnet con precios');
    console.log('   → 10 Ferreterías en Buenos Aires');
    console.log('   → 5 Capacitaciones con contenido completo');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
