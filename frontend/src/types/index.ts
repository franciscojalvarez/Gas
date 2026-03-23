// User types
export interface User {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellido?: string;
  roleId: number;
  roleNombre?: string;
  puntosAcumulados: number;
}

// Auth types
export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
}

// Bloque 1 types
export interface ManoObraItem {
  id: number;
  nombre: string;
  precio_unitario: number;
  cantidad?: number;
}

export interface PresupuestoManoObra {
  id: number;
  usuario_id?: number;
  fecha_creacion: string;
  total: number;
  items: any;
}

// Bloque 2 types
export interface AccesorioGasnet {
  id: number;
  nombre: string;
  codigo?: string;
  precio_unitario: number;
  cantidad?: number;
}

export interface CompraGasnet {
  id: number;
  usuario_id?: number;
  fecha_creacion: string;
  total: number;
  items: any;
  estado: string;
  metodo_pago?: string;
  referencia_pago?: string;
}

// Bloque 3 types
export interface Proveedor {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Material {
  id: number;
  nombre: string;
  codigo?: string;
  precioUnitario?: number;
  precio_unitario?: number;
  cantidad?: number;
}

export interface PresupuestoMaterial {
  id: number;
  usuario_id?: number;
  proveedor_id: number;
  proveedor_nombre?: string;
  fecha_creacion: string;
  total: number;
  items: any;
}

// Bloque 4 types
export interface TransaccionPunto {
  id: number;
  usuario_id: number;
  tipo: string;
  monto?: number;
  puntos: number;
  descripcion?: string;
  fecha: string;
}

// Bloque 5 types
export interface Capacitacion {
  id: number;
  nombre: string;
  descripcion?: string;
  contenido?: string;
  puntosRequeridos?: number;
  puntos_requeridos?: number;
  activa: boolean;
}

export interface InscripcionCapacitacion {
  id: number;
  usuario_id: number;
  capacitacion_id: number;
  capacitacion_nombre?: string;
  descripcion?: string;
  contenido?: string;
  puntos_requeridos?: number;
  fecha_inscripcion: string;
  estado: string;
}

// Bloque 6 types
export interface TipoTrabajo {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface TrabajoItem {
  id: number;
  nombre: string;
  precioUnitario?: number;
  precio_unitario?: number;
  cantidad?: number;
}

export interface PedidoTrabajo {
  id: number;
  tipo_trabajo_id?: number;
  tipo_trabajo_nombre?: string;
  direccion: string;
  contacto_cliente: string;
  telefono?: string;
  email?: string;
  total: number;
  items: any;
  fecha_creacion: string;
  estado: string;
}

